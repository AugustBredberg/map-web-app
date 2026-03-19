"use client";

import dynamic from "next/dynamic";
import { useLocale } from "@/context/LocaleContext";

function MapLoadingFallback() {
  const { t } = useLocale();
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-400">
      {t("map.loading")}
    </div>
  );
}

// Load MapLibre GL map client-side only (requires browser APIs)
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <MapLoadingFallback />,
});

export default function MapClient() {
  return <MapView />;
}
