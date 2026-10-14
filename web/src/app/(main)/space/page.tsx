import type { Metadata } from "next";
import SpaceFinder from "@/components/space/SpaceFinder";

export const metadata: Metadata = {
  title: "Space",
};

export default function SpacePage() {
  return <SpaceFinder />;
}
