import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMangasByIds } from "@/features/manga/mangaApi"; // ⬅️ nouveau
import AddMangaModal from "@/features/rankings/AddMangaModal";
import BackButton from "@/components/BackButton";
import ManageRankingModal from "@/features/rankings/ManageRankingModal";

export default function RankingDetail() {
  const { id } = useParams();

  const [openAdd, setOpenAdd] = useState(false);
  const [openManage, setOpenManage] = useState(false);

  const [title, setTitle] = useState("Mon classement");
  const [items, setItems] = useState([]);      // items = { id, mangaId, position, ... }
  const [mangaDocs, setMangaDocs] = useState([]); // docs de /mangas pour affichage
  const [loadingMangas, setLoadingMangas] = useState(false);

  // 1) Titre du classement (one-shot)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "rankings", id));
        if (mounted && snap.exists()) {
          const data = snap.data();
          setTitle(data.title || "Classement");
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // 2) Items en temps réel (triés par position)
  useEffect(() => {
    if (!id) return;
    const qy = query(collection(db, "rankings", id, "items"), orderBy("position", "asc"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(list);
      },
      (err) => console.error("Items listener error:", err)
    );
    return () => unsub();
  }, [id]);

  // Liste ordonnée des IDs de mangas pour navigation depuis la fiche
  const orderedMangaIds = useMemo(
    () => items.map((it) => it.mangaId ?? it.id).filter(Boolean),
    [items]
  );

  // 3) À chaque changement d’items → récupérer les fiches /mangas correspondantes
  useEffect(() => {
    const ids = orderedMangaIds;
    if (ids.length === 0) { setMangaDocs([]); return; }
    setLoadingMangas(true);
    (async () => {
      try {
        const docs = await getMangasByIds(ids); // lit dans /mangas
        // Remettre dans l’ordre du ranking
        const orderMap = new Map(ids.map((mid, i) => [mid, i]));
        docs.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
        setMangaDocs(docs);
      } catch (e) {
        console.error(e);
        setMangaDocs([]);
      } finally {
        setLoadingMangas(false);
      }
    })();
  }, [orderedMangaIds]);

  // Dictionnaire id -> doc (utile si tu veux fusionner avec les items)
  const mangaById = useMemo(() => {
    const map = new Map();
    for (const m of mangaDocs) map.set(m.id, m);
    return map;
  }, [mangaDocs]);
  
  // 1) ID du manga en position 1 (le 1er de la liste triée)
  const topMangaId = items[0]?.mangaId ?? items[0]?.id;

  // 2) Doc /mangas correspondant (si déjà chargé)
  const topManga = topMangaId ? mangaById.get(topMangaId) : null;

  // 3) URL d’image à utiliser pour la cover du ranking
  const rankingCover = topManga?.coverThumbUrl || ""; // ou coverLarge si tu préfères

  return (
    <main className="min-h-screen bg-background text-textc flex">
      <div className="mx-auto w-full max-w-sm flex-1 p-4">
        <section className="relative rounded-2xl bg-background-card shadow border border-borderc p-4 flex flex-col">
          <div className="mb-2">
            <BackButton />
          </div>

          {/* Image du classement (optionnelle) */}
          <div className="w-full flex justify-center mt-2">
            <div className="h-[190px] w-[190px] rounded-xl overflow-hidden border border-borderc bg-background-soft">
              {rankingCover ? (
                <img
                  src={rankingCover}
                  alt="Couverture"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-xs text-textc-muted">
                  Pas d’image
                </div>
              )}
            </div>
          </div>

          {/* Titre + compteur basé sur la LISTE réelle */}
          <div className="mt-4 text-center">
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="muted text-sm mt-1">{items.length} manga(s)</p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-center gap-3">
            <button className="btn-brand" onClick={() => setOpenAdd(true)}>
              Ajouter
            </button>
            <button className="btn-ghost" onClick={() => setOpenManage(true)}>
              Modifier
            </button>
          </div>

          {/* Liste des mangas (affichés depuis /mangas) */}
          <div className="mt-6 flex-1 overflow-auto">
            {items.length === 0 ? (
              <div className="text-center text-sm text-textc-muted py-8">
                Aucun manga dans ce classement.
              </div>
            ) : loadingMangas && mangaDocs.length === 0 ? (
              <div className="text-center text-sm text-textc-muted py-8">
                Chargement…
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((it, idx) => {
                  const mid = it.mangaId ?? it.id; // identifiant du manga
                  const m = mangaById.get(mid);     // doc depuis /mangas
                  const title = m?.title || it.title || mid;
                  const author = m?.author || it.author || "";
                  const cover = m?.coverThumbUrl || it.coverUrl || ""; // fallback

                  return (
                    <li
                      key={it.id}
                      className="flex items-center gap-3 rounded-xl border border-borderc bg-background-soft px-3 py-2"
                    >
                      {/* Numéro */}
                      <div className="w-6 text-right text-sm tabular-nums text-textc-muted">
                        {idx + 1}.
                      </div>

                      {/* Lien vers la fiche manga avec CONTEXTE DU CLASSEMENT */}
                      <Link
                        to={`/manga/${mid}`}
                        state={{
                          fromRanking: {
                            rankingId: id,
                            ids: orderedMangaIds, // ordre du classement
                            index: idx,           // position actuelle
                          },
                        }}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div className="h-12 w-12 rounded bg-background border border-borderc grid place-items-center text-[10px] text-textc-muted overflow-hidden">
                          {cover ? (
                            <img
                              src={cover}
                              alt={title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            "cover"
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{title}</div>
                          <div className="text-xs text-textc-muted truncate">{author}</div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Modales */}
      {openAdd && (
        <AddMangaModal
          rankingId={id}
          existingIds={items.map((it) => it.mangaId ?? it.id)}
          onClose={() => setOpenAdd(false)}
        />
      )}

      {openManage && (
        <ManageRankingModal
          rankingId={id}
          onClose={() => setOpenManage(false)}
        />
      )}
    </main>
  );
}
