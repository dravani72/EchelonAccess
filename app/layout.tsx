import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EchelonAccess",
  description: "Private relationship intelligence for elite-network deal origination"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
