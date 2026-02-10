import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NASA Control Panel",
  description: "License management system — NASA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0B1026]">{children}</body>
    </html>
  );
}
