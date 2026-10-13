"use client";

import { useRef, useState } from "react";
import {
  STICKER,
  arrowHead,
  stickerPath,
  isShape,
  isStroke,
  strokePath,
  type Annotation,
  type Point,
  type TextAnnotation,
  type Tool,
} from "./types";

const MIN_POINT_DISTANCE = 0.0015;

type Editing = {
  id: string | null; // null = new text
  at: Point;
  text: string;
  color: string;
  size: number;
};

// Snap lines to 45° and shapes to squares/circles while Shift is held.
function constrain(kind: string, from: Point, to: Point): Point {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  if (kind === "rect" || kind === "ellipse") {
    const side = Math.max(Math.abs(dx), Math.abs(dy));
    return [from[0] + Math.sign(dx) * side, from[1] + Math.sign(dy) * side];
  }
  const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
  const length = Math.hypot(dx, dy);
  return [
    from[0] + length * Math.cos(angle),
    from[1] + length * Math.sin(angle),
  ];
}

function Shape({ a }: { a: Annotation }) {
  const stroke = {
    stroke: a.color,
    strokeWidth: a.size,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (a.kind) {
    case "pen":
      return <path d={strokePath(a.points)} {...stroke} />;
    case "highlighter":
      return (
        <path
          d={strokePath(a.points)}
          {...stroke}
          strokeOpacity={0.35}
          style={{ mixBlendMode: "multiply" }}
        />
      );
    case "line":
      return (
        <line
          x1={a.from[0]}
          y1={a.from[1]}
          x2={a.to[0]}
          y2={a.to[1]}
          {...stroke}
        />
      );
    case "arrow":
      return (
        <>
          <line
            x1={a.from[0]}
            y1={a.from[1]}
            x2={a.to[0]}
            y2={a.to[1]}
            {...stroke}
          />
          <path d={arrowHead(a.from, a.to, a.size)} {...stroke} />
        </>
      );
    case "rect":
      return (
        <rect
          x={Math.min(a.from[0], a.to[0])}
          y={Math.min(a.from[1], a.to[1])}
          width={Math.abs(a.to[0] - a.from[0])}
          height={Math.abs(a.to[1] - a.from[1])}
          rx={a.size}
          {...stroke}
        />
      );
    case "ellipse":
      return (
        <ellipse
          cx={(a.from[0] + a.to[0]) / 2}
          cy={(a.from[1] + a.to[1]) / 2}
          rx={Math.abs(a.to[0] - a.from[0]) / 2}
          ry={Math.abs(a.to[1] - a.from[1]) / 2}
          {...stroke}
        />
      );
    case "sticker":
      return (
        <>
          {/* soft shadow */}
          <path
            d={stickerPath(a.at)}
            transform={`translate(${STICKER.height * 0.06} ${STICKER.height * 0.1})`}
            fill="#0f172a"
            fillOpacity={0.18}
          />
          <path
            d={stickerPath(a.at)}
            fill={a.color}
            stroke="#0f172a"
            strokeOpacity={0.15}
            strokeWidth={0.0012}
          />
        </>
      );
    case "text":
      return (
        <text
          x={a.at[0]}
          y={a.at[1]}
          fontSize={a.size}
          fill={a.color}
          fontFamily="system-ui, sans-serif"
        >
          {a.text.split("\n").map((line, i) => (
            <tspan key={i} x={a.at[0]} dy={i === 0 ? "0.9em" : "1.25em"}>
              {line || " "}
            </tspan>
          ))}
        </text>
      );
  }
}

// Wide invisible copy of a mark, so thin lines are easy to hit with the
// eraser or text tool.
function HitArea({ a }: { a: Annotation }) {
  // Text and stickers are hit on their own painted area.
  if (a.kind === "text" || a.kind === "sticker") return null;
  const hit = {
    stroke: "transparent",
    strokeWidth: Math.max(a.size, 0.014),
    fill: "none",
    pointerEvents: "stroke" as const,
  };
  if (isStroke(a)) {
    return <path d={strokePath(a.points)} {...hit} />;
  }
  if (a.kind === "rect") {
    return (
      <rect
        x={Math.min(a.from[0], a.to[0])}
        y={Math.min(a.from[1], a.to[1])}
        width={Math.abs(a.to[0] - a.from[0])}
        height={Math.abs(a.to[1] - a.from[1])}
        {...hit}
      />
    );
  }
  if (a.kind === "ellipse") {
    return (
      <ellipse
        cx={(a.from[0] + a.to[0]) / 2}
        cy={(a.from[1] + a.to[1]) / 2}
        rx={Math.abs(a.to[0] - a.from[0]) / 2}
        ry={Math.abs(a.to[1] - a.from[1]) / 2}
        {...hit}
      />
    );
  }
  return (
    <line x1={a.from[0]} y1={a.from[1]} x2={a.to[0]} y2={a.to[1]} {...hit} />
  );
}

export default function AnnotationLayer({
  annotations,
  aspect,
  pageWidth,
  tool,
  color,
  size,
  onAdd,
  onRemove,
  onUpdate,
}: {
  annotations: Annotation[];
  aspect: number;
  pageWidth: number;
  tool: Tool;
  color: string;
  size: number;
  onAdd: (a: Annotation) => void;
  onRemove: (id: string) => void;
  onUpdate: (a: Annotation) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const erasing = useRef(false);
  // Touch points on the page: one finger draws, two fingers scroll the book.
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const panning = useRef(false);
  const [draft, setDraft] = useState<Annotation | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  // Sticker being dragged to a new spot.
  const [moving, setMoving] = useState<{
    id: string;
    at: Point;
    offset: Point;
    moved: boolean;
  } | null>(null);

  function toPoint(e: { clientX: number; clientY: number }): Point {
    const r = svgRef.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.width];
  }

  function annotationAt(e: React.PointerEvent) {
    for (const el of document.elementsFromPoint(e.clientX, e.clientY)) {
      const hit = el.closest("[data-ann-id]");
      if (hit && svgRef.current?.contains(hit)) {
        return annotations.find(
          (a) => a.id === hit.getAttribute("data-ann-id"),
        );
      }
    }
  }

  function commitText() {
    if (!editing) return;
    const text = editing.text.trimEnd();
    if (editing.id) {
      const original = annotations.find((a) => a.id === editing.id);
      if (!text) onRemove(editing.id);
      else if (original && original.kind === "text" && original.text !== text)
        onUpdate({ ...original, text });
    } else if (text) {
      onAdd({
        id: crypto.randomUUID(),
        kind: "text",
        at: editing.at,
        text,
        color: editing.color,
        size: editing.size,
      });
    }
    setEditing(null);
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (e.pointerType === "touch" && tool !== "hand") {
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.current.size >= 2) {
        // Second finger: stop drawing and scroll instead.
        e.currentTarget.setPointerCapture(e.pointerId);
        panning.current = true;
        erasing.current = false;
        setDraft(null);
        return;
      }
    }
    if (!e.isPrimary || e.button !== 0 || tool === "hand") return;

    if (tool === "text") {
      e.preventDefault();
      if (editing) return commitText();
      const existing = annotationAt(e);
      if (existing?.kind === "text") {
        setEditing({ ...(existing as TextAnnotation), id: existing.id });
      } else {
        setEditing({ id: null, at: toPoint(e), text: "", color, size });
      }
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    if (tool === "eraser") {
      erasing.current = true;
      const hit = annotationAt(e);
      if (hit) onRemove(hit.id);
      return;
    }

    if (tool === "sticker") {
      const p = toPoint(e);
      const hit = annotationAt(e);
      if (hit?.kind === "sticker") {
        setMoving({
          id: hit.id,
          at: hit.at,
          offset: [p[0] - hit.at[0], p[1] - hit.at[1]],
          moved: false,
        });
      } else {
        onAdd({
          id: crypto.randomUUID(),
          kind: "sticker",
          color,
          size: 0,
          at: p,
        });
      }
      return;
    }

    const p = toPoint(e);
    const id = crypto.randomUUID();
    if (tool === "pen" || tool === "highlighter") {
      setDraft({ id, kind: tool, color, size, points: [p] });
    } else {
      setDraft({ id, kind: tool, color, size, from: p, to: p });
    }
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const touch = touches.current.get(e.pointerId);
    if (touch) {
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (panning.current) {
        // Each finger moves the view by its share of the gesture.
        const share = touches.current.size;
        e.currentTarget
          .closest("[data-scroll-area]")
          ?.scrollBy(
            (touch.x - e.clientX) / share,
            (touch.y - e.clientY) / share,
          );
        return;
      }
    }
    if (!e.isPrimary) return;
    if (erasing.current) {
      const hit = annotationAt(e);
      if (hit) onRemove(hit.id);
      return;
    }
    if (moving) {
      const p = toPoint(e);
      setMoving({
        ...moving,
        at: [
          Math.min(1, Math.max(0, p[0] - moving.offset[0])),
          Math.min(aspect, Math.max(0, p[1] - moving.offset[1])),
        ],
        moved: true,
      });
      return;
    }
    if (!draft) return;
    if (isStroke(draft)) {
      // Coalesced events give the in-between points of fast pen movement.
      const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
      const added: Point[] = [];
      let last = draft.points[draft.points.length - 1];
      for (const ev of events.length ? events : [e.nativeEvent]) {
        const p = toPoint(ev);
        if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= MIN_POINT_DISTANCE) {
          added.push(p);
          last = p;
        }
      }
      if (added.length)
        setDraft({ ...draft, points: [...draft.points, ...added] });
    } else if (isShape(draft)) {
      const p = toPoint(e);
      setDraft({
        ...draft,
        to: e.shiftKey ? constrain(draft.kind, draft.from, p) : p,
      });
    }
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    touches.current.delete(e.pointerId);
    if (panning.current) {
      if (touches.current.size === 0) panning.current = false;
      return;
    }
    erasing.current = false;
    if (moving) {
      const sticker = annotations.find((a) => a.id === moving.id);
      if (moving.moved && sticker?.kind === "sticker") {
        onUpdate({ ...sticker, at: moving.at });
      }
      setMoving(null);
      return;
    }
    if (!draft) return;
    const tooSmall =
      isShape(draft) &&
      Math.hypot(draft.to[0] - draft.from[0], draft.to[1] - draft.from[1]) <
        0.004;
    if (!tooSmall) onAdd(draft);
    setDraft(null);
  }

  const cursor =
    tool === "hand"
      ? "auto"
      : tool === "text"
        ? "text"
        : tool === "eraser"
          ? "cell"
          : tool === "sticker"
            ? moving
              ? "grabbing"
              : "copy"
            : "crosshair";

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={`0 0 1 ${aspect}`}
        className="absolute inset-0 size-full"
        style={{
          cursor,
          // Let the page scroll with touch only when not drawing.
          touchAction: tool === "hand" ? "auto" : "none",
          pointerEvents: tool === "hand" ? "none" : "auto",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Stickers sit on top of everything else. */}
        {[
          ...annotations.filter((a) => a.kind !== "sticker"),
          ...annotations.filter((a) => a.kind === "sticker"),
        ].map((a) => {
          if (a.id === editing?.id) return null;
          const shown =
            moving?.id === a.id && a.kind === "sticker"
              ? { ...a, at: moving.at }
              : a;
          return (
            <g
              key={a.id}
              data-ann-id={a.id}
              style={
                a.kind === "sticker" && tool === "sticker"
                  ? { cursor: moving ? "grabbing" : "grab" }
                  : undefined
              }
            >
              <Shape a={shown} />
              <HitArea a={shown} />
            </g>
          );
        })}
        {draft && <Shape a={draft} />}
      </svg>

      {editing && (
        <textarea
          autoFocus
          value={editing.text}
          onChange={(e) => setEditing({ ...editing, text: e.target.value })}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(null);
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commitText();
          }}
          placeholder="Type…"
          aria-label="Text annotation"
          rows={1}
          className="absolute z-10 min-w-24 resize-none border border-dashed border-sky-500 bg-white/70 p-0 leading-[1.25] outline-none field-sizing-content"
          style={{
            left: `${editing.at[0] * 100}%`,
            top: `${(editing.at[1] / aspect) * 100}%`,
            fontSize: editing.size * pageWidth,
            color: editing.color,
            fontFamily: "system-ui, sans-serif",
          }}
        />
      )}
    </>
  );
}
