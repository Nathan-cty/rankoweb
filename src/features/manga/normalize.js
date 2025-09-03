// src/features/manga/normalize.js
export function normalizeMangaForWrite(m) {
  const title = (m.title || "").trim();
  const author = (m.author || "").trim();

  return {
    title,
    author,
    coverUrl: m.coverUrl || "",
    description: m.description || "",
    titleLower: title.toLowerCase(),
    authorLower: author.toLowerCase(),
  };
}
