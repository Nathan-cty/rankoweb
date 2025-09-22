// src/pages/RankingDetail.jsx
import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { getMangasByIds } from "@/features/manga/mangaApi";
import AddMangaModal from "@/features/rankings/AddMangaModal";
import BackButton from "@/components/BackButton";
import ManageRankingModal from "@/features/rankings/ManageRankingModal";
import ShareLinkButton from "@/components/ShareLinkButton";

// ✅ import auth pour connaître l’utilisateur courant
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
    return () => {
      alive = false;
    };
  }, [rawList]);
  return map;
}

/* --------------------------- Slug & handle helpers --------------------------- */

const slugify = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);

// Va chercher un handle depuis /users/{ownerUid}
// Va chercher le handle courant dans /users/{ownerUid}
// 👉 priorité: username (nouveau) > handle (ancien) > email/displayName
async function fetchOwnerHandle(ownerUid) {
  if (!ownerUid) return null;
  try {
    const uref = doc(db, "users", ownerUid);
    const usnap = await getDoc(uref);
    if (!usnap.exists()) return null;
    const u = usnap.data();
    const fromEmail =
      (u.email && String(u.email).split("@")[0]) ||
      (u.displayName && u.displayName) ||
      null;

    return (
      (u.username && String(u.username)) ||
      (u.handle && String(u.handle)) ||
      fromEmail
    );
  } catch {
    return null;
  }
}


/* --------------------------- Petits composants --------------------------- */

function KebabIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden {...props}>
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function ModalBase({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-borderc bg-background-card p-4 shadow">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function RenameDialog({ initial, onSubmit, onCancel, loading = false }) {
  const [val, setVal] = useState(initial || "");
  useEffect(() => setVal(initial || ""), [initial]);
  return (
    <ModalBase title="Renommer le classement" onClose={onCancel}>
      <label className="text-sm text-textc-muted">Nouveau nom</label>
      <input
        autoFocus
        className="mt-1 w-full rounded border border-borderc bg-background-soft px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Mon nouveau classement"
      />
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onCancel} disabled={loading}>
          Annuler
        </button>
        <button
          className="btn-brand"
          onClick={() => onSubmit(val.trim())}
          disabled={!val.trim() || loading}
        >
          {loading ? "Enregistrement…" : "Renommer"}
        </button>
      </div>
    </ModalBase>
  );
}

function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, loading = false }) {
  return (
    <ModalBase title={title} onClose={onCancel}>
      <p className="text-sm text-textc">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onCancel} disabled={loading}>
          Annuler
        </button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Suppression…" : confirmLabel}
        </button>
      </div>
    </ModalBase>
  );
}

/* ------------------------------ Composant ------------------------------ */

export default function RankingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ état pour l’utilisateur courant et l’ownerUid du classement
  const [currentUid, setCurrentUid] = useState(null);
  const [ownerUid, setOwnerUid] = useState(null);

  // Abonnement auth (ne change PAS la logique de lien)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUid(user?.uid || null);
    });
    return () => unsub();
  }, []);

  const [openAdd, setOpenAdd] = useState(false);
  const [openManage, setOpenManage] = useState(false);

  const [title, setTitle] = useState("Mon classement");
  const [items, setItems] = useState([]); // items = { id, mangaId, position, ... }
  const [mangaDocs, setMangaDocs] = useState([]); // docs /mangas pour affichage
  const [loadingMangas, setLoadingMangas] = useState(false);

  // États URL de partage
  const [ownerHandle, setOwnerHandle] = useState(null); // ex: "nathan"
  const [slug, setSlug] = useState(""); // ex: "top-2025-shonen"
  const [shortid, setShortid] = useState(""); // ex: "6ie9zq7q" (fallback: id)

  // Kebab menu & modales locales
  const [menuOpen, setMenuOpen] = useState(false);
  const [openRename, setOpenRename] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const menuRef = useRef(null);

  // Ferme le menu au clic extérieur / échappe
  useEffect(() => {
    function onDown(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

// 1) Titre + méta du classement (one-shot) + sync ownerHandle/slug
useEffect(() => {
  let mounted = true;
  (async () => {
    try {
      const ref = doc(db, "rankings", id);
      const snap = await getDoc(ref);
      if (!mounted || !snap.exists()) return;

      const data = snap.data();

      // ✅ on récupère aussi ownerUid (pour savoir si l'utilisateur est propriétaire)
      setOwnerUid(data.ownerUid || null);

      // 👇 handle live depuis /users/{ownerUid} (username > handle)
      const liveHandle = await fetchOwnerHandle(data.ownerUid);
      const computedHandle = liveHandle || data.ownerHandle || data.userHandle || null;

      const computedSlug = data.slug || slugify(data.title || "");

      // Patch si manquant ou si ça a changé
      const patch = {};
      if (computedHandle && data.ownerHandle !== computedHandle) patch.ownerHandle = computedHandle;
      if (!data.slug) patch.slug = computedSlug;
      if (Object.keys(patch).length) {
        try {
          await updateDoc(ref, patch);
        } catch (e) {
          console.warn("Patch ownerHandle/slug failed (non-blocking):", e);
        }
      }

      setTitle(data.title || "Classement");
      setOwnerHandle(computedHandle || null); // ← on met le handle LIVE dans l’état
      setSlug(computedSlug);
      setShortid(data.shortid || id);
    } catch (e) {
      console.error(e);
    }
  })();
  return () => { mounted = false; };
}, [id]);

// 2) Items en temps réel (triés par position)
useEffect(() => {
  if (!id) return;
  const qy = query(
    collection(db, "rankings", id, "items"),
    orderBy("position", "asc")
  );
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



  // ✅ calcul propriétaire (n’impacte pas la logique des liens)
  const isOwner = !!currentUid && !!ownerUid && currentUid === ownerUid;

  // Liste ordonnée des IDs de mangas (pour navigation depuis la fiche)
  const orderedMangaIds = useMemo(
    () => items.map((it) => it.mangaId ?? it.id).filter(Boolean),
    [items]
  );

  // 3) À chaque changement d’items → récupérer les docs /mangas correspondants
  useEffect(() => {
    const ids = orderedMangaIds;
    if (ids.length === 0) {
      setMangaDocs([]);
      return;
    }
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
        it.coverUrl ||
        it.cover ||
        it.thumb ||
        it.thumbnail ||
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

  /* -------------------------- Actions classement ------------------------- */

  async function handleRename(newName) {
    const val = (newName || "").trim();
    if (!val || val === title) {
      setOpenRename(false);
      return;
    }
    try {
      setIsWorking(true);
      const ref = doc(db, "rankings", id);
      const newSlug = slugify(val); // si tu veux un slug stable, enlève cette ligne et le champ slug ci-dessous
      await updateDoc(ref, { title: val, slug: newSlug });
      setTitle(val);
      setSlug(newSlug);
      setOpenRename(false);
    } catch (e) {
      console.error(e);
      alert("Impossible de renommer le classement pour le moment.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleDeleteRanking() {
    try {
      setIsWorking(true);
      // Supprime les items en lots (limite 500 opérations / batch)
      const itemsCol = collection(db, "rankings", id, "items");
      const snap = await getDocs(itemsCol);
      const docsArr = snap.docs;
      const CHUNK = 400; // marge de sécurité
      for (let i = 0; i < docsArr.length; i += CHUNK) {
        const batch = writeBatch(db);
        for (const d of docsArr.slice(i, i + CHUNK)) batch.delete(d.ref);
        await batch.commit();
      }
      // Puis supprime le doc classement
      await deleteDoc(doc(db, "rankings", id));
      setOpenConfirmDelete(false);
      // Redirige vers la page précédente (ou /)
      try {
        navigate(-1);
      } catch {
        navigate("/");
      }
    } catch (e) {
      console.error(e);
      alert("La suppression a échoué. Réessayez plus tard.");
    } finally {
      setIsWorking(false);
    }
  }

  /* ------------------------------ Rendu ------------------------------ */

  return (
    <main className="min-h-screen bg-background text-textc flex">
      <div className="mx-auto w-full max-w-sm flex-1 p-4">
        <section className="relative rounded-2xl bg-background-card shadow border border-borderc p-4 flex flex-col">
          {/* Header: Back à gauche + menu à droite */}
          <div className="mb-2 flex items-center justify-between">
            <BackButton unauthTo="/dashboard" fallback="/dashboard" />

            {/* ✅ menu visible uniquement pour le propriétaire */}
            {isOwner && (
              <div className="relative" ref={menuRef}>
                <button
                  aria-label="Plus d'options"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-2 rounded-full hover:bg-background-soft focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <KebabIcon className="fill-current" />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-borderc bg-background-card shadow z-20"
                  >
                    <button
                      role="menuitem"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-background-soft"
                      onClick={() => {
                        setMenuOpen(false);
                        setOpenRename(true);
                      }}
                    >
                      Renommer le classement
                    </button>
                    <div className="h-px bg-borderc" />
                    <button
                      role="menuitem"
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50/10 hover:text-red-600"
                      onClick={() => {
                        setMenuOpen(false);
                        setOpenConfirmDelete(true);
                      }}
                    >
                      Supprimer le classement
                    </button>
                  </div>
                )}
              </div>
            )}
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

          {/* Actions principales */}
          <div className="mt-6 flex justify-center gap-3">
            {/* ✅ boutons visibles uniquement pour le propriétaire */}
            {isOwner && (
              <>
                <button className="btn-brand" onClick={() => setOpenAdd(true)}>
                  Ajouter
                </button>
                <button className="btn-ghost" onClick={() => setOpenManage(true)}>
                  Modifier
                </button>
              </>
            )}
            <ShareLinkButton
              title={title}
              ownerHandle={ownerHandle}  // pour /{username}/{slug}
              slug={slug}                // peut être vide (dérivé du title dans le bouton)
              shortid={shortid}          // fallback: id court
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
              <div className="text-center text-sm text-textc-muted py-8">Chargement…</div>
            ) : (
              <>
                <ul className="space-y-3">
                  {visibleItems.map((it, idx) => {
                    const mid = it.mangaId ?? it.id; // identifiant du manga
                    const m = mangaById.get(mid); // doc depuis /mangas
                    const mangaTitle = m?.title || it.title || mid;
                    const author = m?.author || it.author || "";

                    // Source uniforme (fallbacks alignés avec MangaDetail)
                    const raw =
                      m?.coverThumbUrl ||
                      m?.sourcescoverUrl ||
                      it.coverUrl ||
                      it.cover ||
                      it.thumb ||
                      it.thumbnail ||
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

      {/* Modales existantes — montées seulement si propriétaire */}
      {isOwner && openAdd && (
        <AddMangaModal
          rankingId={id}
          existingIds={items.map((it) => it.mangaId ?? it.id)}
          onClose={() => setOpenAdd(false)}
        />
      )}

      {isOwner && openManage && (
        <ManageRankingModal rankingId={id} onClose={() => setOpenManage(false)} />
      )}

      {/* Modales locales : Renommer / Supprimer — seulement si propriétaire */}
      {isOwner && openRename && (
        <RenameDialog
          initial={title}
          loading={isWorking}
          onSubmit={handleRename}
          onCancel={() => setOpenRename(false)}
        />
      )}

      {isOwner && openConfirmDelete && (
        <ConfirmDialog
          title="Supprimer le classement ?"
          message="Cette action est définitive et supprimera aussi les éléments du classement."
          confirmLabel="Supprimer"
          onConfirm={handleDeleteRanking}
          onCancel={() => setOpenConfirmDelete(false)}
          loading={isWorking}
        />
      )}
    </main>
  );
}
