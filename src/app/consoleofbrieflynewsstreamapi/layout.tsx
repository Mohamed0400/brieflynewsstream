import type { Metadata } from "next";
import "../ops-gate.css";

export const metadata: Metadata = {
  title: "Operations",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
