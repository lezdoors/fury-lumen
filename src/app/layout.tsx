import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumen — Direct Creative Production",
  description: "A restrained, provider-neutral studio for direct image and video generation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
