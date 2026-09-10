import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "DreamBid — From backyard idea to better bids", description: "Design your backyard, understand the scope, and compare the true cost of contractor bids. A GPT-6 Astra hackathon prototype." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
