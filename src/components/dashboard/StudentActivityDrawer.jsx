import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Flame, TrendingUp, Calendar, BarChart3,
  BookOpen, Loader2, MessageSquare, RefreshCw,
} from "lucide-react";
import { fetchAnalyticsSummary, pushWorksheet } from "../../store/dailyLogsSlice";
import PracticeStreak from "./PracticeStreak";

const CATEGORY_COLORS = {
  OPENINGS: { bar: "bg-blue-500", text: "text-blue-400", bg: "bg-blue-500/10" },
  TACTICS: { bar: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-500/10" },
  ENDGAMES: { bar: "bg-purple-500", text: "text-purple-400", bg: "bg-purple-500/10" },
};

const CATEGORY_EMOJI = { OPENINGS: "♟", TACTICS: "⚔️", ENDGAMES: "👑" };

const APP_URL = "https://chesscoach-pro.netlify.app"; // Hardcoded app URL

// Stat mini-card
function MiniStat({ label, value, sub, color = "emerald" }) {
  const colors = {
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    amber: "text-amber-400",
    purple: "text-purple-400",
  };
  return (
    <div className="bg-slate-900/60 rounded-xl px-4 py-3 flex flex-col gap-0.5">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value ?? "—"}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// Horizontal bar chart row
function CategoryRow({ name, data, maxLogs }) {
  const cfg = CATEGORY_COLORS[name] || { bar: "bg-slate-500", text: "text-slate-400", bg: "bg-slate-700" };
  const pct = maxLogs > 0 ? Math.round((data.logs / maxLogs) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <span>{CATEGORY_EMOJI[name]}</span>
          <span className={cfg.text}>{name.charAt(0) + name.slice(1).toLowerCase()}</span>
        </span>
        <span className="text-slate-400 text-xs">
          {data.logs} logs · {data.minutes} min
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-700/60 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${cfg.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function StudentActivityDrawer({ classroom, onClose }) {
  const dispatch = useDispatch();
  const { summaries, analyticsStatus } = useSelector((s) => s.dailyLogs);
  const summary = summaries[classroom?.id];
  const homework = classroom?.homework || [];
  const assignedHomework = homework.filter(
    (h) => h.status?.toLowerCase() === "assigned"
  );

  useEffect(() => {
    if (classroom?.id) {
      dispatch(fetchAnalyticsSummary(classroom.id));
    }
  }, [dispatch, classroom?.id]);

  const handleNudge = () => {
    const name = summary?.studentName || classroom?.studentName || "there";
    const text = `Hi ${name}! 👋 Don't forget to log your practice for today. It only takes 1 minute!\n\nLog here: ${APP_URL}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handlePushWorksheet = (hw) => {
    dispatch(pushWorksheet({ classroomId: classroom.id, worksheetId: hw.id }));
  };

  const maxLogs = summary
    ? Math.max(
      ...Object.values(summary.breakdownByCategory || {}).map((c) => c.logs),
      1
    )
    : 1;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-end p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <motion.div
        className="relative z-10 w-full max-w-lg h-full max-h-[calc(100vh-2rem)] bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 60, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-300">
              {(summary?.studentName || classroom?.studentName || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-white leading-none">
                {summary?.studentName || classroom?.studentName}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Practice Analytics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {analyticsStatus === "loading" && !summary ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Loading analytics…</p>
            </div>
          ) : !summary ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <BarChart3 className="w-10 h-10 opacity-30" />
              <p>No data available yet.</p>
            </div>
          ) : (
            <>
              {/* ── This week ─────────────────────────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                    This Week
                  </h3>
                </div>
                {/* Accuracy bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>{summary.weekly.weeklyAccuracy}</span>
                    <span>{summary.weekly.logsSubmitted} / {summary.weekly.daysIntoWeek} days</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${summary.weekly.daysIntoWeek > 0
                          ? Math.round((summary.weekly.logsSubmitted / summary.weekly.daysIntoWeek) * 100)
                          : 0}%`,
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <MiniStat label="Games" value={summary.weekly.totalGames} color="emerald" />
                  <MiniStat label="Minutes" value={summary.weekly.totalMinutes} color="blue" />
                  <MiniStat
                    label="Streak"
                    value={`${summary.currentStreak}🔥`}
                    color="amber"
                  />
                </div>
              </section>

              {/* ── This month ────────────────────────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                    This Month
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <MiniStat label="Days Logged" value={summary.monthly.logsSubmitted} color="blue" />
                  <MiniStat label="Total Min" value={summary.monthly.totalMinutes} color="purple" />
                  <MiniStat label="Total Games" value={summary.monthly.totalGames} color="emerald" />
                </div>
              </section>

              {/* ── Category breakdown ────────────────────────────────────── */}
              {summary.breakdownByCategory && Object.keys(summary.breakdownByCategory).length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                      Category Breakdown
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(summary.breakdownByCategory).map(([name, data]) => (
                      <CategoryRow key={name} name={name} data={data} maxLogs={maxLogs} />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Dot matrix + streak ───────────────────────────────────── */}
              <section>
                <PracticeStreak
                  logs={summary.recentLogs || []}
                  streak={summary.currentStreak}
                />
              </section>

              {/* ── Recent logs ───────────────────────────────────────────── */}
              {summary.recentLogs?.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                      Recent Logs
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {summary.recentLogs.map((log) => {
                      const cfg = CATEGORY_COLORS[log.category] || {};
                      return (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/40"
                        >
                          <span className="text-lg mt-0.5">
                            {CATEGORY_EMOJI[log.category] || "📝"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-semibold ${cfg.text || "text-slate-400"}`}>
                                {log.category}
                              </span>
                              <span className="text-slate-600 text-xs">
                                {log.date
                                  ? new Date(log.date).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })
                                  : "—"}
                              </span>
                              {log.gamesPlayed != null && (
                                <span className="text-xs text-slate-500">
                                  {log.gamesPlayed} games
                                </span>
                              )}
                              {log.minutesSpent != null && (
                                <span className="text-xs text-slate-500">
                                  {log.minutesSpent} min
                                </span>
                              )}
                            </div>
                            {log.notes && (
                              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{log.notes}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── Re-assign Worksheet ───────────────────────────────────── */}
              {assignedHomework.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                      Re-assign Worksheet
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {assignedHomework.map((hw) => (
                      <div
                        key={hw.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/40"
                      >
                        <span className="text-sm text-slate-300 truncate">{hw.title}</span>
                        <button
                          onClick={() => handlePushWorksheet(hw)}
                          className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors font-medium"
                        >
                          Re-push
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Sticky footer – Nudge button */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-700/50 bg-slate-800">
          <button
            onClick={handleNudge}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold text-sm transition-colors shadow-lg shadow-green-500/20"
          >
            <MessageSquare className="w-4 h-4" />
            Send WhatsApp Nudge
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
