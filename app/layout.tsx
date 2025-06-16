import type React from "react";
import type { Metadata } from "next";
// Adicionamos a importação da nova fonte
import { Playfair_Display, Montserrat, Great_Vibes } from "next/font/google";
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

// Configuração da nova fonte para a logo
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-great-vibes",
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
      {/* Adicionamos a variável da nova fonte ao body */}
      <body
        className={`${playfairDisplay.variable} ${montserrat.variable} ${greatVibes.variable} font-sans bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
