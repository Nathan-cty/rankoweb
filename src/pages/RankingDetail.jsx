// src/pages/RankingDetail.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AddMangaModal from "@/features/rankings/AddMangaModal";
import BackButton from "@/components/BackButton";
import { Link } from "react-router-dom";
import ManageRankingModal from "@/features/rankings/ManageRankingModal"; // ← NEW

export default function RankingDetail() {
  const { id } = useParams();
  const [openAdd, setOpenAdd] = useState(false);
  const [title, setTitle] = useState("Mon classement");
  const [itemsCount, setItemsCount] = useState(0);
  const [coverUrl] = useState("");
  const [items, setItems] = useState([]);
  const [openManage, setOpenManage] = useState(false);

  const [error] = useState("");              // ← NEW


  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "rankings", id));
        if (mounted && snap.exists()) {
          const data = snap.data();
          setTitle(data.title || "Classement");
          setItemsCount(data.itemsCount || 0);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "rankings", id, "items"), orderBy("position", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(list);
      },
      (err) => console.error("Items listener error:", err)
    );
    return () => unsub();
  }, [id]);

 

  return (
    <main className="min-h-screen bg-background text-textc flex">
      <div className="mx-auto w-full max-w-sm flex-1 p-4">
        <section className="relative rounded-2xl bg-background-card shadow border border-borderc p-4 flex flex-col">
          <div className="mb-2">
            <BackButton />
          </div>

          {/* Image */}
          <div className="w-full flex justify-center mt-2">
            <div className="h-[190px] w-[190px] rounded-xl overflow-hidden border border-borderc bg-background-soft">
              {coverUrl ? (
                <img src={coverUrl} alt="Couverture" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-xs text-textc-muted">
                  Pas d’image
                </div>
              )}
            </div>
          </div>

          {/* Titre + compteur */}
          <div className="mt-4 text-center">
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="muted text-sm mt-1">{itemsCount} manga(s)</p>
          </div>

          {/* Actions */}
         <div className="mt-6 flex justify-center gap-3">
  <button
    className="btn-brand"
    onClick={() => setOpenAdd(true)}
  >
    Ajouter
  </button>

  <button
    className="btn-ghost"
    onClick={() => setOpenManage(true)}
  >
    Modifier
  </button>
</div>

{/* modale de gestion ouverte si openManage */}
{openManage && (
  <ManageRankingModal rankingId={id} onClose={() => setOpenManage(false)} />
)}


          {error && (
            <p className="mt-3 rounded border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-300">
              {error}
            </p>
          )}

          {/* Liste des mangas */}
          <div className="mt-6 flex-1 overflow-auto">
            {items.length === 0 ? (
              <div className="text-center text-sm text-textc-muted py-8">
                Aucun manga dans ce classement.
              </div>
            ) : (
              <ul className="space-y-3">
  {items.map((it, idx) => {
    const mid = it.mangaId ?? it.id; // doc id = mangaId dans ton modèle
    return (
      <li
        key={it.id}
        className="flex items-center gap-3 rounded-xl border border-borderc bg-background-soft px-3 py-2"
      >
        {/* Numéro */}
        <div className="w-6 text-right text-sm tabular-nums text-textc-muted">
          {idx + 1}.
        </div>

        {/* Lien vers la fiche manga : cover + infos */}
        <Link
          to={`/manga/${mid}`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="h-12 w-12 rounded bg-background border border-borderc grid place-items-center text-[10px] text-textc-muted overflow-hidden">
            {it.coverUrl ? (
              <img src={it.coverUrl} alt={it.title || mid} className="h-full w-full object-cover" />
            ) : (
              "cover"
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {it.title || mid}
            </div>
            <div className="text-xs text-textc-muted truncate">
              {it.author || ""}
            </div>
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

      {openAdd && (
        <AddMangaModal
          rankingId={id}
          initialCount={itemsCount}
          onClose={() => setOpenAdd(false)}
          onAdded={({ added, newTotal }) => {
            setItemsCount(newTotal ?? itemsCount + added);
          }}
        />
      )}
    </main>
  );
}
