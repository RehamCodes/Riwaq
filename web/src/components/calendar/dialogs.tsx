"use client";

import { useState } from "react";
import { Clock, Trash2, User, Video } from "lucide-react";
import {
  Button,
  Checkbox,
  ColorPicker,
  DateInput,
  Input,
  Modal,
  ModalHeader,
  TimeInput,
  type ColorOption,
} from "@/components/ui";
import {
  formatLongDate,
  formatTime,
  toDateInputValue,
  toTimeInputValue,
  addMinutes,
} from "./date-utils";
import {
  canJoin,
  eventColors,
  type ClassEvent,
  type EventColor,
} from "./events";

export function EventDetailsDialog({
  event,
  now,
  onClose,
  onDelete,
}: {
  event: ClassEvent;
  now: Date;
  onClose: () => void;
  onDelete: (event: ClassEvent) => void;
}) {
  const joinable = canJoin(event, now);
  return (
    <Modal label={event.title} onClose={onClose}>
      <ModalHeader
        title={event.title}
        onClose={onClose}
        leading={
          <span
            className={`mt-1.5 size-3 shrink-0 rounded-sm ${eventColors[event.color].dot}`}
          />
        }
      />

      <dl className="mt-4 flex flex-col gap-3 pl-6">
        <div className="flex items-center gap-3">
          <Clock className="size-4 text-slate-400" />
          <dd>
            {formatLongDate(event.start)} · {formatTime(event.start)} –{" "}
            {formatTime(event.end)}
          </dd>
        </div>
        {event.teacher && (
          <div className="flex items-center gap-3">
            <User className="size-4 text-slate-400" />
            <dd>{event.teacher}</dd>
          </div>
        )}
        {event.online && (
          <div className="flex items-center gap-3">
            <Video className="size-4 text-slate-400" />
            <dd>Online class</dd>
          </div>
        )}
      </dl>

      <div className="mt-6 flex items-center justify-between gap-2">
        {event.custom ? (
          <Button variant="danger" onClick={() => onDelete(event)}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        ) : (
          <span />
        )}
        {event.online && (
          <Button
            disabled={!joinable}
            title={joinable ? undefined : "Opens 10 minutes before the class"}
          >
            <Video className="size-4" />
            Join
          </Button>
        )}
      </div>
    </Modal>
  );
}

const colorOptions: ColorOption<EventColor>[] = (
  Object.keys(eventColors) as EventColor[]
).map((c) => ({
  value: c,
  label: c[0].toUpperCase() + c.slice(1),
  swatch: eventColors[c].dot,
}));

export function NewClassDialog({
  initialStart,
  onClose,
  onCreate,
  heading = "New class",
  defaultTitle,
  defaultTeacher,
}: {
  initialStart: Date;
  onClose: () => void;
  onCreate: (event: ClassEvent) => void;
  heading?: string;
  defaultTitle?: string;
  defaultTeacher?: string;
}) {
  const [color, setColor] = useState<EventColor>("indigo");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const date = String(data.get("date"));
    const start = new Date(`${date}T${data.get("start")}`);
    const end = new Date(`${date}T${data.get("end")}`);
    if (!(end > start)) {
      setError("End time must be after the start time.");
      return;
    }
    onCreate({
      id: crypto.randomUUID(),
      title: String(data.get("title")).trim(),
      teacher: String(data.get("teacher")).trim() || undefined,
      start,
      end,
      color,
      online: data.get("online") === "on",
      custom: true,
    });
  }

  return (
    <Modal label={heading} onClose={onClose}>
      <ModalHeader title={heading} onClose={onClose} />

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <Input
          name="title"
          required
          autoFocus
          defaultValue={defaultTitle}
          placeholder="Add a title"
          aria-label="Title"
          className="text-base"
        />
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <DateInput
            name="date"
            required
            aria-label="Date"
            defaultValue={toDateInputValue(initialStart)}
          />
          <TimeInput
            name="start"
            required
            aria-label="Start time"
            defaultValue={toTimeInputValue(initialStart)}
          />
          <TimeInput
            name="end"
            required
            aria-label="End time"
            defaultValue={toTimeInputValue(addMinutes(initialStart, 60))}
          />
        </div>
        <Input
          name="teacher"
          defaultValue={defaultTeacher}
          placeholder="Teacher (optional)"
          aria-label="Teacher"
        />

        <ColorPicker options={colorOptions} value={color} onChange={setColor} />

        <Checkbox name="online" defaultChecked label="Online class" />

        {error && (
          <p role="alert" className="text-rose-600">
            {error}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}
