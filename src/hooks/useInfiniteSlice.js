import { useEffect, useRef, useState } from "react";

/**
 * useInfiniteSlice
 * Gère l'affichage progressif d'une liste par paliers (ex: 20 par 20).
 *
 * @param {object} opts
 * @param {number} opts.total         - Longueur totale de la liste
 * @param {number} [opts.initial=20]  - Nombre d'items visibles au départ
 * @param {number} [opts.step=20]     - Incrément à chaque chargement
 * @param {React.RefObject} [opts.rootRef] - Ref d'un conteneur scroll custom (sinon, containerRef interne)
 * @param {string} [opts.rootMargin="200px 0px"] - marge de déclenchement
 */
export function useInfiniteSlice({
  total,
  initial = 20,
  step = 20,
  rootRef,
  rootMargin = "200px 0px",
}) {
  const [visibleCount, setVisibleCount] = useState(initial);
  const [ioReady, setIoReady] = useState(false);

  const containerRef = useRef(null); // à mettre sur le conteneur scrollable si pas de rootRef
  const sentinelRef = useRef(null);  // la sentinelle en bas de liste

  const hasMore = visibleCount < (total ?? 0);

  const loadMore = () =>
    setVisibleCount((v) => Math.min(v + step, total ?? v + step));

  // Quand total change (ex: ajout/suppression), on recadre le visibleCount
  useEffect(() => {
    setVisibleCount((prev) =>
      Math.min(Math.max(initial, prev), total || initial)
    );
  }, [total, initial]);

  // IntersectionObserver pour déclencher loadMore au scroll
  useEffect(() => {
    const rootEl = rootRef?.current ?? containerRef.current;
    const target = sentinelRef.current;
    if (!rootEl || !target) return;

    let ticking = false;
    const onIntersect = (entries) => {
      const e = entries[0];
      if (e.isIntersecting && hasMore && !ticking) {
        ticking = true;
        Promise.resolve().then(() => {
          loadMore();
          ticking = false;
        });
      }
    };

    const io = new IntersectionObserver(onIntersect, {
      root: rootEl,
      rootMargin,
      threshold: 0.01,
    });

    io.observe(target);
    setIoReady(true);

    return () => {
      io.disconnect();
      setIoReady(false);
    };
  }, [hasMore, rootRef, rootMargin]);

  const reset = (n = initial) => setVisibleCount(n);

  return {
    visibleCount,
    hasMore,
    loadMore,
    reset,
    containerRef, // -> ref={containerRef} sur le conteneur scrollable si tu n'utilises pas rootRef
    sentinelRef,  // -> ref={sentinelRef} sur un <div /> après la liste
    ioReady,
  };
}
