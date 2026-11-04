import type { Metadata } from "next";

export const metadata: Metadata = { title: "Transaction Dashboard" };

export default function TransactionsDLayout({ children }: { children: React.ReactNode }) {
  return children;
}