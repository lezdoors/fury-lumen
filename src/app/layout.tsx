import type { Metadata } from "next";
import { Instrument_Serif, Inter_Tight, Martian_Mono } from "next/font/google";
import "./globals.css";
import { CATALOG_SIZE } from "@/lib/catalog";

/* The three faces tokens.css asks for. Loaded here rather than linked, so the
   display serif is not swapped in halfway through the hero's entrance. */
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const ui = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

const figure = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-figure",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fury-lumen.vercel.app"),
  title: "Lumen — the price is on the button",
  description:
    `${CATALOG_SIZE} image and video models in one prompt box — Veo 3.1, Seedance, Kling, Wan, Nano Banana, Seedream. The exact dollar cost sits on the button before you press it. No credits, no subscription.`,
  openGraph: {
    title: "Lumen — the price is on the button",
    description:
      `Pay per generation, in dollars, across ${CATALOG_SIZE} image and video models. See the price before you click.`,
    images: ["/showcase/s1-horizon.webp"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable} ${figure.variable}`}>
      <body>{children}</body>
    </html>
  );
}
