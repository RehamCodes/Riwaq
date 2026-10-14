import type { Metadata } from "next";
import { Suspense } from "react";
import ChatApp from "@/components/chat/ChatApp";

export const metadata: Metadata = {
  title: "Chats",
};

export default function ChatsPage() {
  return (
    // ChatApp reads the open chat from the URL, which needs a Suspense
    // boundary so the rest of the page can still be prerendered.
    <Suspense
      fallback={<div className="h-full animate-pulse rounded-2xl bg-white" />}
    >
      <ChatApp />
    </Suspense>
  );
}
