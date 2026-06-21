import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Flame, CheckCircle, Clock, Minus, Plus, Send, Pencil, Loader2,
} from "lucide-react";
import {
  submitDailyLog,
  updateDailyLog,
  clearSubmitStatus,
} from "../../store/dailyLogsSlice";

// ── Constants ───────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "OPENINGS", label: "Openings", emoji: "♟" },
  { key: "TACTICS", label: "Tactics", emoji: "⚔️" },
  { key: "ENDGAMES", label: "Endgames", emoji: "👑" },
];

const WS_STATUSES = [
  { key: null, label: "None" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Done ✓" },
];

// ── Counter sub-component ───────────────────────────────────────────────────────
function Counter({ value, onDecrement, onIncrement, min = 0, step = 1, unit = "" }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onDecrement}
        disabled={value <= min}
        className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="text-2xl font-semibold w-12 text-center tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
      {unit && <span className="text-sm text-slate-400">{unit}</span>}
    </div>
  );
}

// ── Success Flash ───────────────────────────────────────────────────────────────
function SuccessFlash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="flex flex-col items-center gap-4 py-10"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.5 }}
    >
      <motion.div
        className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <CheckCircle className="w-10 h-10 text-emerald-400" />
      </motion.div>
      <p className="text-xl font-semibold text-emerald-400">Logged! 🔥</p>
      <p className="text-slate-400 text-sm">Keep the streak going!</p>
    </motion.div>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────────────────
export default function DailyLogForm({ classroomId, todayLog, onClose }) {
  const dispatch = useDispatch();
  const { submitStatus, error } = useSelector((s) => s.dailyLogs);
  const isEditing = !!todayLog;

  const [category, setCategory] = useState(todayLog?.category || "TACTICS");
  const [games, setGames] = useState(todayLog?.gamesPlayed ?? 0);
  const [minutes, setMinutes] = useState(todayLog?.minutesSpent ?? 30);
  const [worksheetStatus, setWorksheetStatus] = useState(todayLog?.worksheetStatus ?? null);
  const [notes, setNotes] = useState(todayLog?.notes ?? "");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    dispatch(clearSubmitStatus());
  }, [dispatch]);

  // Show success flash when submit resolves
  useEffect(() => {
    if (submitStatus === "success") {
      setShowSuccess(true);
    }
  }, [submitStatus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      category,
      gamesPlayed: games,
      minutesSpent: minutes,
      worksheetStatus: worksheetStatus || null,
      notes: notes.trim() || null,
    };

    if (isEditing) {
      dispatch(updateDailyLog({ classroomId, logId: todayLog.id, data: payload }));
    } else {
      dispatch(submitDailyLog({ classroomId, data: payload }));
    }
  };

  const isSubmitting = submitStatus === "loading";

  return (
    // Backdrop
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Blur overlay */}
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-md bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.93, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.93, y: 16, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isEditing ? "✏️" : "🔥"}</span>
            <div>
              <h2 className="font-semibold text-lg text-white leading-none">
                {isEditing ? "Edit Today's Log" : "Log Today's Practice"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <SuccessFlash key="success" onDone={onClose} />
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 py-5 space-y-6"
            >
              {/* Error banner */}
              {submitStatus === "error" && error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                  {typeof error === "string" ? error : error?.message || "Something went wrong"}
                </div>
              )}

              {/* Category */}
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                  What did you practice?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategory(cat.key)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all text-sm font-medium ${
                        category === cat.key
                          ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.4)]"
                          : "bg-slate-700/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Counters row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                    Games played
                  </p>
                  <Counter
                    value={games}
                    min={0}
                    onDecrement={() => setGames((g) => Math.max(0, g - 1))}
                    onIncrement={() => setGames((g) => Math.min(99, g + 1))}
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                    Minutes spent
                  </p>
                  <Counter
                    value={minutes}
                    min={0}
                    step={5}
                    unit="min"
                    onDecrement={() => setMinutes((m) => Math.max(0, m - 5))}
                    onIncrement={() => setMinutes((m) => Math.min(300, m + 5))}
                  />
                </div>
              </div>

              {/* Worksheet status */}
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                  Worksheet
                </p>
                <div className="flex gap-2">
                  {WS_STATUSES.map((ws) => (
                    <button
                      key={String(ws.key)}
                      type="button"
                      onClick={() => setWorksheetStatus(ws.key)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                        worksheetStatus === ws.key
                          ? ws.key === "COMPLETED"
                            ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
                            : ws.key === "IN_PROGRESS"
                            ? "bg-amber-500/15 border-amber-500/50 text-amber-400"
                            : "bg-slate-600/60 border-slate-500 text-slate-200"
                          : "bg-slate-700/50 border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {ws.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                  Notes <span className="normal-case font-normal">(optional)</span>
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Anything to remember from today's session…"
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 resize-none transition-colors"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                  </>
                ) : isEditing ? (
                  <>
                    <Pencil className="w-4 h-4" /> Update Log
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Log
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
