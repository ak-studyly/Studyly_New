import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studyly — study smarter, together",
  description: "Browse and share PDF study materials with your college peers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
