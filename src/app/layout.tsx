import { cn } from "@/lib/utils";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import localFont from "next/font/local";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import bgTavern from "./bg-tavern.webp";
import bgCavern from "./bg-cavern.webp";
import bgDepths from "./bg-depths.webp";
import "./globals.css";

const runic = localFont({
  src: [
    { path: "../../public/fonts/DeepGlyph.ttf", weight: "400", style: "normal" },
  ],
  variable: "--font-runic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Гномы и Глубины",
  description:
    "Idle-рогалик-автобатллер: отряд гномов спускается в глубины подземелья. Синергии, кузница, торговец, Наследие.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          GeistSans.variable,
          GeistMono.variable,
          runic.variable
        )}
        style={
          {
            "--bg-tavern": `url(${bgTavern.src})`,
            "--bg-cavern": `url(${bgCavern.src})`,
            "--bg-depths": `url(${bgDepths.src})`,
          } as React.CSSProperties
        }
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
