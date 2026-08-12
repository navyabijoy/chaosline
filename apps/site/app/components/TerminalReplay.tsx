"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type DemoEvent =
  | { t: number; kind: "tool_call"; tool: string; args: Record<string, unknown> }
  | { t: number; kind: "tool_result"; ok: boolean; body: unknown; injected?: string; note?: string }
  | { t: number; kind: "agent_output"; text: string };

interface DemoRun {
  scenario: string;
  task: string;
  agent: string;
  agentLabel: string;
  fault: string;
  events: DemoEvent[];
  ledger: Array<{ refund_id: string; order_id: string; amount_cents: number }>;
  verdict: string;
  evidence: string;
}

interface Props {
  run: DemoRun;
  autoplay?: boolean;
  onComplete?: () => void;
}

const STEP_DELAY = 900; // ms per event step

function LedgerCounter({ count, max }: { count: number; max: number }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[12px]">
      <span className="text-white/50">ledger entries:</span>
      <div className="flex gap-1.5">
        {Array.from({ length: max }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={
              i < count
                ? { scale: 1, opacity: 1, backgroundColor: "#ff3b30" }
                : { scale: 0.6, opacity: 0.25, backgroundColor: "#555" }
            }
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="w-5 h-5 rounded-sm flex items-center justify-center text-white text-[10px] font-bold"
            style={{ backgroundColor: i < count ? "#ff3b30" : "#555" }}
          >
            {i + 1}
          </motion.div>
        ))}
      </div>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#ff3b30] font-semibold"
        >
          ${((count * 8400) / 100).toFixed(2)}
        </motion.span>
      )}
    </div>
  );
}

function VerdictBadge({ verdict, visible }: { verdict: string; visible: boolean }) {
  const colorClass =
    verdict === "HARMFUL_ACTION"
      ? "verdict-harmful-action"
      : verdict === "SILENT_FAILURE"
      ? "verdict-silent-failure"
      : "verdict-safe";

  const emoji =
    verdict === "HARMFUL_ACTION" ? "🔴" : verdict === "SILENT_FAILURE" ? "🟠" : "🟢";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className={`verdict-badge ${colorClass} mt-3 w-fit animate-pulse-glow`}
        >
          {emoji} {verdict}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EventLine({ event, index }: { event: DemoEvent; index: number }) {
  if (event.kind === "tool_call") {
    const args = event.args as Record<string, unknown>;
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-2"
      >
        <span className="text-[#64d2ff]">→ tool_call</span>{" "}
        <span className="text-[#ffd60a]">{event.tool}</span>
        <span className="text-white/60">
          ({JSON.stringify(args)})
        </span>
      </motion.div>
    );
  }

  if (event.kind === "tool_result") {
    if (event.injected) {
      return (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-2"
        >
          <span className="text-[#ff453a]">✗ tool_result</span>{" "}
          <span className="text-[#ff453a]/80 font-mono text-[11px]">
            [FAULT: {event.injected}]
          </span>
          {event.note && (
            <div className="ml-4 text-[#ff453a]/60 text-[11px] italic mt-0.5">
              {event.note}
            </div>
          )}
        </motion.div>
      );
    }
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-2"
      >
        <span className={event.ok ? "text-[#30d158]" : "text-[#ff453a]"}>
          {event.ok ? "✓" : "✗"} tool_result
        </span>{" "}
        <span className="text-white/60 text-[11px]">
          {JSON.stringify(event.body)}
        </span>
      </motion.div>
    );
  }

  if (event.kind === "agent_output") {
    // Show first 2 lines only
    const lines = event.text.split("\n").slice(0, 3);
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-2"
      >
        <span className="text-[#bf5af2]">→ agent_output</span>
        {lines.map((line, i) => (
          <div key={i} className="ml-4 text-white/80 text-[12px]">
            {line || <>&nbsp;</>}
          </div>
        ))}
        {event.text.split("\n").length > 3 && (
          <div className="ml-4 text-white/40 text-[11px]">…</div>
        )}
      </motion.div>
    );
  }

  return null;
}

export default function TerminalReplay({ run, autoplay = true, onComplete }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const [visibleEvents, setVisibleEvents] = useState<DemoEvent[]>([]);
  const [ledgerCount, setLedgerCount] = useState(0);
  const [verdictVisible, setVerdictVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const maxLedger = run.ledger.length;

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const play = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setVisibleEvents([]);
    setLedgerCount(0);
    setVerdictVisible(false);
    setDone(false);
    clearTimeouts();

    // If reduced motion  -  show all immediately
    if (prefersReducedMotion) {
      setVisibleEvents(run.events as DemoEvent[]);
      setLedgerCount(maxLedger);
      setVerdictVisible(true);
      setDone(true);
      setIsPlaying(false);
      onComplete?.();
      return;
    }

    let ledger = 0;

    run.events.forEach((event, i) => {
      const delay = i * STEP_DELAY;

      const t = setTimeout(() => {
        setVisibleEvents((prev) => [...prev, event as DemoEvent]);

        // Increment ledger when a fault fires (charge committed but response lost)
        if (
          (event as DemoEvent).kind === "tool_result" &&
          (event as { injected?: string }).injected
        ) {
          ledger += 1;
          setLedgerCount(ledger);
        }
      }, delay);
      timeoutsRef.current.push(t);
    });

    // Show verdict after all events
    const finalDelay = run.events.length * STEP_DELAY + 600;
    const t = setTimeout(() => {
      setVerdictVisible(true);
      setDone(true);
      setIsPlaying(false);
      onComplete?.();
    }, finalDelay);
    timeoutsRef.current.push(t);
  };

  const reset = () => {
    clearTimeouts();
    setVisibleEvents([]);
    setLedgerCount(0);
    setVerdictVisible(false);
    setIsPlaying(false);
    setDone(false);
  };

  useEffect(() => {
    if (autoplay) {
      const t = setTimeout(play, 600);
      timeoutsRef.current.push(t);
    }
    return clearTimeouts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay]);

  return (
    <div className="terminal-window w-full max-w-2xl">
      {/* Title bar */}
      <div className="terminal-titlebar">
        <div className="terminal-dot terminal-dot-red" />
        <div className="terminal-dot terminal-dot-yellow" />
        <div className="terminal-dot terminal-dot-green" />
        <span className="ml-3 text-white/40 text-[11px] font-mono flex-1">
          {run.scenario}
        </span>
        <span className="text-white/30 text-[10px]">{run.agentLabel}</span>
      </div>

      {/* Body */}
      <div className="terminal-body">
        {/* Task prompt */}
        <div className="mb-4 pb-3 border-b border-white/10">
          <span className="text-white/40 text-[11px]">task: </span>
          <span className="text-white/70 text-[12px]">{run.task}</span>
        </div>

        {/* Events */}
        <div className="space-y-0 mb-4">
          {visibleEvents.map((event, i) => (
            <EventLine key={i} event={event} index={i} />
          ))}
          {isPlaying && (
            <span className="inline-block w-2 h-3.5 bg-white/60 animate-blink ml-0.5" />
          )}
        </div>

        {/* Ledger counter (shown once first fault fires) */}
        {ledgerCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 pt-3 border-t border-white/10"
          >
            <LedgerCounter count={ledgerCount} max={maxLedger} />
          </motion.div>
        )}

        {/* Verdict */}
        <VerdictBadge verdict={run.verdict} visible={verdictVisible} />

        {verdictVisible && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-white/50 text-[11px]"
          >
            {run.evidence}
          </motion.p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-5 py-3 border-t border-white/10 bg-black/30">
        <button
          onClick={done ? reset : play}
          disabled={isPlaying}
          className="text-white/60 hover:text-white text-[11px] font-mono transition-colors disabled:opacity-40"
          id={`terminal-replay-btn-${run.scenario.replace(/\//g, "-")}`}
        >
          {isPlaying ? "▶ playing…" : done ? "↺ replay" : "▶ play"}
        </button>
        <span className="text-white/20 text-[10px]">·</span>
        <span className="text-white/30 text-[10px] font-mono">
          fault: {run.fault}
        </span>
        <span className="text-white/20 text-[10px]">·</span>
        <span className="text-white/30 text-[10px]">2026-08-11</span>
      </div>
    </div>
  );
}
