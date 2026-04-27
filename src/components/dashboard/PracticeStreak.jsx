import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

// Builds an array of the last `days` calendar dates (strings "YYYY-MM-DD")
function getLastNDays(n = 30) {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    result.push(
      new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0]
    );
  }
  return result;
}

function getTodayStr() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
}

export default function PracticeStreak({ logs = [], streak = 0, className = "" }) {
  const today = getTodayStr();
  const days = useMemo(() => getLastNDays(35), []); // 35 days → 5 rows × 7 cols

  // Build a Set of logged date strings for O(1) lookup
  const loggedDays = useMemo(
    () =>
      new Set(
        logs.map((l) =>
          l.date?.split("T")[0] ?? ""
        )
      ),
    [logs]
  );

  // Weekday header labels (Mon-first to match ISO week)
  const weekLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className={`space-y-5 ${className}`}>
      {/* ── Streak Counter ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20">
        <motion.div
          className="relative"
          animate={{ scale: streak > 0 ? [1, 1.15, 1] : 1 }}
          transition={{ duration: 1.2, repeat: streak > 0 ? Infinity : 0, repeatDelay: 3 }}
        >
          <Flame
            className={`w-10 h-10 ${streak > 0 ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.7)]" : "text-slate-600"}`}
            fill={streak > 0 ? "rgba(251,146,60,0.3)" : "transparent"}
          />
          {streak >= 7 && (
            <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
              🔥
            </span>
          )}
        </motion.div>
        <div>
          <p className="text-3xl font-bold text-white leading-none">
            {streak}
            <span className="text-lg font-normal text-slate-400 ml-1">
              {streak === 1 ? "day" : "days"}
            </span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {streak === 0
              ? "Start your streak by logging today!"
              : streak < 3
              ? "Keep going — you're building momentum!"
              : streak < 7
              ? "Great consistency!"
              : "Legendary streak! 🏆"}
          </p>
        </div>
      </div>

      {/* ── Dot-Matrix Calendar ────────────────────────────────────────────── */}
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
          Last 35 days
        </p>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 gap-1.5 mb-1">
          {weekLabels.map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-center text-[10px] font-medium text-slate-600"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Dot grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((dateStr, i) => {
            const logged = loggedDays.has(dateStr);
            const isToday = dateStr === today;
            const isFuture = dateStr > today;

            return (
              <motion.div
                key={dateStr}
                title={dateStr}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.012, type: "spring", bounce: 0.4 }}
                className={`aspect-square rounded-full transition-all ${
                  isFuture
                    ? "bg-slate-800/30"
                    : logged
                    ? isToday
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] ring-2 ring-emerald-400/40"
                      : "bg-emerald-500"
                    : isToday
                    ? "bg-slate-600 ring-2 ring-slate-400/50"
                    : "bg-slate-700/70"
                }`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Logged
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
            Missed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800/30 inline-block" />
            Future
          </span>
        </div>
      </div>
    </div>
  );
}
