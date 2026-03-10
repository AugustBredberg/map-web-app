import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <main className="flex flex-col items-center gap-8 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Map Web App</h1>
        <p className="max-w-md text-lg text-gray-400">
          An interactive mapping platform. Upload and manage geographic objects
          on a live map view.
        </p>
        <Link
          href="/map"
          className="rounded-full bg-blue-600 px-8 py-3 text-base font-semibold transition-colors hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Open Map
        </Link>
      </main>
    </div>
  );
}
