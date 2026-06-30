import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Walyx — Vendé más por WhatsApp",
  description: "Crea tu catálogo online, gestioná tus pedidos y cobrá directo por WhatsApp. La plataforma SaaS para pequeños comercios de LATAM.",
  icons: {
    icon: "/walyx-logo.png",
    shortcut: "/walyx-logo.png",
    apple: "/walyx-logo.png",
  },
  openGraph: {
    title: "Walyx — Vendé más por WhatsApp",
    description: "Crea tu catálogo online y gestioná pedidos directo por WhatsApp.",
    images: ["/walyx-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
