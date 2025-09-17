// src/pages/Favorites.jsx
import { useEffect, useMemo, useState } from "react";
import { listenFavorites } from "@/features/favorites/favoritesApi";
import BackButton from "@/components/BackButton";
import { Link } from "react-router-dom";

// Firebase Storage
import { storage } from "@/lib/firebase";
import { getDownloadURL, ref as storageRef } from "firebase/storage";

/* ---------------- Helpers pour résoudre les URLs ---------------- */
const isHttp = (s) => /^https?:\/\//i.test(s || "");
const isGs = (s) => /^gs:\/\//i.test(s || "");

// Cache simple pour éviter de re-résoudre les mêmes objets Storage
const urlCache = new Map();

async function resolveOne(raw) {
  if (!raw) return "";

  // Cas 1 : déjà une URL http(s)
  if (isHttp(raw)) return raw;

  // Cas 2/3 : gs://bucket/path ou "covers/original/a.jpg" (avec ou sans slash)
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

/** Hook: prend une liste de "raw sources" et renvoie un map { raw: urlFinale }. */
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

/* ---------------- Page ---------------- */
export default function Favorites() {
  const [list, setList] = useState([]);

  useEffect(() => {
    const unsub = listenFavorites(setList);
    return () => unsub?.();
  }, []);

  // Prépare toutes les sources d’images à résoudre (favoris existants)
  const rawCoverList = useMemo(() => {
    const arr = [];
    for (const m of list) {
      // On privilégie m.coverUrl (payload favoris). On gère aussi quelques variantes au cas où.
      const raw = m.coverUrl || m.cover || m.thumb || m.thumbnail || "";
      if (raw) arr.push(raw);
    }
    return arr;
  }, [list]);

  // Map { raw -> url finale } via Storage (ou http direct)
  const resolved = useResolveStorageUrls(rawCoverList);

  return (
    <main className="min-h-screen bg-background text-textc flex">
      <div className="mx-auto w-full max-w-sm flex flex-col gap-4 p-4 flex-1">
        <section className="relative flex-1 rounded-2xl bg-background-card shadow border border-borderc p-4 overflow-auto">
          <div className="mb-3 flex items-center justify-between">
            <BackButton />
            <h1 className="text-lg font-bold w-full text-center">Mes favoris</h1>
            <div className="w-8" />
          </div>

          {list.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-textc-muted">
              Aucun favori pour le moment.
            </div>
          ) : (
            <ul className="space-y-3">
              {list.map((m) => {
                const title = m.title || m.id;
                const raw = m.coverUrl || m.cover || m.thumb || m.thumbnail || "";
                const cover = resolved[raw] || ""; // URL finale (http) ou vide

                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl border border-borderc bg-background-soft px-3 py-2"
                  >
                    <Link
                      to={`/manga/${m.id}`}
                      className="h-12 w-12 rounded bg-background border border-borderc overflow-hidden grid place-items-center text-[10px] text-textc-muted"
                    >
                      {cover ? (
                        <img
                          src={cover}
                          alt={title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        "cover"
                      )}
                    </Link>

                    <Link to={`/manga/${m.id}`} className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{title}</div>
                      <div className="text-xs text-textc-muted truncate">{m.author || ""}</div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
