import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PAG Documents",
  description: "Public Asset Governance Document Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
