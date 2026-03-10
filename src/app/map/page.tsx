import NavMenu from "@/components/NavMenu";
import MapClient from "@/components/MapClient";

export default function MapPage() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden md:flex-row">
      <NavMenu />
      <main className="relative flex-1 overflow-hidden">
        <MapClient />
      </main>
    </div>
  );
}
