"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bus,
  ChevronDown,
  Clock,
  Flag,
  History,
  Mail,
  MessageSquare,
  Phone,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Avatar, { availabilityOptions } from "@/components/presence/Avatar";
import ReportDialog from "./ReportDialog";
import type { Contact, StudentReport } from "./chat-data";

const HOVER_OPEN_DELAY = 400;
const HOVER_CLOSE_DELAY = 200;
const GAP = 8;

// Wraps an avatar: hovering it (or clicking, with `openOnClick`) shows a
// Teams-style profile card with quick actions and contact details.
export default function ProfileHoverCard({
  contact,
  onChat,
  onCall,
  onReport,
  openOnClick = false,
  children,
}: {
  contact: Contact;
  onChat: () => void;
  onCall: () => void;
  // Shows a Report action on students' cards.
  onReport?: (report: StudentReport) => void;
  // Use where the avatar isn't already inside a button, so touch can open it.
  openOnClick?: boolean;
  children: React.ReactNode;
}) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [reporting, setReporting] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Opened by a click/tap: stays open when the pointer leaves.
  const pinned = useRef(false);

  function show() {
    clearTimeout(closeTimer.current);
    if (triggerRef.current) {
      setAnchor(triggerRef.current.getBoundingClientRect());
    }
  }

  function close() {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    pinned.current = false;
    setAnchor(null);
  }

  function onEnter(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    if (!anchor) openTimer.current = setTimeout(show, HOVER_OPEN_DELAY);
  }

  // Delay closing so the pointer can travel from the avatar to the card.
  function onLeave(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    clearTimeout(openTimer.current);
    if (!pinned.current) {
      closeTimer.current = setTimeout(close, HOVER_CLOSE_DELAY);
    }
  }

  useEffect(() => {
    if (!anchor) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (
        !cardRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        close();
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    function onScroll(e: Event) {
      if (!cardRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [anchor]);

  useEffect(
    () => () => {
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
    },
    [],
  );

  const triggerProps = {
    onPointerEnter: onEnter,
    onPointerLeave: onLeave,
  };

  return (
    <>
      {openOnClick ? (
        <button
          ref={triggerRef as React.Ref<HTMLButtonElement>}
          type="button"
          aria-label={`View profile of ${contact.name}`}
          aria-haspopup="dialog"
          aria-expanded={!!anchor}
          onClick={() => {
            if (anchor && pinned.current) return close();
            pinned.current = true;
            show();
          }}
          className="flex shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          {...triggerProps}
        >
          {children}
        </button>
      ) : (
        <span
          ref={triggerRef}
          className="flex shrink-0 rounded-full"
          {...triggerProps}
        >
          {children}
        </span>
      )}

      {anchor &&
        createPortal(
          <ProfileCard
            ref={cardRef}
            anchor={anchor}
            contact={contact}
            onChat={() => {
              close();
              onChat();
            }}
            onCall={() => {
              close();
              onCall();
            }}
            onReport={
              onReport && contact.kind === "student"
                ? () => {
                    close();
                    setReporting(true);
                  }
                : undefined
            }
            {...triggerProps}
          />,
          document.body,
        )}

      {reporting &&
        onReport &&
        createPortal(
          // Portaled out of e.g. the chat list row; stop React events from
          // bubbling back up to it.
          <div onClick={(e) => e.stopPropagation()}>
            <ReportDialog
              student={contact}
              onClose={() => setReporting(false)}
              onSubmit={(report) => {
                setReporting(false);
                onReport(report);
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}

function ProfileCard({
  ref,
  anchor,
  contact,
  onChat,
  onCall,
  onReport,
  onPointerEnter,
  onPointerLeave,
}: {
  ref: React.RefObject<HTMLDivElement | null>;
  anchor: DOMRect;
  contact: Contact;
  onChat: () => void;
  onCall: () => void;
  onReport?: () => void;
  onPointerEnter: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = availabilityOptions[contact.availability];
  const active = contact.availability === "available";

  // Open beside the avatar (right, else left), kept inside the viewport.
  // Re-runs when "Show more" changes the card's height.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    let left = anchor.right + GAP;
    if (left + width > window.innerWidth - GAP) {
      left = anchor.left - width - GAP;
    }
    left = Math.max(GAP, Math.min(left, window.innerWidth - width - GAP));
    const top = Math.max(
      GAP,
      Math.min(anchor.top, window.innerHeight - height - GAP),
    );
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [anchor, expanded, ref]);

  const actionButton =
    "flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800";

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Profile of ${contact.name}`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      // The card is portaled, but React events still bubble to the avatar's
      // ancestors (e.g. the chat list row), so keep clicks inside.
      onClick={(e) => e.stopPropagation()}
      className="fixed z-50 w-80 max-w-[calc(100vw-16px)] rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-lg"
      style={{ left: anchor.right + GAP, top: anchor.top }}
    >
      <div className="flex items-center gap-3 p-4">
        <Avatar
          name={contact.name}
          availability={contact.availability}
          size="lg"
          className={contact.color}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800">
            {contact.name}
          </p>
          <p className="truncate text-xs text-slate-500">{contact.role}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <status.icon className={`size-3 ${status.color}`} strokeWidth={2} />
            {status.label}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1 px-3 pb-3">
        <button
          type="button"
          onClick={onChat}
          aria-label={`Chat with ${contact.name}`}
          title="Chat"
          className={actionButton}
        >
          <MessageSquare className="size-5" />
        </button>
        <button
          type="button"
          onClick={onCall}
          aria-label={`Audio call ${contact.name}`}
          title="Audio call"
          className={actionButton}
        >
          <Phone className="size-5" />
        </button>
        {contact.parent && (
          <a
            href={`tel:${contact.parent.phone.replace(/\s/g, "")}`}
            aria-label={`Call parent, ${contact.parent.name}`}
            title="Call parent"
            className={actionButton}
          >
            <UsersRound className="size-5" />
          </a>
        )}
        {onReport && (
          <button
            type="button"
            onClick={onReport}
            aria-label={`Report or complain about ${contact.name}`}
            title="Report or complaint"
            className={`${actionButton} ml-auto hover:bg-rose-50 hover:text-rose-600`}
          >
            <Flag className="size-5" />
          </button>
        )}
      </div>

      <dl className="flex flex-col gap-2.5 border-t border-slate-100 px-4 py-3">
        <InfoRow icon={Clock} label="School working hours">
          {contact.workingHours}
        </InfoRow>
        <InfoRow icon={History} label="Last seen">
          {active ? (
            <span className="text-emerald-600">Active now</span>
          ) : (
            contact.lastSeen
          )}
        </InfoRow>

        {expanded && (
          <>
            {contact.email && (
              <InfoRow icon={Mail} label="Email">
                <a
                  href={`mailto:${contact.email}`}
                  className="break-all text-brand hover:underline"
                >
                  {contact.email}
                </a>
              </InfoRow>
            )}
            {contact.phone && (
              <InfoRow icon={Phone} label="Phone">
                <PhoneLink phone={contact.phone} />
              </InfoRow>
            )}
            {contact.parent && (
              <InfoRow icon={UsersRound} label="Parent">
                {contact.parent.name}
                <br />
                <PhoneLink phone={contact.parent.phone} />
              </InfoRow>
            )}
            {contact.driver && (
              <InfoRow
                icon={Bus}
                label={
                  contact.driver.bus
                    ? `Driver · ${contact.driver.bus}`
                    : "Driver"
                }
              >
                {contact.driver.name}
                <br />
                <PhoneLink phone={contact.driver.phone} />
              </InfoRow>
            )}
          </>
        )}
      </dl>

      <div className="border-t border-slate-100 p-1">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          {expanded ? "Show less" : "Show more"}
          <ChevronDown
            className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="text-slate-700">{children}</dd>
      </div>
    </div>
  );
}

function PhoneLink({ phone }: { phone: string }) {
  return (
    <a
      href={`tel:${phone.replace(/\s/g, "")}`}
      className="text-brand hover:underline"
    >
      {phone}
    </a>
  );
}
