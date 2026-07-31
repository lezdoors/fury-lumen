import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumen — pay per generation",
  description:
    "Describe it, pick a model, generate. Pay per generation instead of a subscription, and see the price before you click.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
