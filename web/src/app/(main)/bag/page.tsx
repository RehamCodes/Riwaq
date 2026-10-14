import type { Metadata } from "next";
import BagApp from "@/components/bag/BagApp";

export const metadata: Metadata = {
  title: "Bag",
};

export default function BagPage() {
  return <BagApp />;
}
