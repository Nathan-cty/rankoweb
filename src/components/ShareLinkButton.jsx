// src/components/ShareLinkButton.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Share2, Check } from "lucide-react";

/* -------------------------- Helpers URL & clipboard -------------------------- */
function slugify(s) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);
}

// ✅ 1) Lien “joli” voulu: /{username}/{slug}
// Fallbacks inchangés si handle ou slug manquent.
function buildPrettyUrl({ origin, handle, slug, shortid, id }) {
  if (handle && slug) return `${origin}/${handle}/${slug}`; // ✅
  if (slug && shortid) return `${origin}/rankings/${slug}-${shortid}`;
  if (id) return `${origin}/rankings/${id}`;
  return origin;
}


// 2) URL canonique stable (garde un identifiant pour éviter les collisions)
function buildCanonicalUrl({ origin, slug, shortid, id }) {
  if (slug && shortid) return `${origin}/r/${slug}-${shortid}`;
  if (id) return `${origin}/rankings/${id}`;
  return origin;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

/* ------------------------------- Le composant ------------------------------- */
export default function ShareLinkButton({
  title = "Mon classement",
  ownerHandle = null, // ex: "nathan" -> {username}
  slug,               // si non fourni, dérivé du title
  shortid,            // fallback
  id,                 // fallback
  className = "text-primary hover:bg-primary/10 focus:ring-primary/30",
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://ranko-manga.com";

  const safeSlug = useMemo(() => slug || slugify(title), [slug, title]);
  const safeShortId = shortid || id || "";

  const prettyUrl = useMemo(
    () => buildPrettyUrl({ origin, handle: ownerHandle, slug: safeSlug, shortid: safeShortId, id }),
    [origin, ownerHandle, safeSlug, safeShortId, id]
  );
  const canonicalUrl = useMemo(
    () => buildCanonicalUrl({ origin, slug: safeSlug, shortid: safeShortId, id }),
    [origin, safeSlug, safeShortId, id]
  );

  const shareUrl = prettyUrl || canonicalUrl;

  const handleShare = async () => {
    const data = {
      title,
      text: `Découvre mon classement "${title}"`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
    } catch {
      // si l'utilisateur annule, on continue vers la copie
    }
    await copyToClipboard(shareUrl);
    setCopied(true);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      title={shareUrl}
      aria-label="Partager le lien du classement"
      className={
        "inline-flex h-9 w-9 items-center justify-center rounded-lg p-0 " +
        "focus:outline-none focus:ring-2 " + className
      }
    >
      {copied ? <Check size={18} strokeWidth={2} /> : <Share2 size={18} strokeWidth={2} />}
    </button>
  );
}
