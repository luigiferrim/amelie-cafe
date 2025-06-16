import type React from "react";
import type { Metadata } from "next";
// A fonte "Great_Vibes" foi removida
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-playfair",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Amélie Café - Lages, SC",
  description:
    "Um pedacinho da França em Lages. Pães de fermentação natural, cafés especiais e um ambiente sofisticado para momentos únicos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      {/* A variável da fonte da logo foi removida do body */}
      <body
        className={`${playfairDisplay.variable} ${montserrat.variable} font-sans bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
