import type { Metadata, Viewport } from "next";
import JudoApp from "./judo-app";

export const metadata: Metadata = {
  title: "Judo — mes 3 premières prises",
  description:
    "O-goshi, ippon-seoi-nage, o-soto-gari et le vocabulaire des 3 chutes (ukemi) : fiches et quiz, pensés pour le téléphone.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Pas de maximumScale/userScalable : le zoom reste possible (accessibilité).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#14171d" },
  ],
};

export default function JudoPage() {
  return <JudoApp />;
}
