import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { AuthProvider } from "@/context/AuthContext";
import { OrgProvider } from "@/context/OrgContext";
import { DrawerProvider } from "@/context/DrawerContext";
import { NewProjectProvider } from "@/context/NewProjectContext";
import Drawer from "@/components/Drawer";

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
      <body className="antialiased">
        <Providers>
          <AuthProvider>
          <OrgProvider>
            <DrawerProvider>
              <NewProjectProvider>
                {children}
                <Drawer />
              </NewProjectProvider>
            </DrawerProvider>
          </OrgProvider>
        </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
