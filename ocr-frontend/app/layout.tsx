import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SideNavProvider } from "@/context/SideNavContext";
import NavBar from "@/components/navigation/NavBar";
import { Providers } from "@/context/provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OCR Suite",
  description: "Created by EMMD474",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-red-500`}
      >
        <div className="min-h-screen w-full bg-gray-100 dark:bg-gray-900 text-black">
          <SideNavProvider>
           <Providers>
            <div>
              {children}
            </div>
          </Providers>
          </SideNavProvider>
        </div>
      </body>
    </html>
  );
}
