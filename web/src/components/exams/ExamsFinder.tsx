"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  ClipboardList,
  Clock,
  Eye,
  KeyRound,
  Lock,
  Timer,
} from "lucide-react";
import { Button, Modal, ModalHeader, Select } from "@/components/ui";
import SpaceFinder from "@/components/space/SpaceFinder";
import { itemStore } from "@/components/space/space-db";
import type { FileItem, FolderItem, SpaceItem } from "@/components/space/types";
import AccessDialog from "./AccessDialog";
import ExamViewer from "./ExamViewer";
import { useClock } from "./use-clock";
import {
  accessState,
  formatCountdown,
  formatMinutes,
  formatWhen,
  isCategory,
  ruleFolderId,
  ruleSummary,
  sampleCategories,
  startKey,
  students,
  studentsLabel,
  type AccessRule,
  type AccessRules,
  type Starts,
} from "./access";

// Exams keep their own storage, separate from each user's Space. Access
// rules and timer starts are saved alongside the items.
const store = itemStore("riwaq-exams");

const TEACHER = "teacher";

// Called from event handlers only (never during render).
function timestamp() {
  return Date.now();
}

// A timed folder a student is working in; they're told when it ends.
type Session = { folderId: string; name: string };

const modeIcons = {
  closed: Lock,
  open: Eye,
  scheduled: CalendarClock,
  timer: Timer,
};

function Badge({
  icon: Icon,
  tone = "slate",
  children,
}: {
  icon: typeof Lock;
  tone?: "slate" | "sky" | "amber" | "rose";
  children: React.ReactNode;
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    sky: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-800",
    rose: "bg-rose-100 text-rose-700",
  };
  return (
    <span
      className={`flex max-w-full shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-medium tabular-nums ${tones[tone]}`}
    >
      <Icon className="size-3 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}

export default function ExamsFinder() {
  const now = useClock();
  const [viewer, setViewer] = useState(TEACHER);
  const [rules, setRules] = useState<AccessRules>({});
  const [starts, setStarts] = useState<Starts>({});
  const [editing, setEditing] = useState<FolderItem | null>(null);
  const [gate, setGate] = useState<{
    folderId: string;
    name: string;
    proceed: () => void;
  } | null>(null);
  const [viewing, setViewing] = useState<{
    file: FileItem;
    folderId: string | null;
  } | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    Promise.all([
      store.getMeta<AccessRules>("access"),
      store.getMeta<Starts>("starts"),
    ])
      .then(([savedRules, savedStarts]) => {
        setRules(savedRules ?? {});
        setStarts(savedStarts ?? {});
      })
      .catch(() => {});
  }, []);

  const student =
    viewer === TEACHER ? null : (students.find((s) => s.id === viewer) ?? null);

  function saveRules(next: AccessRules) {
    setRules(next);
    store.setMeta("access", next).catch(() => {});
  }

  function saveStarts(next: Starts) {
    setStarts(next);
    store.setMeta("starts", next).catch(() => {});
  }

  // What the student can do with a folder right now.
  function stateOf(folderId: string) {
    const rule = rules[folderId];
    if (!student || !rule || now === null) return { kind: "hidden" } as const;
    return accessState(rule, folderId, student.id, starts, now);
  }

  // ----- Rules for the Finder -----

  function isVisible(item: SpaceItem, items: SpaceItem[]) {
    if (!student || isCategory(item)) return true;
    const folderId = ruleFolderId(items, item, rules);
    if (!folderId) return false;
    const { kind } = stateOf(folderId);
    // Locked folders are shown (with when they open); their files aren't.
    return item.kind === "folder" ? kind !== "hidden" : kind === "open";
  }

  function onOpen(item: SpaceItem, items: SpaceItem[], proceed: () => void) {
    const folderId = ruleFolderId(items, item, rules);
    if (!student) {
      if (item.kind === "folder") return false;
      setViewing({ file: item, folderId });
      return true;
    }
    if (!folderId) return false;
    const state = stateOf(folderId);
    const name = items.find((i) => i.id === folderId)?.name ?? item.name;
    if (state.kind === "upcoming" || state.kind === "ready") {
      setGate({ folderId, name, proceed });
      return true;
    }
    if (state.kind === "open" && state.endsAt !== null)
      setSession({ folderId, name });
    if (item.kind === "file") {
      setViewing({ file: item, folderId });
      return true;
    }
    return false;
  }

  function onDeleted(ids: string[]) {
    const gone = new Set(ids);
    if (ids.some((id) => rules[id]))
      saveRules(
        Object.fromEntries(
          Object.entries(rules).filter(([id]) => !gone.has(id)),
        ),
      );
    if (Object.keys(starts).some((key) => gone.has(key.split(":")[0])))
      saveStarts(
        Object.fromEntries(
          Object.entries(starts).filter(
            ([key]) => !gone.has(key.split(":")[0]),
          ),
        ),
      );
  }

  function renderBadge(item: SpaceItem) {
    if (item.kind !== "folder" || isCategory(item)) return null;
    const rule = rules[item.id];
    if (!student) {
      if (rule)
        return (
          <Badge
            icon={modeIcons[rule.mode]}
            tone={rule.mode === "closed" ? "slate" : "sky"}
          >
            {ruleSummary(rule)}
          </Badge>
        );
      return item.parentId && isCategory({ id: item.parentId }) ? (
        <Badge icon={Lock}>Not shared</Badge>
      ) : null;
    }
    if (!rule || now === null) return null;
    const state = stateOf(item.id);
    if (state.kind === "upcoming")
      return <Badge icon={Lock}>Opens {formatWhen(state.opensAt)}</Badge>;
    if (state.kind === "ready")
      return (
        <Badge icon={Timer} tone="amber">
          {formatMinutes(state.minutes)} · Start
        </Badge>
      );
    if (state.kind === "open" && state.endsAt !== null)
      return (
        <Badge
          icon={Clock}
          tone={state.endsAt - now < 5 * 60_000 ? "rose" : "sky"}
        >
          {formatCountdown(state.endsAt - now)} left
        </Badge>
      );
    return null;
  }

  function renderBanner(path: FolderItem[]) {
    const bar =
      "flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2 text-xs";
    const ruled = [...path].reverse().find((f) => rules[f.id]);

    if (student) {
      const state = ruled ? stateOf(ruled.id) : null;
      const endsAt = state?.kind === "open" ? state.endsAt : null;
      const left = endsAt !== null && now !== null ? endsAt - now : null;
      return (
        <div className={`${bar} border-brand-soft bg-brand-soft text-brand`}>
          <span className="flex flex-1 items-center gap-1.5">
            <Eye className="size-3.5" />
            Viewing as {student.name} · view only
          </span>
          {left !== null && endsAt !== null && (
            <span
              role="timer"
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium tabular-nums ${
                left < 5 * 60_000
                  ? "bg-rose-600 text-white"
                  : "bg-white text-brand"
              }`}
            >
              <Clock className="size-3.5" />
              {formatCountdown(left)} left · ends{" "}
              {new Date(endsAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      );
    }

    const current = path.at(-1);
    if (!current || isCategory(current)) {
      return (
        <p className={`${bar} border-slate-100 bg-slate-50 text-slate-500`}>
          Add a folder for each exam, quiz or activity, upload its files, then
          right-click it and choose Access… Students only see folders you share,
          and only for the time you set.
        </p>
      );
    }
    const rule: AccessRule | undefined = ruled && rules[ruled.id];
    return (
      <div className={`${bar} border-slate-100 bg-slate-50 text-slate-600`}>
        <KeyRound className="size-3.5 text-slate-400" />
        <span className="flex-1">
          {rule ? (
            <>
              <span className="font-medium">{studentsLabel(rule)}</span> ·{" "}
              {ruleSummary(rule)}
              {ruled && ruled.id !== current.id && ` (from ${ruled.name})`}
            </>
          ) : (
            "Not shared with students"
          )}
        </span>
        <button
          type="button"
          onClick={() => setEditing(current)}
          className="rounded-md px-2 py-0.5 font-medium text-slate-700 hover:bg-slate-200"
        >
          {rules[current.id] ? "Edit access" : "Set access"}
        </button>
      </div>
    );
  }

  function itemMenu(item: SpaceItem) {
    if (student || item.kind !== "folder" || isCategory(item)) return [];
    return [
      { label: "Access…", icon: KeyRound, onSelect: () => setEditing(item) },
    ];
  }

  // ----- Timers -----

  function start(folderId: string) {
    if (!student) return;
    saveStarts({ ...starts, [startKey(folderId, student.id)]: timestamp() });
  }

  function resetStart(folderId: string, studentId: string) {
    const next = { ...starts };
    delete next[startKey(folderId, studentId)];
    saveStarts(next);
  }

  const timeUp =
    student !== null &&
    session !== null &&
    now !== null &&
    stateOf(session.folderId).kind !== "open";

  const viewingState =
    viewing?.folderId && student ? stateOf(viewing.folderId) : null;
  const viewingEndsAt =
    viewingState?.kind === "open" ? viewingState.endsAt : null;
  const canView = !student || viewingState?.kind === "open";

  const gateState = gate ? stateOf(gate.folderId) : null;

  const closeEditing = useCallback(() => setEditing(null), []);
  const closeGate = useCallback(() => setGate(null), []);
  const closeViewing = useCallback(() => setViewing(null), []);
  const closeTimeUp = useCallback(() => {
    setSession(null);
    setViewing(null);
  }, []);

  return (
    <>
      <SpaceFinder
        // A fresh Finder per viewer, so a student never lands in a folder
        // the teacher had open.
        key={viewer}
        store={store}
        rootName="Exams"
        rootIcon={ClipboardList}
        seed={sampleCategories}
        readOnly={student !== null}
        isVisible={isVisible}
        isProtected={isCategory}
        canAddTo={(folderId) => folderId !== null}
        onOpen={onOpen}
        onDeleted={onDeleted}
        itemMenu={itemMenu}
        renderBadge={renderBadge}
        renderBanner={renderBanner}
        toolbar={
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="hidden sm:inline">View as</span>
            <Select
              label="View as"
              value={viewer}
              onChange={(value) => {
                setViewer(value);
                setSession(null);
                setViewing(null);
                setGate(null);
              }}
              options={[
                { value: TEACHER, label: "Teacher" },
                {
                  label: "Preview as student",
                  options: students.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })),
                },
              ]}
            />
          </div>
        }
      />

      {editing && now !== null && (
        <AccessDialog
          folder={editing}
          rule={rules[editing.id]}
          starts={starts}
          now={now}
          onClose={closeEditing}
          onResetStart={(studentId) => resetStart(editing.id, studentId)}
          onSave={(rule) => {
            saveRules({ ...rules, [editing.id]: rule });
            setEditing(null);
          }}
        />
      )}

      {viewing && canView && !timeUp && now !== null && (
        <ExamViewer
          file={viewing.file}
          endsAt={viewingEndsAt}
          now={now}
          canDownload={!student}
          onClose={closeViewing}
        />
      )}

      {gate && gateState && now !== null && (
        <Modal label={gate.name} onClose={closeGate}>
          {gateState.kind === "ready" ? (
            <>
              <ModalHeader
                title={`Start “${gate.name}”?`}
                onClose={closeGate}
              />
              <p className="mt-3 text-slate-600">
                You&apos;ll have{" "}
                <strong>{formatMinutes(gateState.minutes)}</strong> to view it.
                The timer starts now and can&apos;t be paused — when it runs
                out, you lose access.
              </p>
              {gateState.startBy && (
                <p className="mt-2 text-xs text-slate-500">
                  You can start until {formatWhen(gateState.startBy)}.
                </p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" onClick={closeGate}>
                  Not now
                </Button>
                <Button
                  autoFocus
                  onClick={() => {
                    start(gate.folderId);
                    setSession({ folderId: gate.folderId, name: gate.name });
                    gate.proceed();
                    setGate(null);
                  }}
                >
                  Start
                </Button>
              </div>
            </>
          ) : (
            <>
              <ModalHeader title={gate.name} onClose={closeGate} />
              <p className="mt-3 text-slate-600">
                {gateState.kind === "upcoming"
                  ? `This opens ${formatWhen(gateState.opensAt)} (in ${formatCountdown(gateState.opensAt - now)}).`
                  : gateState.kind === "open"
                    ? "This is open now."
                    : "This is no longer available."}
              </p>
              <div className="mt-5 flex justify-end">
                <Button
                  autoFocus
                  onClick={() => {
                    if (gateState.kind === "open") gate.proceed();
                    setGate(null);
                  }}
                >
                  {gateState.kind === "open" ? "Open" : "OK"}
                </Button>
              </div>
            </>
          )}
        </Modal>
      )}

      {timeUp && session && (
        <Modal label="Time's up" onClose={closeTimeUp}>
          <ModalHeader title="Time's up" onClose={closeTimeUp} />
          <p className="mt-3 text-slate-600">
            Your time for “{session.name}” has ended, so it&apos;s no longer
            available.
          </p>
          <div className="mt-5 flex justify-end">
            <Button autoFocus onClick={closeTimeUp}>
              OK
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
