"use client";

import dynamic from "next/dynamic";

// Load MapLibre GL map client-side only (requires browser APIs)
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-400">
      Loading map…
    </div>
  ),
});

export default function MapClient() {
  return <MapView />;
}
