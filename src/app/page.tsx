import { Suspense } from "react";
import LandingPage from "@/components/landing/LandingPage";

function LandingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SpinnerFallback />
    </div>
  );
}

function SpinnerFallback() {
  return (
    <div
      className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
      aria-hidden
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LandingFallback />}>
      <LandingPage />
    </Suspense>
  );
}
