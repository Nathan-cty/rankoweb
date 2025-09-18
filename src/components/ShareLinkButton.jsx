// src/components/ShareLinkButton.jsx
import { useEffect, useMemo, useState } from "react";
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
function buildPrettyUrl({ origin, handle, slug, shortid, id }) {
  if (handle && slug) return `${origin}/@${handle}/${slug}`;
  if (slug && shortid) return `${origin}/r/${slug}-${shortid}`;
  if (id) return `${origin}/rankings/${id}`;
  return origin;
}
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
/**
 * Props
 * - title        : string (titre du classement)
 * - ownerHandle  : string|null (ex. "nathan")
 * - slug         : string|null (si absent, dérivé du title)
 * - shortid      : string|null (si absent, fallback id)
 * - id           : string (id Firestore)
 * - className    : classes supplémentaires (pour surcharger la couleur)
 *
 * Couleur primaire :
 * - Par défaut: classes Tailwind "text-primary hover:bg-primary/10 focus:ring-primary/30".
 * - Si ta couleur primaire est custom (ex. --brand), passe className="text-[var(--brand)] hover:bg-[color-mix(in_oklab,var(--brand)_10%,transparent)] focus:ring-[color-mix(in_oklab,var(--brand)_30%,transparent)]"
 */
export default function ShareLinkButton({
  title = "Mon classement",
  ownerHandle = null,
  slug,
  shortid,
  id,
  className = "text-primary hover:bg-primary/10 focus:ring-primary/30",
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let t;
    return () => { if (t) clearTimeout(t); };
  }, []);

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
      text: `Découvre mon classement "${title}" sur Ranko Manga`,
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
    setTimeout(() => setCopied(false), 1500);
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
