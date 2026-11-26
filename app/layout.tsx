import type { Metadata, Viewport } from "next";
import { Tinos } from "next/font/google";
import MissionToast from "@/components/MissionToast";
import "./globals.css";

// The app is set in Times New Roman. Devices without it (Android) get Tinos,
// a metric-compatible twin. It is not preloaded, so browsers that have Times
// New Roman never download it.
const tinos = Tinos({
  variable: "--font-tinos",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
  preload: false,
});

export const metadata: Metadata = {
  title: "The Last Page",
  description: "Học tiếng Anh qua truyện kinh điển kể bằng tin nhắn. Turn to the last page — and change it.",
};

export const viewport: Viewport = {
  themeColor: "#f7f3ea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${tinos.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <MissionToast />
      </body>
    </html>
  );
}
