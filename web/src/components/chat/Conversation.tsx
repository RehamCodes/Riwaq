"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BellOff,
  Bell,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Ellipsis,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Mail,
  MonitorUp,
  Phone,
  Search,
  SendHorizontal,
  X,
  type LucideIcon,
} from "lucide-react";
import Avatar, { availabilityOptions } from "@/components/presence/Avatar";
import { NewClassDialog } from "@/components/calendar/dialogs";
import { addEvent } from "@/components/calendar/calendar-store";
import { nextHalfHour } from "@/components/calendar/date-utils";
import CallOverlay from "./CallOverlay";
import { linksIn, type Chat, type Message, type SharedFile } from "./chat-data";

type Tab = "chat" | "shared" | "notes";

const tabs: { value: Tab; label: string }[] = [
  { value: "chat", label: "Chat" },
  { value: "shared", label: "Shared" },
  { value: "notes", label: "Notes" },
];

const URL_SPLIT = /(https?:\/\/[^\s]+)/g;

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text: string, query: string) {
  if (!query) return text;
  return text
    .split(new RegExp(`(${escapeRegExp(query)})`, "gi"))
    .map((part, i) =>
      i % 2 === 1 ? (
        <mark key={i} className="rounded-sm bg-amber-200 text-inherit">
          {part}
        </mark>
      ) : (
        part
      ),
    );
}

function MessageText({ text, query }: { text: string; query: string }) {
  return (
    <>
      {text.split(URL_SPLIT).map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-sky-700 underline"
          >
            {highlight(part, query)}
          </a>
        ) : (
          <span key={i}>{highlight(part, query)}</span>
        ),
      )}
    </>
  );
}

const fileIcons: Record<
  SharedFile["kind"],
  { icon: LucideIcon; color: string }
> = {
  pdf: { icon: FileText, color: "text-rose-500" },
  doc: { icon: FileText, color: "text-sky-600" },
  sheet: { icon: FileSpreadsheet, color: "text-emerald-600" },
  image: { icon: ImageIcon, color: "text-violet-500" },
};

export default function Conversation({
  chat,
  onBack,
  onSend,
  onUpdate,
  onToast,
}: {
  chat: Chat;
  onBack: () => void;
  onSend: (text: string) => void;
  onUpdate: (change: Partial<Chat>) => void;
  onToast: (text: string) => void;
}) {
  const { contact } = chat;
  const firstName = contact.name
    .replace(/^(Mr|Ms|Mrs|Dr)\.?\s+/i, "")
    .split(" ")[0];

  const [tab, setTab] = useState<Tab>("chat");
  const [finding, setFinding] = useState(false);
  const [query, setQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [meetingStart, setMeetingStart] = useState<Date | null>(null);
  const [inCall, setInCall] = useState(false);
  const [screen, setScreen] = useState<MediaStream | null>(null);
  const [draft, setDraft] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<MediaStream | null>(null);

  const trimmedQuery = query.trim();
  const matches = useMemo(
    () =>
      trimmedQuery
        ? chat.messages.filter((m) =>
            m.text.toLowerCase().includes(trimmedQuery.toLowerCase()),
          )
        : [],
    [chat.messages, trimmedQuery],
  );
  const activeMatch = matches[Math.min(matchIndex, matches.length - 1)];

  // Jump to the newest message when the chat opens or a message is sent.
  useEffect(() => {
    if (tab === "chat") endRef.current?.scrollIntoView({ block: "end" });
  }, [chat.messages.length, tab]);

  useEffect(() => {
    if (activeMatch) {
      document
        .getElementById(`msg-${activeMatch.id}`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [activeMatch]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  // Stop any screen capture when leaving the chat.
  useEffect(
    () => () => screenRef.current?.getTracks().forEach((t) => t.stop()),
    [],
  );

  function stopSharing() {
    screenRef.current?.getTracks().forEach((t) => t.stop());
    screenRef.current = null;
    setScreen(null);
  }

  async function shareScreen() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      onToast("Screen sharing isn't supported on this device");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      // The browser's own "Stop sharing" button ends the track.
      stream.getVideoTracks()[0]?.addEventListener("ended", stopSharing);
      screenRef.current = stream;
      setScreen(stream);
    } catch {
      // The user cancelled the picker.
    }
  }

  function endCall() {
    stopSharing();
    setInCall(false);
  }

  async function copyLink() {
    const url = `${window.location.origin}/chats?chat=${contact.id}`;
    try {
      await navigator.clipboard.writeText(url);
      onToast("Link copied");
    } catch {
      onToast("Couldn't copy the link");
    }
  }

  function openFind() {
    setTab("chat");
    setFinding(true);
  }

  function closeFind() {
    setFinding(false);
    setQuery("");
    setMatchIndex(0);
  }

  function stepMatch(dir: 1 | -1) {
    if (!matches.length) return;
    setMatchIndex((i) => (i + dir + matches.length) % matches.length);
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  type MenuAction = "schedule" | "share" | "unread" | "mute" | "copy";

  const menuItems: { action: MenuAction; label: string; icon: LucideIcon }[] = [
    { action: "schedule", label: "Schedule a meeting", icon: CalendarPlus },
    { action: "share", label: "Share screen", icon: MonitorUp },
    { action: "unread", label: "Mark as unread", icon: Mail },
    {
      action: "mute",
      label: chat.muted ? "Unmute" : "Mute",
      icon: chat.muted ? Bell : BellOff,
    },
    { action: "copy", label: "Copy link", icon: LinkIcon },
  ];

  function runMenuAction(action: MenuAction) {
    setMenuOpen(false);
    switch (action) {
      case "schedule":
        return setMeetingStart(nextHalfHour(new Date()));
      case "share":
        return shareScreen();
      case "unread":
        onUpdate({ unread: true });
        return onToast("Marked as unread");
      case "mute":
        onUpdate({ muted: !chat.muted });
        return onToast(chat.muted ? "Notifications on" : "Chat muted");
      case "copy":
        return copyLink();
    }
  }

  const iconButton =
    "rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-200 px-3 pt-2.5 md:flex-nowrap md:px-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to chats"
          className={`${iconButton} -ml-1 md:hidden`}
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex min-w-0 items-center gap-3 pb-2.5">
          <Avatar
            name={contact.name}
            availability={contact.availability}
            size="md"
            className={contact.color}
          />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-semibold text-slate-800">
              {contact.name}
              {chat.muted && (
                <BellOff
                  className="size-3.5 shrink-0 text-slate-400"
                  aria-label="Muted"
                />
              )}
            </p>
            <p className="truncate text-xs text-slate-500">
              {availabilityOptions[contact.availability].label} · {contact.role}
            </p>
          </div>
        </div>

        <nav
          aria-label="Chat sections"
          className="order-last flex basis-full gap-1 self-end md:order-none md:ml-4 md:basis-auto"
        >
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-current={tab === t.value ? "page" : undefined}
              onClick={() => setTab(t.value)}
              className={`border-b-2 px-3 pb-2.5 text-sm font-medium ${
                tab === t.value
                  ? "border-[#3f5068] text-slate-800"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-0.5 pb-2.5">
          <button
            type="button"
            onClick={() => setInCall(true)}
            aria-label={`Audio call ${contact.name}`}
            title="Audio call"
            className={iconButton}
          >
            <Phone className="size-5" />
          </button>
          <button
            type="button"
            onClick={openFind}
            aria-label="Find in chat"
            title="Find in chat"
            className={iconButton}
          >
            <Search className="size-5" />
          </button>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="More options"
              className={iconButton}
            >
              <Ellipsis className="size-5" />
            </button>
            {menuOpen && (
              <ul
                role="menu"
                className="absolute top-full right-0 z-30 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-1 text-sm text-slate-700 shadow-lg"
              >
                {menuItems.map(({ action, label, icon: Icon }) => (
                  <li key={label} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => runMenuAction(action)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100"
                    >
                      <Icon className="size-4 text-slate-500" />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Find in chat */}
      {finding && tab === "chat" && (
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 md:px-5">
          <Search className="size-4 shrink-0 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setMatchIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") stepMatch(e.shiftKey ? -1 : 1);
              if (e.key === "Escape") closeFind();
            }}
            placeholder="Find in chat"
            aria-label="Find in chat"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <span className="shrink-0 text-xs text-slate-500" aria-live="polite">
            {trimmedQuery &&
              (matches.length
                ? `${Math.min(matchIndex, matches.length - 1) + 1} of ${matches.length}`
                : "No results")}
          </span>
          <button
            type="button"
            onClick={() => stepMatch(-1)}
            disabled={!matches.length}
            aria-label="Previous result"
            className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-40"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => stepMatch(1)}
            disabled={!matches.length}
            aria-label="Next result"
            className="rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-40"
          >
            <ChevronDown className="size-4" />
          </button>
          <button
            type="button"
            onClick={closeFind}
            aria-label="Close find"
            className="rounded p-1 text-slate-500 hover:bg-slate-200"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {tab === "chat" && (
        <>
          <MessageList
            chat={chat}
            query={trimmedQuery}
            activeId={activeMatch?.id}
            endRef={endRef}
          />
          <form
            onSubmit={submit}
            className="flex items-end gap-2 border-t border-slate-200 p-3 md:px-5"
          >
            <textarea
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) submit(e);
              }}
              placeholder={`Message ${firstName}`}
              aria-label={`Message ${contact.name}`}
              className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 field-sizing-content focus:border-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#3f5068] text-white hover:bg-[#34445a] disabled:opacity-40"
            >
              <SendHorizontal className="size-4" />
            </button>
          </form>
        </>
      )}

      {tab === "shared" && <SharedPanel chat={chat} />}

      {tab === "notes" && (
        <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
          <p className="text-xs text-slate-500">
            Private notes — only you can see these.
          </p>
          <textarea
            value={chat.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder={`Notes about your chats with ${firstName}…`}
            aria-label="Notes"
            className="flex-1 resize-none rounded-lg border border-slate-200 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
          />
        </div>
      )}

      {meetingStart && (
        <NewClassDialog
          heading="Schedule a meeting"
          defaultTitle={`Meeting with ${contact.name}`}
          defaultTeacher={contact.name}
          initialStart={meetingStart}
          onClose={() => setMeetingStart(null)}
          onCreate={(event) => {
            addEvent(event);
            setMeetingStart(null);
            onToast("Meeting added to your Classes calendar");
          }}
        />
      )}

      {(inCall || screen) && (
        <CallOverlay
          contact={contact}
          inCall={inCall}
          screen={screen}
          onShareScreen={shareScreen}
          onStopSharing={stopSharing}
          onEnd={endCall}
        />
      )}
    </div>
  );
}

function MessageList({
  chat,
  query,
  activeId,
  endRef,
}: {
  chat: Chat;
  query: string;
  activeId?: string;
  endRef: React.Ref<HTMLDivElement>;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4 md:px-5">
      {chat.messages.map((m, i) => {
        const prev: Message | undefined = chat.messages[i - 1];
        const newDay = prev?.day !== m.day;
        const grouped = !newDay && prev?.from === m.from;
        const mine = m.from === "me";
        return (
          <div key={m.id}>
            {newDay && (
              <div className="my-3 flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                {m.day}
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            )}
            <div
              id={`msg-${m.id}`}
              className={`flex gap-2 ${mine ? "justify-end" : ""} ${grouped ? "" : "mt-2"}`}
            >
              {!mine && (
                <span className="w-8 shrink-0">
                  {!grouped && (
                    <Avatar
                      name={chat.contact.name}
                      size="xs"
                      className={chat.contact.color}
                    />
                  )}
                </span>
              )}
              <div
                className={`flex max-w-[85%] flex-col md:max-w-[65%] ${mine ? "items-end" : ""}`}
              >
                {!grouped && (
                  <span className="mb-0.5 text-xs text-slate-500">
                    {mine ? "" : `${chat.contact.name} · `}
                    {m.time}
                  </span>
                )}
                <p
                  className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap text-slate-800 ${
                    mine ? "bg-[#e3e9f2]" : "bg-slate-100"
                  } ${activeId === m.id ? "ring-2 ring-amber-400" : ""}`}
                >
                  <MessageText text={m.text} query={query} />
                </p>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

function SharedPanel({ chat }: { chat: Chat }) {
  const links = linksIn(chat.messages);
  const sharer = (by: "me" | "them") =>
    by === "me" ? "You" : chat.contact.name;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-5">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">Files</h3>
      {chat.files.length ? (
        <ul className="flex flex-col divide-y divide-slate-100 rounded-lg border border-slate-200">
          {chat.files.map((f) => {
            const { icon: Icon, color } = fileIcons[f.kind];
            return (
              <li key={f.id} className="flex items-center gap-3 px-3 py-2.5">
                <Icon className={`size-5 shrink-0 ${color}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {f.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {sharer(f.sharedBy)} · {f.day} · {f.size}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">No files shared yet.</p>
      )}

      <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-700">Links</h3>
      {links.length ? (
        <ul className="flex flex-col divide-y divide-slate-100 rounded-lg border border-slate-200">
          {links.map((l) => (
            <li key={l.id} className="flex items-center gap-3 px-3 py-2.5">
              <LinkIcon className="size-5 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm font-medium text-sky-700 hover:underline"
                >
                  {l.url}
                </a>
                <p className="text-xs text-slate-500">
                  {sharer(l.sharedBy)} · {l.day}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">No links shared yet.</p>
      )}
    </div>
  );
}
