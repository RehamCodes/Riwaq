"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, MessageSquare, Pencil } from "lucide-react";
import Avatar, {
  availabilityOptions,
  type Availability,
} from "@/components/presence/Avatar";

const STATUS_MESSAGE_MAX = 280;
const HOVER_CLOSE_DELAY = 200;

export default function ProfileMenu({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const [availability, setAvailability] = useState<Availability>("available");
  const [showAvailability, setShowAvailability] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Opened by a click/tap rather than hover: stays open when the pointer leaves.
  const pinned = useRef(false);

  const current = availabilityOptions[availability];

  function openMenu() {
    clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function closeMenu() {
    clearTimeout(closeTimer.current);
    pinned.current = false;
    setOpen(false);
    setShowAvailability(false);
    setEditing(false);
  }

  // Delay closing so the pointer can travel from the avatar to the card.
  // Stay open while the status message is being typed.
  function scheduleClose() {
    if (editing || pinned.current) return;
    closeTimer.current = setTimeout(closeMenu, HOVER_CLOSE_DELAY);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) closeMenu();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  function startEditing() {
    setDraft(statusMessage);
    setEditing(true);
  }

  function saveMessage(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(draft.trim());
    setEditing(false);
  }

  return (
    <div
      ref={rootRef}
      className="ml-auto"
      onPointerEnter={(e) => e.pointerType === "mouse" && openMenu()}
      onPointerLeave={(e) => e.pointerType === "mouse" && scheduleClose()}
    >
      <button
        type="button"
        aria-label={`Account, ${current.label}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (open && pinned.current) return closeMenu();
          pinned.current = true;
          openMenu();
        }}
        className="flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
      >
        <Avatar name={userName} availability={availability} size="sm" />
      </button>

      {open && (
        // Positioned against the <header>, so the card opens below the bar.
        // The hover close delay covers the gap between avatar and card.
        <div className="absolute top-full right-0 z-30 w-72 pt-2">
          <div
            role="dialog"
            aria-label="Profile and status"
            className="rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-lg"
          >
            <div className="flex items-center gap-3 p-4">
              <Avatar name={userName} availability={availability} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{userName}</p>
                {userEmail && (
                  <p className="truncate text-xs text-slate-500">{userEmail}</p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 p-2">
              <button
                type="button"
                aria-expanded={showAvailability}
                onClick={() => setShowAvailability((v) => !v)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-100"
              >
                <current.icon
                  className={`size-4 ${current.color}`}
                  strokeWidth={2}
                />
                <span className="flex-1 text-left">{current.label}</span>
                <ChevronDown
                  className={`size-4 text-slate-400 transition-transform ${
                    showAvailability ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showAvailability && (
                <ul className="mt-1 flex flex-col gap-0.5 pl-2">
                  {(
                    Object.entries(availabilityOptions) as [
                      Availability,
                      (typeof availabilityOptions)[Availability],
                    ][]
                  ).map(([key, { label, icon: Icon, color }]) => (
                    <li key={key}>
                      <button
                        type="button"
                        aria-pressed={key === availability}
                        onClick={() => {
                          setAvailability(key);
                          setShowAvailability(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-100 ${
                          key === availability ? "bg-slate-50 font-medium" : ""
                        }`}
                      >
                        <Icon className={`size-4 ${color}`} strokeWidth={2} />
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {editing ? (
                <form onSubmit={saveMessage} className="mt-1 px-2 py-1">
                  <textarea
                    autoFocus
                    rows={3}
                    value={draft}
                    maxLength={STATUS_MESSAGE_MAX}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="What's on your mind?"
                    aria-label="Status message"
                    className="w-full resize-none rounded-lg border border-slate-200 p-2 text-sm focus:border-slate-400 focus:outline-none"
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {draft.length}/{STATUS_MESSAGE_MAX}
                    </span>
                    <div className="flex gap-2">
                      {statusMessage && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusMessage("");
                            setEditing(false);
                          }}
                          className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-slate-700 px-3 py-1 text-xs font-medium text-white hover:bg-slate-600"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={startEditing}
                  className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-100"
                >
                  {statusMessage ? (
                    <>
                      <MessageSquare className="mt-0.5 size-4 shrink-0 text-slate-400" />
                      <span className="flex-1 break-words">
                        {statusMessage}
                      </span>
                      <Pencil className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                    </>
                  ) : (
                    <>
                      <Pencil className="mt-0.5 size-4 shrink-0 text-slate-400" />
                      <span className="flex-1">Set status message</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="border-t border-slate-100 p-2">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-slate-600 hover:bg-slate-100"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
