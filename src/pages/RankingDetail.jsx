// src/pages/RankingDetail.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { getMangasByIds } from "@/features/manga/mangaApi";
import AddMangaModal from "@/features/rankings/AddMangaModal";
import BackButton from "@/components/BackButton";
import ManageRankingModal from "@/features/rankings/ManageRankingModal";
import ShareLinkButton from "@/components/ShareLinkButton";

// Infinite slice (réutilisable partout)
import { useInfiniteSlice } from "@/hooks/useInfiniteSlice";

// Firebase Storage
import { getDownloadURL, ref as storageRef } from "firebase/storage";

/* -------------------------------- Helpers -------------------------------- */

const isHttp = (s) => /^https?:\/\//i.test(s || "");
const isGs = (s) => /^gs:\/\//i.test(s || "");

// Cache simple en mémoire pour éviter des résolutions répétées
const urlCache = new Map();

/**
 * Résout une "source" vers une URL utilisable par <img>.
 * - http(s) -> tel quel
 * - gs://bucket/path -> getDownloadURL(path)
 * - "covers/original/a.jpg" (ou "/covers/original/a.jpg") -> getDownloadURL(path)
 */
async function resolveOne(raw) {
  if (!raw) return "";

  if (isHttp(raw)) return raw;

  let objectPath = raw;
  if (isGs(raw)) {
    const m = raw.match(/^gs:\/\/[^/]+\/(.+)$/i);
    objectPath = m ? m[1] : "";
  } else {
    objectPath = raw.replace(/^\/+/, ""); // supprime les / initiaux
  }
  if (!objectPath) return "";

  if (urlCache.has(objectPath)) return urlCache.get(objectPath);
  const url = await getDownloadURL(storageRef(storage, objectPath));
  urlCache.set(objectPath, url);
  return url;
}

/** Hook: résout une liste de "raw" vers des URLs finales. Renvoie { raw: url }. */
function useResolveStorageUrls(rawList) {
  const [map, setMap] = useState({});
  useEffect(() => {
    let alive = true;
    const uniq = Array.from(new Set((rawList || []).filter(Boolean)));
    (async () => {
      const pairs = await Promise.all(
        uniq.map(async (key) => {
          try {
            const url = await resolveOne(key);
            return [key, url];
          } catch {
            return [key, ""];
          }
        })
      );
      if (alive) setMap(Object.fromEntries(pairs));
    })();
    return () => { alive = false; };
  }, [rawList]);
  return map;
}

/* ------------------------------ Composant ------------------------------ */

export default function RankingDetail() {
  const { id } = useParams();

  const [openAdd, setOpenAdd] = useState(false);
  const [openManage, setOpenManage] = useState(false);

  const [title, setTitle] = useState("Mon classement");
  const [items, setItems] = useState([]);         // items = { id, mangaId, position, ... }
  const [mangaDocs, setMangaDocs] = useState([]); // docs /mangas pour affichage
  const [loadingMangas, setLoadingMangas] = useState(false);

  // NEW — états pour la génération de l'URL de partage
  const [ownerHandle, setOwnerHandle] = useState(null); // ex: "nathan"
  const [slug, setSlug] = useState("");                 // ex: "top-2025-shonen"
  const [shortid, setShortid] = useState("");           // ex: "6ie9zq7q" (fallback: id)

  // 1) Titre + méta du classement (one-shot)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "rankings", id));
        if (mounted && snap.exists()) {
          const data = snap.data();
          setTitle(data.title || "Classement");

          // Renseigne les infos d'URL (avec fallbacks)
          setOwnerHandle(data.ownerHandle || data.userHandle || null);
          setSlug(data.slug || "");            // si vide, ShareLinkButton dérivera du title
          setShortid(data.shortid || id);      // fallback: utilise l'id du doc
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

  // Liste ordonnée des IDs de mangas (pour navigation depuis la fiche)
  const orderedMangaIds = useMemo(
    () => items.map((it) => it.mangaId ?? it.id).filter(Boolean),
    [items]
  );

  // 3) À chaque changement d’items → récupérer les docs /mangas correspondants
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

  // Dictionnaire id -> doc
  const mangaById = useMemo(() => {
    const map = new Map();
    for (const m of mangaDocs) map.set(m.id, m);
    return map;
  }, [mangaDocs]);

  // Premier de la liste (pour la cover du ranking)
  const topMangaId = items[0]?.mangaId ?? items[0]?.id;
  const topManga = topMangaId ? mangaById.get(topMangaId) : null;

  /* ----------------- Affichage progressif (20 par 20) ----------------- */
  const {
    visibleCount,
    hasMore,
    loadMore,
    containerRef,
    sentinelRef,
    ioReady,
  } = useInfiniteSlice({
    total: items.length,
    initial: 20,
    step: 20,
  });

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );

  /* ---------- Résolution des covers via Storage ---------- */

  // Prépare les sources d'images à résoudre (cover ranking + vignettes visibles)
  const rawCoverList = useMemo(() => {
    const list = [];
    const topRaw = topManga?.coverThumbUrl || topManga?.sourcescoverUrl || "";
    if (topRaw) list.push(topRaw);
    for (const it of visibleItems) {
      const mid = it.mangaId ?? it.id;
      const m = mangaById.get(mid);
      const raw =
        m?.coverThumbUrl ||
        m?.sourcescoverUrl ||
        it.coverUrl || it.cover || it.thumb || it.thumbnail ||
        "";
      if (raw) list.push(raw);
    }
    return list;
  }, [topManga, visibleItems, mangaById]);

  // Map { raw -> url finale } (http(s) ou résolue depuis Storage)
  const resolved = useResolveStorageUrls(rawCoverList);

  // URL d’image à utiliser pour la cover du ranking (renommage pour éviter toute ambiguïté)
  const rankingTopRaw = topManga?.coverThumbUrl || topManga?.sourcescoverUrl || "";
  const rankingCover = resolved[rankingTopRaw] || "";

  /* ------------------------------ Rendu ------------------------------ */

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
                  decoding="async"
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
            <ShareLinkButton
              title={title}
              ownerHandle={ownerHandle}  // récupéré depuis Firestore
              slug={slug}                // peut être vide, fallback dans le composant
              shortid={shortid}          // fallback: id
              id={id}
              className="text-primary hover:bg-primary/10 focus:ring-primary/30"
            >
              Partager
            </ShareLinkButton>
          </div>

          {/* Liste des mangas (affichage progressif) */}
          <div className="mt-6 flex-1 overflow-auto" ref={containerRef}>
            {items.length === 0 ? (
              <div className="text-center text-sm text-textc-muted py-8">
                Aucun manga dans ce classement.
              </div>
            ) : loadingMangas && mangaDocs.length === 0 ? (
              <div className="text-center text-sm text-textc-muted py-8">
                Chargement…
              </div>
            ) : (
              <>
                <ul className="space-y-3">
                  {visibleItems.map((it, idx) => {
                    const mid = it.mangaId ?? it.id; // identifiant du manga
                    const m = mangaById.get(mid);     // doc depuis /mangas
                    const mangaTitle = m?.title || it.title || mid;
                    const author = m?.author || it.author || "";

                    // Source uniforme (fallbacks alignés avec MangaDetail)
                    const raw =
                      m?.coverThumbUrl ||
                      m?.sourcescoverUrl ||
                      it.coverUrl || it.cover || it.thumb || it.thumbnail ||
                      "";
                    const cover = resolved[raw] || "";

                    const globalIndex = idx; // visibleItems commence à 0 => index global identique

                    return (
                      <li
                        key={it.id}
                        className="flex items-center gap-3 rounded-xl border border-borderc bg-background-soft px-3 py-2"
                      >
                        {/* Numéro (selon la vue) */}
                        <div className="w-6 text-right text-sm tabular-nums text-textc-muted">
                          {globalIndex + 1}.
                        </div>

                        {/* Lien vers la fiche manga avec CONTEXTE DU CLASSEMENT */}
                        <Link
                          to={`/manga/${mid}`}
                          state={{
                            fromRanking: {
                              rankingId: id,
                              ids: orderedMangaIds,
                              index: globalIndex,
                            },
                          }}
                          className="flex items-center gap-3 flex-1 min-w-0"
                        >
                          <div className="h-12 w-12 rounded bg-background border border-borderc grid place-items-center text-[10px] text-textc-muted overflow-hidden">
                            {cover ? (
                              <img
                                src={cover}
                                alt={mangaTitle}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              "cover"
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{mangaTitle}</div>
                            <div className="text-xs text-textc-muted truncate">{author}</div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* Sentinelle pour auto-chargement */}
                <div ref={sentinelRef} style={{ height: 1 }} />

                {/* Fallback / Fin de liste */}
                <div className="py-2 text-center">
                  {!hasMore && items.length > 0 && (
                    <p className="text-xs text-textc-muted">— Fin de la liste —</p>
                  )}
                  {hasMore && (
                    <button
                      type="button"
                      onClick={loadMore}
                      className="mt-2 text-sm underline text-textc-muted hover:text-textc"
                    >
                      {ioReady ? "Charger plus (si besoin)" : "Charger plus"}
                    </button>
                  )}
                </div>
              </>
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
