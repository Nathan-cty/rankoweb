import { Outlet } from "react-router-dom";
import Footer from "@/components/Footer";

// Optionnel : tu peux ajouter un Header ici si besoin
export default function SiteLayout() {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-textc">
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
