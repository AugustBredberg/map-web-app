import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Map Web App",
  description: "Interactive map application built with MapLibre GL JS and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
