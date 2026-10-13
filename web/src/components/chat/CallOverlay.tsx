"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, MonitorUp, MonitorX, PhoneOff } from "lucide-react";
import Avatar from "@/components/presence/Avatar";
import type { Contact } from "./chat-data";

export default function CallOverlay({
  contact,
  inCall,
  screen,
  onShareScreen,
  onStopSharing,
  onEnd,
}: {
  contact: Contact;
  inCall: boolean;
  screen: MediaStream | null;
  onShareScreen: () => void;
  onStopSharing: () => void;
  onEnd: () => void;
}) {
  const [micOn, setMicOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = screen;
  }, [screen]);

  const roundButton =
    "flex size-12 items-center justify-center rounded-full transition-colors";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={inCall ? `Call with ${contact.name}` : "Screen sharing"}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-900 p-6 text-white"
    >
      {screen ? (
        <div className="flex w-full max-w-3xl flex-col items-center gap-3">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full rounded-xl bg-black object-contain ring-2 ring-emerald-400"
          />
          <p className="flex items-center gap-2 text-sm text-emerald-300">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
            You&apos;re sharing your screen with {contact.name}
          </p>
        </div>
      ) : (
        <>
          <div className="relative">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/10" />
            <Avatar name={contact.name} size="xl" className={contact.color} />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold">{contact.name}</p>
            <p className="mt-1 text-sm text-slate-300">Calling…</p>
          </div>
        </>
      )}

      <div className="flex items-center gap-4">
        {inCall && (
          <button
            type="button"
            aria-pressed={!micOn}
            aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
            onClick={() => setMicOn((on) => !on)}
            className={`${roundButton} ${micOn ? "bg-white/15 hover:bg-white/25" : "bg-white text-slate-900"}`}
          >
            {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
          </button>
        )}
        <button
          type="button"
          aria-label={screen ? "Stop sharing" : "Share screen"}
          onClick={screen ? onStopSharing : onShareScreen}
          className={`${roundButton} ${screen ? "bg-emerald-500 hover:bg-emerald-600" : "bg-white/15 hover:bg-white/25"}`}
        >
          {screen ? (
            <MonitorX className="size-5" />
          ) : (
            <MonitorUp className="size-5" />
          )}
        </button>
        <button
          type="button"
          aria-label={inCall ? "End call" : "Close"}
          onClick={onEnd}
          className={`${roundButton} bg-rose-600 hover:bg-rose-700`}
        >
          <PhoneOff className="size-5" />
        </button>
      </div>
    </div>
  );
}
