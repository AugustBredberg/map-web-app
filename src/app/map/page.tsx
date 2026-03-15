import NavMenu from "@/components/NavMenu";
import MapClient from "@/components/map/MapClient";

export default function MapPage() {
  return (
    <NavMenu>
      <main className="relative flex-1 overflow-hidden">
        <MapClient />
      </main>
    </NavMenu>
  );
}
