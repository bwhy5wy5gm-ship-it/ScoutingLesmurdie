import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FRC Scout",
  description: "FRC Robotics Scouting Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <AuthProvider>
          <AuthGuard>
            <ThemeProvider>
              <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 md:ml-64 pt-16 md:pt-0">
                  <div className="p-6 page-enter">{children}</div>
                </main>
              </div>
            </ThemeProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
