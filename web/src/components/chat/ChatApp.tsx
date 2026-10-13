"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BellOff, MessagesSquare, Search } from "lucide-react";
import Avatar from "@/components/presence/Avatar";
import { ResizeHandle } from "@/components/ui";
import Conversation from "./Conversation";
import { initialChats, type Chat } from "./chat-data";

// Chat list width on desktop, adjustable by dragging its right border.
const LIST_WIDTH = { default: 320, min: 240, max: 480 };

function formatNow() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatApp() {
  const selectedId = useSearchParams().get("chat");
  const [chats, setChats] = useState(initialChats);
  const [filter, setFilter] = useState("");
  const [listWidth, setListWidth] = useState(LIST_WIDTH.default);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const selected = chats.find((c) => c.contact.id === selectedId) ?? null;
  const visible = chats.filter((c) =>
    c.contact.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  function update(id: string, change: Partial<Chat>) {
    setChats((list) =>
      list.map((c) => (c.contact.id === id ? { ...c, ...change } : c)),
    );
  }

  function open(id: string) {
    update(id, { unread: false });
    // Keeps the open chat in the URL, so links and Back work.
    window.history.pushState(null, "", `?chat=${id}`);
  }

  function send(id: string, text: string) {
    setChats((list) =>
      list.map((c) =>
        c.contact.id === id
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: crypto.randomUUID(),
                  from: "me",
                  text,
                  day: "Today",
                  time: formatNow(),
                },
              ],
            }
          : c,
      ),
    );
  }

  function showToast(text: string) {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  return (
    <section className="flex h-full min-h-[480px] overflow-hidden rounded-2xl bg-white">
      {/* Chat list */}
      <aside
        style={{ "--list-width": `${listWidth}px` } as React.CSSProperties}
        className={`relative w-full flex-col border-r border-slate-200 md:flex md:w-(--list-width) md:shrink-0 ${
          selected ? "hidden" : "flex"
        }`}
      >
        <ResizeHandle
          label="Resize chat list"
          value={listWidth}
          min={LIST_WIDTH.min}
          max={LIST_WIDTH.max}
          defaultValue={LIST_WIDTH.default}
          onChange={setListWidth}
          className="hidden md:block"
        />
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
          <h1 className="text-lg font-semibold text-slate-800">Chat</h1>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search people"
              aria-label="Search people"
              className="w-full rounded-lg border border-slate-200 py-1.5 pr-3 pl-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto p-2">
          {visible.map((chat) => {
            const last = chat.messages[chat.messages.length - 1];
            const active = chat.contact.id === selectedId;
            return (
              <li key={chat.contact.id}>
                <button
                  type="button"
                  onClick={() => open(chat.contact.id)}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${
                    active ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <Avatar
                    name={chat.contact.name}
                    availability={chat.contact.availability}
                    size="md"
                    className={chat.contact.color}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`truncate text-sm ${
                          chat.unread
                            ? "font-bold text-slate-900"
                            : "font-medium text-slate-700"
                        }`}
                      >
                        {chat.contact.name}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {last && (last.day === "Today" ? last.time : last.day)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`truncate text-xs ${
                          chat.unread
                            ? "font-semibold text-slate-700"
                            : "text-slate-500"
                        }`}
                      >
                        {last && (last.from === "me" ? "You: " : "")}
                        {last?.text}
                      </span>
                      {chat.muted && (
                        <BellOff
                          className="size-3 shrink-0 text-slate-400"
                          aria-label="Muted"
                        />
                      )}
                      {chat.unread && (
                        <span
                          className="ml-auto size-2 shrink-0 rounded-full bg-rose-500"
                          aria-label="Unread"
                        />
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
          {visible.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-slate-400">
              No people found
            </li>
          )}
        </ul>
      </aside>

      {/* Open conversation */}
      {selected ? (
        <Conversation
          key={selected.contact.id}
          chat={selected}
          onBack={() => window.history.pushState(null, "", "/chats")}
          onSend={(text) => send(selected.contact.id, text)}
          onUpdate={(change) => update(selected.contact.id, change)}
          onToast={showToast}
        />
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center gap-3 text-slate-400 md:flex">
          <MessagesSquare className="size-12" strokeWidth={1.25} />
          <p className="text-sm">Select a chat to start messaging</p>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white shadow-lg md:bottom-6"
        >
          {toast}
        </div>
      )}
    </section>
  );
}
