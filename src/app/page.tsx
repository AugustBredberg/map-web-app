"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

export default function Home() {
  const { t } = useLocale();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <main className="flex flex-col items-center gap-8 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight">{t("home.title")}</h1>
        <p className="max-w-md text-lg text-gray-400">
          {t("home.description")}
        </p>
        <Link
          href="/map"
          className="cursor-pointer rounded-full bg-blue-600 px-8 py-3 text-base font-semibold transition-colors hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          {t("home.openMap")}
        </Link>
      </main>
    </div>
  );
}
