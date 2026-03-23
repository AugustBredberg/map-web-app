import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { AuthProvider } from "@/context/AuthContext";
import { OrgProvider } from "@/context/OrgContext";
import { DrawerProvider } from "@/context/DrawerContext";
import { NewProjectProvider } from "@/context/NewProjectContext";
import Drawer from "@/components/ui/Drawer";
import { LocaleProvider } from "@/context/LocaleContext";

export const metadata: Metadata = {
  title: "Map Web App",
  description: "Interactive map application built with MapLibre GL JS and Supabase",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <LocaleProvider>
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
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}
