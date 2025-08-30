export const MANGA_SAMPLE = [
  { id: "one-piece", title: "One Piece", author: "Eiichiro Oda", coverUrl: "/cover/onepiece.webp", description: "Aventure pirate, Grand Line." },
  { id: "naruto", title: "Naruto", author: "Masashi Kishimoto", coverUrl: "/cover/naruto.jpg", description: "Ninja et quête de pouvoir." },
  { id: "bleach", title: "Bleach", author: "Tite Kubo", coverUrl: "/cover/bleach.png", description: "Shinigami et combats d'âmes." },
  { id: "jjk", title: "Jujutsu Kaisen", author: "Gege Akutami", coverUrl: "/cover/jjk.webp", description: "Sorciers et malédictions." },
  { id: "aot", title: "Attack on Titan", author: "Hajime Isayama", coverUrl: "/cover/aot.jpg", description: "Humains contre Titans." },
  { id: "opm", title: "One Punch Man", author: "ONE / Yusuke Murata", coverUrl:"", description: "Héros surpuissant et ennui." },
  { id: "demonslayer", title: "Demon Slayer", author: "Koyoharu Gotouge", coverUrl: "/cover/demonslayer.jpg", description: "Démons et chasseurs." },
  { id: "chainsaw", title: "Chainsaw Man", author: "Tatsuki Fujimoto", coverUrl: "/cover/chainsaw.jpg", description: "Diables et contrats." },
  { id: "haikyuu", title: "Haikyu!!", author: "Haruichi Furudate", coverUrl: "/cover/haikyuu.jpg", description: "Volleyball et camaraderie." },
  { id: "deathnote", title: "Death Note", author: "Tsugumi Ohba / Takeshi Obata", coverUrl: "/cover/deathnote.jpg", description: "Justice et moralité." },
  { id: "fmab", title: "Fullmetal Alchemist", author: "Hiromu Arakawa", coverUrl: "/cover/fmab.webp", description: "Alchimie et rédemption." },
  { id: "hxH", title: "Hunter x Hunter", author: "Yoshihiro Togashi", coverUrl: "/cover/hxh.jpg", description: "Chasseurs et aventures." },
];


export function getMangaById(id) {
  return MANGA_SAMPLE.find((m) => m.id === id);
}