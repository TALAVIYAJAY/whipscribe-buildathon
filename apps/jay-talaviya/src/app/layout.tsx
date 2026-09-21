import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhipScribe Audio Intelligence | Jay Talaviya",
  description:
    "End-to-end audio intelligence workflow powered by WhipScribe API and synced with Airtable.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-whip-200 selection:text-whip-900">
        {children}
      </body>
    </html>
  );
}
