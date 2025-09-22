// src/pages/RankingResolver.jsx
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

export default function RankingResolver() {
  const { username, slug, slugShort } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        let id = null;

        if (username && slug) {
          // Résoudre par (ownerHandle, slug) — uniquement pour les classements publics
          const q = query(
            collection(db, "rankings"),
            where("ownerHandle", "==", username),
            where("slug", "==", slug),
            where("visibility", "==", "public"),
            limit(1)
          );
          const snap = await getDocs(q);
          id = snap.docs[0]?.id ?? null;
        } else if (slugShort) {
          // Fallback pour /r/:slugShort (ex: "manga-shonen-abc123")
          const shortid = String(slugShort).split("-").pop();
          const q = query(
            collection(db, "rankings"),
            where("shortid", "==", shortid),
            where("visibility", "==", "public"),
            limit(1)
          );
          const snap = await getDocs(q);
          id = snap.docs[0]?.id ?? null;
        }

        if (id) {
          navigate(`/rankings/${id}`, { replace: true });
        } else {
          navigate("/dashboard", { replace: true }); // ou vers /404 si tu en as une
        }
      } catch (e) {
        console.error("RankingResolver error:", e);
        navigate("/dashboard", { replace: true });
      }
    })();
  }, [username, slug, slugShort, navigate]);

  return null; // ou spinner si tu veux
}
