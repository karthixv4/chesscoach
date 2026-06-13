import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchClassrooms, fetchStudentSessions, fetchClassroomDetails } from "../store/classroomsSlice";
import { fetchDailyLogs } from "../store/dailyLogsSlice";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, CheckCircle, Clock, ChevronRight, Calendar, FileText,
  CalendarPlus, History, Video, CheckSquare, XCircle, Star,
  Flame, PlusCircle,
} from "lucide-react";
import ProgressTracker from "../components/dashboard/ProgressTracker";
import DailyLogForm from "../components/dashboard/DailyLogForm";
import PracticeStreak from "../components/dashboard/PracticeStreak";
import { FEATURES } from "../config/features";
import QuoteOfTheDay from "../components/dashboard/QuoteOfTheDay";
import ViewSessionModal from "../components/modals/ViewSessionModal";
import CalendarView from "../components/dashboard/CalendarView";
import EvaluationsDeck from "../components/dashboard/EvaluationsDeck";
import Markdown from "react-markdown";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

// ── Compute current streak from a sorted (desc) logs array ──────────────────
function computeStreak(logs = []) {
  if (!logs.length) return 0;
  let streak = 0;
  // Start cursor at today (UTC midnight)
  let cursor = new Date();
  cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate()));

  // logs are already ordered desc by date from the API
  for (const log of logs) {
    const d = new Date(log.date);
    const logUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    if (+logUTC === +cursor) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else if (+logUTC < +cursor) {
      break; // gap — streak is over
    }
  }
  return streak;
}

// ── Animated three-dot loader for stat numbers ────────────────────────────────
function DotsLoader() {
  return (
    <span className="flex items-end gap-0.5 h-8">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

export default function StudentHome() {
  const { user } = useSelector((state) => state.auth);
  const { classrooms, status, detailsStatus, studentSessions, studentSessionsStatus } = useSelector(
    (state) => state.classrooms
  );
  const { logs, todayLog } = useSelector((state) => state.dailyLogs);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dailyPuzzle, setDailyPuzzle] = useState(null);
  const [puzzleFen, setPuzzleFen] = useState("");
  const [puzzleLoading, setPuzzleLoading] = useState(true);
  const [puzzleError, setPuzzleError] = useState(false);
  const [activeTab, setActiveTab] = useState("schedule");
  // Sub-tabs
  const [scheduleSubTab, setScheduleSubTab] = useState("calendar"); // "calendar" | "upcoming" | "past"
  const [assignmentSubTab, setAssignmentSubTab] = useState("pending"); // "pending" | "completed"
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "assignments", label: "Assignments", icon: FileText },
    { id: "performance", label: "Performance", icon: Flame },
  ];

  // ── Daily puzzle ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("https://lichess.org/api/puzzle/daily")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        setDailyPuzzle(data);
        try {
          const chess = new Chess();
          chess.loadPgn(data.game.pgn);
          setPuzzleFen(chess.fen());
        } catch (e) {
          console.error("Failed to parse PGN", e);
          setPuzzleError(true);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch daily puzzle", err);
        setPuzzleError(true);
      })
      .finally(() => setPuzzleLoading(false));
  }, []);

  // ── Data fetching ───────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchClassrooms());
    if (user?.id) {
      dispatch(fetchStudentSessions({ studentId: user.id }));
    }
  }, [dispatch, user?.id]);

  const classroom = classrooms.find((c) => c.studentId === user?.id);

  useEffect(() => {
    if (classroom?.id && !classroom.homework) {
      dispatch(fetchClassroomDetails(classroom.id));
    }
    if (classroom?.id) {
      // Fetch last 35 days of logs so PracticeStreak has full data
      const from = new Date();
      from.setDate(from.getDate() - 35);
      const fromStr = new Date(from.getTime() - from.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];
      dispatch(fetchDailyLogs({ classroomId: classroom.id, params: { from: fromStr } }));
    }
  }, [dispatch, classroom?.id, classroom?.homework]);

  // ── Loading: initial classrooms list ───────────────────────────────────────
  if (status === "loading" && classrooms.length === 0) {
    return (
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-slate-700/60 rounded-xl animate-pulse mb-2" />
            <div className="h-4 w-56 bg-slate-700/60 rounded animate-pulse" />
          </div>
          <div className="w-36 h-9 bg-slate-700/60 rounded-xl animate-pulse" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-700/60 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-20 bg-slate-700/60 rounded animate-pulse" />
                  <div className="h-6 w-8 bg-slate-700/60 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <div className="h-5 w-40 bg-slate-700/60 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-slate-700/50">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-48 bg-slate-700/60 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-slate-700/60 rounded animate-pulse" />
                </div>
                <div className="w-5 h-5 bg-slate-700/60 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Loading: classroom details for this student ─────────────────────────────
  if (!classroom) {
    if (detailsStatus === "loading") {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-8 h-8 border-4 border-slate-600 border-t-blue-400 rounded-full animate-spin"
                  style={{ animationDirection: "reverse" }}
                />
              </div>
            </div>
            <p className="text-sm font-medium tracking-wide">Loading your classroom...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 text-lg">No classroom assigned yet.</p>
      </div>
    );
  }

  // ── Derived data ────────────────────────────────────────────────────────────
  const pendingHomework = (classroom.homework || []).filter(
    (h) => h.status?.toLowerCase() === "assigned"
  );
  const completedHomework = (classroom.homework || []).filter(
    (h) => h.status?.toLowerCase() !== "assigned"
  );

  const todayStr = new Date(
    currentTime.getTime() - currentTime.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split("T")[0];

  const getEffectiveDate = (s) =>
    s.rescheduledDate
      ? s.rescheduledDate.split("T")[0]
      : s.date
        ? s.date.split("T")[0]
        : "";

  // BUG FIX: studentSessions is initialised as [] so it was always truthy,
  // preventing classroom.sessions from being used. We now prefer studentSessions
  // only when it is non-empty AND has been populated (i.e. the fetch succeeded).
  const allSessions =
    studentSessions && studentSessions.length > 0
      ? studentSessions
      : classroom.sessions || [];

  const UPCOMING_STATUSES = ["SCHEDULED", "POSTPONED", "PREPONED", "ONGOING"];

  const upcomingSessions = allSessions.filter(
    (s) =>
      UPCOMING_STATUSES.includes(s.status?.toUpperCase())
  );

  const pastSessions = allSessions.filter(
    (s) =>
      ["COMPLETED", "CANCELLED"].includes(s.status?.toUpperCase())
  );

  // Is sessions data still loading?
  // We consider sessions "loading" only while the Redux classrooms/details fetch is in-flight.
  // We do NOT gate on allSessions.length === 0 because a student may genuinely have no sessions.
  const sessionsLoading = status === "loading" || detailsStatus === "loading" || studentSessionsStatus === "loading";

  const getUpcomingTimeInfo = (s) => {
    if (!UPCOMING_STATUSES.includes(s.status?.toUpperCase())) return null;
    const targetDate = s.rescheduledDate
      ? s.rescheduledDate.split("T")[0]
      : s.date
        ? s.date.split("T")[0]
        : null;
    const targetTime = s.rescheduledStart || s.startTime;
    if (!targetDate || !targetTime) return null;
    const sDateTime = new Date(`${targetDate}T${targetTime}:00`);
    const diffMs = sDateTime - currentTime;
    if (diffMs > 0 && diffMs < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) return `Starts in ${days}d ${hrs}h`;
      if (hrs > 0) return `Starts in ${hrs}h ${mins}m`;
      return `Starts in ${mins}m`;
    } else if (diffMs <= 0 && diffMs > -60 * 60 * 1000) {
      return "Just started";
    }
    return null;
  };

  const getDueTimeInfo = (hw) => {
    if (!hw.dueDate) return null;
    const endOfDay = new Date(hw.dueDate);
    endOfDay.setHours(23, 59, 59, 999);
    const diffMs = endOfDay - currentTime;
    if (diffMs >= 0) {
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (days === 0) return "Due today";
      if (days === 1) return "Due in 1 day";
      return `Due in ${days} days`;
    }
    return "Overdue";
  };

  const getGoogleCalendarUrl = (session) => {
    const targetDateStr = session.rescheduledDate
      ? session.rescheduledDate.split("T")[0]
      : session.date
        ? session.date.split("T")[0]
        : null;
    const targetStart = session.rescheduledStart || session.startTime;
    const targetEnd = session.rescheduledEnd || session.endTime;
    if (!targetDateStr || !targetStart || !targetEnd) return "#";
    const fmt = (d, t) => `${d.replace(/-/g, "")}T${t.replace(/:/g, "")}00`;
    const titleComponent = encodeURIComponent(
      `${classroom?.name || "Chess class"} - ${session.title}`
    );
    const detailsComponent = encodeURIComponent(`Link: ${session.link}`);
    const locationComponent = encodeURIComponent(session.link || "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titleComponent}&dates=${fmt(
      targetDateStr,
      targetStart
    )}/${fmt(targetDateStr, targetEnd)}&details=${detailsComponent}&location=${locationComponent}`;
  };

  // ── Stat values (show DotsLoader while loading) ─────────────────────────────
  const statIsLoading = status === "loading" || detailsStatus === "loading";

  const stats = [
    {
      label: "Total Sessions",
      value: allSessions.length,
      icon: Calendar,
      color: "blue",
      loading: sessionsLoading,
    },
    {
      label: "Pending Tasks",
      value: pendingHomework.length,
      icon: Clock,
      color: "orange",
      loading: statIsLoading && !classroom.homework,
    },
    {
      label: "Completed",
      value: completedHomework.length,
      icon: CheckCircle,
      color: "emerald",
      loading: statIsLoading && !classroom.homework,
    },
  ];

  if (FEATURES.ENABLE_PRACTICE_LOGS) {
    stats.push({
      label: "Practice Streak",
      value: `${computeStreak(logs)}d`,
      icon: Flame,
      color: "orange",
      loading: false,
    });
  }



  const colorMap = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-400" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-400" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400" },
  };

  // ── Past session card renderer ──────────────────────────────────────────────
  const statusConfig = {
    completed: { badge: "bg-emerald-500/20 text-emerald-400", icon: CheckSquare, label: "Completed" },
    cancelled: { badge: "bg-red-500/20 text-red-400", icon: XCircle, label: "Cancelled" },
    ongoing: { badge: "bg-emerald-500 text-white", icon: Video, label: "Live" },
    scheduled: { badge: "bg-blue-500 text-white", icon: Calendar, label: "Scheduled" },
    postponed: { badge: "bg-orange-500 text-white", icon: Calendar, label: "Postponed" },
    preponed: { badge: "bg-purple-500 text-white", icon: Calendar, label: "Preponed" },
  };

  const renderPastSessionCard = (session, i) => {
    const statusKey = session.status?.toLowerCase();
    const cfg = statusConfig[statusKey] || { badge: "bg-slate-600 text-slate-200", icon: Calendar, label: statusKey };
    const SessionIcon = cfg.icon;
    const displayDate = session.rescheduledDate || session.date;
    return (
      <motion.div
        key={session.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.07 }}
        className="p-6 hover:bg-slate-700/30 transition-colors border-b border-slate-700/50 last:border-b-0"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={`mt-0.5 p-2 rounded-xl shrink-0 ${statusKey === "completed"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : statusKey === "cancelled"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-slate-700 text-slate-400"
                }`}
            >
              <SessionIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-white text-base">{session.title}</h3>
                <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                {displayDate
                  ? new Date(displayDate).toLocaleDateString(undefined, {
                    weekday: "short", month: "short", day: "numeric", year: "numeric",
                  })
                  : "—"}
                {session.startTime && (
                  <span className="text-slate-500">
                    · {session.startTime}
                    {session.endTime ? ` – ${session.endTime}` : ""}
                  </span>
                )}
              </p>

              {/* Cancellation reason */}
              {statusKey === "cancelled" && session.cancellationReason && (
                <div className="mt-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 whitespace-pre-wrap">
                  Reason: {session.cancellationReason}
                </div>
              )}

              {/* Session notes */}
              {statusKey === "completed" && session.notes && (
                <div className="mt-3 text-sm text-slate-300 bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Session Notes</p>
                  <div className="line-clamp-2 prose prose-sm prose-invert max-w-none text-slate-300">
                    <Markdown>{session.notes}</Markdown>
                  </div>
                </div>
              )}

              {/* Materials */}
              {statusKey === "completed" && session.materials && session.materials.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {session.materials.map((mat) => (
                    <a
                      key={mat.id}
                      href={mat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-400/5 px-2 py-1 rounded-lg border border-emerald-400/10"
                    >
                      <BookOpen className="w-3 h-3" /> {mat.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Score / rating if present */}
          {session.trainerRating && (
            <div className="flex items-center gap-0.5 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < session.trainerRating ? "text-amber-400 fill-amber-400" : "text-slate-600"
                    }`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Daily Log Modal */}
      <AnimatePresence>
        {FEATURES.ENABLE_PRACTICE_LOGS && showLogModal && (
          <DailyLogForm
            classroomId={classroom.id}
            todayLog={todayLog}
            onClose={() => setShowLogModal(false)}
          />
        )}

        {selectedSession && (
          <ViewSessionModal
            classroomId={classroom.id}
            sessionId={selectedSession.id}
            onClose={() => setSelectedSession(null)}
            onHomeworkClick={(hwId) => {
              navigate(`/classroom/${classroom.id}?tab=homework&id=${hwId}`);
            }}
          />
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
            Welcome, {user?.name.split(" ")[0]}
            {FEATURES.ENABLE_PRACTICE_LOGS && todayLog && (
              <span className="text-sm font-medium px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Logged today
              </span>
            )}
          </h1>
          <p className="text-slate-400 mt-1">Ready for your next chess lesson?</p>
        </div>
        <div className="flex items-center gap-3">
          {FEATURES.ENABLE_PRACTICE_LOGS && (
            <button
              id="log-today-btn"
              onClick={() => {
                setShowLogModal(true);
              }}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 text-sm ${todayLog
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                  : "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20"
                }`}
            >
              {todayLog ? (
                <><Flame className="w-4 h-4" /> Edit Log</>
              ) : (
                <><PlusCircle className="w-4 h-4" /> Log Today</>
              )}
            </button>
          )}
          <button
            onClick={() => {
              navigate(`/classroom/${classroom.id}`);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
          >
            Enter Classroom
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Quote of the Day ─────────────────────────────────────────────── */}
      <QuoteOfTheDay />

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color, loading }) => {
          const { bg, text } = colorMap[color];
          return (
            <div
              key={label}
              className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 ${bg} rounded-xl`}>
                  <Icon className={`w-6 h-6 ${text}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">{label}</p>
                  {loading ? (
                    <DotsLoader />
                  ) : (
                    <p className="text-2xl font-semibold">{value}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Tabs + Daily Puzzle ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Tab bar */}
          <div className="flex space-x-1 bg-slate-800/50 backdrop-blur-md p-1 rounded-2xl border border-slate-700/50 w-full sm:w-fit overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={`relative flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${isActive
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabHome"
                      className="absolute inset-0 bg-slate-700 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {/* ── Schedule Tab ──────────────────────────────────────────────── */}
            {activeTab === "schedule" && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
                {/* Schedule Sub-tabs */}
                <div className="flex border-b border-slate-700/50 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setScheduleSubTab("calendar")}
                    className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors whitespace-nowrap ${scheduleSubTab === "calendar"
                        ? "text-blue-400 border-b-2 border-blue-400 -mb-px"
                        : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Calendar
                  </button>
                  <button
                    onClick={() => setScheduleSubTab("upcoming")}
                    className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors whitespace-nowrap ${scheduleSubTab === "upcoming"
                        ? "text-blue-400 border-b-2 border-blue-400 -mb-px"
                        : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    <Clock className="w-4 h-4" />
                    Upcoming
                    {!sessionsLoading && upcomingSessions.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full font-bold">
                        {upcomingSessions.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setScheduleSubTab("past")}
                    className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors whitespace-nowrap ${scheduleSubTab === "past"
                        ? "text-slate-200 border-b-2 border-slate-400 -mb-px"
                        : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    <History className="w-4 h-4" />
                    Past
                    {!sessionsLoading && pastSessions.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-slate-700 text-slate-400 text-xs rounded-full font-bold">
                        {pastSessions.length}
                      </span>
                    )}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {/* Calendar View */}
                  {scheduleSubTab === "calendar" && (
                    <motion.div
                      key="calendar"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-700/50"
                    >
                      <CalendarView
                        sessions={allSessions}
                        isLoading={studentSessionsStatus === "loading"}
                        onMonthChange={({ startDate, endDate }) => dispatch(fetchStudentSessions({ studentId: user.id, startDate, endDate }))}
                        userRole="student"
                        onSessionClick={(session) => setSelectedSession(session)}
                      />
                    </motion.div>
                  )}

                  {/* Upcoming Sessions */}
                  {scheduleSubTab === "upcoming" && (
                    <motion.div
                      key="upcoming"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="divide-y divide-slate-700/50">
                        {sessionsLoading ? (
                          [...Array(3)].map((_, i) => (
                            <div key={i} className="p-6 flex items-center gap-4">
                              <div className="space-y-2 flex-1">
                                <div className="h-4 w-48 bg-slate-700/60 rounded animate-pulse" />
                                <div className="h-3 w-32 bg-slate-700/60 rounded animate-pulse" />
                              </div>
                              <div className="w-20 h-8 bg-slate-700/60 rounded-lg animate-pulse" />
                            </div>
                          ))
                        ) : upcomingSessions.length === 0 ? (
                          <div className="p-8 text-center text-slate-400">
                            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>No upcoming sessions scheduled.</p>
                          </div>
                        ) : (
                          upcomingSessions.map((session, i) => {
                            const upcomingText = getUpcomingTimeInfo(session);
                            return (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                key={session.id}
                                className="p-6 hover:bg-slate-700/30 transition-colors flex items-center justify-between group flex-wrap gap-4"
                              >
                                <div>
                                  <h3 className="font-medium text-lg group-hover:text-blue-400 transition-colors">
                                    {session.title}
                                  </h3>
                                  <div className="flex items-center flex-wrap gap-2 mt-2">
                                    <p className="text-sm text-slate-400 flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      {new Date(session.date).toLocaleDateString()} •{" "}
                                      {session.startTime} - {session.endTime}
                                    </p>
                                    {upcomingText && (
                                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-full animate-pulse flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {upcomingText}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {["SCHEDULED", "POSTPONED", "PREPONED"].includes(
                                    session.status?.toUpperCase()
                                  ) && (
                                      <a
                                        href={getGoogleCalendarUrl(session)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                                      >
                                        <CalendarPlus className="w-4 h-4" /> Add to Calendar
                                      </a>
                                    )}
                                  {session.link && (
                                    <a
                                      href={session.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                                    >
                                      Join
                                    </a>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Past Sessions */}
                  {scheduleSubTab === "past" && (
                    <motion.div
                      key="past"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div>
                        {sessionsLoading ? (
                          [...Array(3)].map((_, i) => (
                            <div key={i} className="p-6 flex items-start gap-4 border-b border-slate-700/50 last:border-b-0">
                              <div className="w-8 h-8 rounded-xl bg-slate-700/60 animate-pulse shrink-0 mt-0.5" />
                              <div className="space-y-2 flex-1">
                                <div className="h-4 w-40 bg-slate-700/60 rounded animate-pulse" />
                                <div className="h-3 w-52 bg-slate-700/60 rounded animate-pulse" />
                                <div className="h-3 w-32 bg-slate-700/60 rounded animate-pulse" />
                              </div>
                            </div>
                          ))
                        ) : pastSessions.length === 0 ? (
                          <div className="p-8 text-center text-slate-400">
                            <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>No past sessions yet.</p>
                          </div>
                        ) : (
                          pastSessions
                            .slice()
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map((session, i) => renderPastSessionCard(session, i))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── Assignments Tab ────────────────────────────────────────────── */}
            {activeTab === "assignments" && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
                {/* Assignments Sub-tabs */}
                <div className="flex border-b border-slate-700/50 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setAssignmentSubTab("pending")}
                    className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors whitespace-nowrap ${assignmentSubTab === "pending"
                        ? "text-orange-400 border-b-2 border-orange-400 -mb-px"
                        : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    <Clock className="w-4 h-4" />
                    Pending Tasks
                    {!detailsStatus && pendingHomework.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full font-bold">
                        {pendingHomework.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setAssignmentSubTab("completed")}
                    className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors whitespace-nowrap ${assignmentSubTab === "completed"
                        ? "text-emerald-400 border-b-2 border-emerald-400 -mb-px"
                        : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Completed
                    {!detailsStatus && completedHomework.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-bold">
                        {completedHomework.length}
                      </span>
                    )}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {/* Pending Homework */}
                  {assignmentSubTab === "pending" && (
                    <motion.div
                      key="pending"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="divide-y divide-slate-700/50"
                    >
                      {detailsStatus === "loading" && !classroom.homework ? (
                        [...Array(3)].map((_, i) => (
                          <div key={i} className="p-6 flex items-center gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="h-4 w-48 bg-slate-700/60 rounded animate-pulse" />
                              <div className="h-3 w-28 bg-slate-700/60 rounded animate-pulse" />
                            </div>
                            <div className="w-5 h-5 bg-slate-700/60 rounded animate-pulse" />
                          </div>
                        ))
                      ) : pendingHomework.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                          <CheckCircle className="w-12 h-12 text-emerald-500/50" />
                          <p>All caught up! No pending tasks.</p>
                        </div>
                      ) : (
                        pendingHomework.map((hw, i) => {
                          const dueText = getDueTimeInfo(hw);
                          return (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              key={hw.id}
                              onClick={() => {
                                navigate(`/classroom/${classroom.id}?tab=homework&id=${hw.id}`);
                              }}
                              className="p-6 hover:bg-slate-700/30 transition-colors cursor-pointer flex items-center justify-between group flex-wrap gap-4"
                            >
                              <div>
                                <h3 className="font-medium text-lg group-hover:text-blue-400 transition-colors">
                                  {hw.title}
                                </h3>
                                <div className="flex items-center flex-wrap gap-3 mt-2">
                                  <p className="text-sm text-slate-400 flex items-center gap-1.5 capitalize flex-wrap">
                                    <FileText className="w-4 h-4" />
                                    {hw.type} Challenge
                                  </p>
                                  <div className="flex items-center gap-2">
                                    {hw.createdAt && (
                                      <span className="px-2.5 py-1 bg-slate-800/80 text-slate-400 border border-slate-700/50 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm">
                                        <CalendarPlus className="w-3.5 h-3.5" />
                                        Assigned: {new Date(hw.createdAt).toLocaleDateString()}
                                      </span>
                                    )}
                                    {dueText && (
                                      <span className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 shadow-sm ${dueText === "Overdue"
                                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                          : "bg-orange-500/10 text-orange-400 border border-orange-500/20 animate-pulse"
                                        }`}>
                                        <Clock className="w-3.5 h-3.5" /> {dueText}
                                      </span>
                                    )}
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium shadow-sm ${hw.feedback
                                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                        : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                      }`}>
                                      {hw.feedback ? "Rework Requested" : "Assigned"}
                                    </span>
                                  </div>
                                  
                                  {hw.feedback && (
                                    <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                      <h5 className="text-xs font-semibold text-amber-400 mb-1">Trainer Comment:</h5>
                                      <div className="text-sm text-slate-300">
                                        <Markdown>{hw.feedback}</Markdown>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                            </motion.div>
                          );
                        })
                      )}
                    </motion.div>
                  )}

                  {/* Completed Homework */}
                  {assignmentSubTab === "completed" && (
                    <motion.div
                      key="completed"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="divide-y divide-slate-700/50"
                    >
                      {detailsStatus === "loading" && !classroom.homework ? (
                        [...Array(3)].map((_, i) => (
                          <div key={i} className="p-6 flex items-center gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="h-4 w-44 bg-slate-700/60 rounded animate-pulse" />
                              <div className="h-3 w-24 bg-slate-700/60 rounded animate-pulse" />
                            </div>
                            <div className="w-16 h-5 bg-slate-700/60 rounded-full animate-pulse" />
                          </div>
                        ))
                      ) : completedHomework.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                          <BookOpen className="w-12 h-12 text-slate-600" />
                          <p>No submitted homework yet.</p>
                        </div>
                      ) : (
                        completedHomework.map((hw, i) => (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={hw.id}
                            onClick={() => {
                              navigate(`/classroom/${classroom.id}?tab=evaluations`);
                            }}
                            className="p-6 hover:bg-slate-700/30 transition-colors cursor-pointer flex items-center justify-between group"
                          >
                            <div>
                              <h3 className="font-medium text-lg group-hover:text-emerald-400 transition-colors">
                                {hw.title}
                              </h3>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className="text-sm text-slate-400 capitalize flex items-center gap-1.5">
                                  <FileText className="w-4 h-4" />
                                  {hw.type} Challenge
                                </span>
                                {hw.createdAt && (
                                  <span className="px-2.5 py-1 bg-slate-800/80 text-slate-400 border border-slate-700/50 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm">
                                    <CalendarPlus className="w-3.5 h-3.5" />
                                    Assigned: {new Date(hw.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                                {hw.submittedAt && (
                                  <span className="px-2.5 py-1 bg-slate-800/80 text-slate-400 border border-slate-700/50 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm">
                                    <CheckSquare className="w-3.5 h-3.5" />
                                    Submitted: {new Date(hw.submittedAt).toLocaleDateString()}
                                  </span>
                                )}
                                <span
                                  className={`px-2.5 py-1 rounded-md text-xs font-medium border shadow-sm ${hw.status?.toLowerCase() === "evaluated"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    }`}
                                >
                                  {hw.status?.toLowerCase() === "submitted"
                                    ? "Submitted"
                                    : "Evaluated"}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── Performance Tab ────────────────────────────────────────────── */}
            {activeTab === "performance" && (
              <div className="space-y-6">
                <div className={`grid ${FEATURES.ENABLE_PRACTICE_LOGS ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"} gap-6`}>
                  {/* Practice Streak Card */}
                  {FEATURES.ENABLE_PRACTICE_LOGS && (
                    <div className="space-y-6">
                      {/* Quick-log CTA */}
                      <div
                        onClick={() => setShowLogModal(true)}
                        className={`cursor-pointer p-5 rounded-2xl border flex items-center justify-between transition-all ${todayLog
                            ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
                            : "bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10 animate-pulse"
                          }`}
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {todayLog ? "Today's practice logged ✓" : "Haven't logged today yet"}
                          </p>
                          <p className="text-sm text-slate-400 mt-0.5">
                            {todayLog
                              ? `${todayLog.category} · ${todayLog.minutesSpent ?? 0} min · ${todayLog.gamesPlayed ?? 0} games`
                              : "Tap to log your practice — takes under 1 minute"}
                          </p>
                        </div>
                        {todayLog ? (
                          <Flame className="w-8 h-8 text-emerald-400 shrink-0" />
                        ) : (
                          <PlusCircle className="w-8 h-8 text-orange-400 shrink-0" />
                        )}
                      </div>

                      {/* Streak + dot matrix */}
                      <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 h-full flex flex-col">
                        <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                          <Flame className="w-5 h-5 text-orange-400" />
                          Your Streak
                        </h2>
                        <div className="flex-1">
                          <PracticeStreak logs={logs} streak={computeStreak(logs)} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Progress Tracker Card */}
                  <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 h-full flex flex-col">
                    <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                      Homework Progress
                    </h2>
                    <div className="flex-1">
                      <ProgressTracker homework={classroom.homework || []} />
                    </div>
                  </div>
                </div>
                <EvaluationsDeck homework={classroom.homework} classroomId={classroom.id} />
              </div>
            )}
          </div>
        </div>

        {/* ── Daily Puzzle sidebar ─────────────────────────────────────────── */}
        <div className="space-y-8">
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <h2 className="text-xl font-semibold">Daily Puzzle</h2>
            </div>
            <div className="p-6">
              <div className="aspect-square w-full bg-slate-700 rounded-xl flex items-center justify-center relative overflow-hidden group cursor-pointer">
                {puzzleLoading ? (
                  <div className="flex flex-col items-center text-slate-400">
                    <div className="w-8 h-8 border-4 border-slate-500 border-t-emerald-500 rounded-full animate-spin mb-4" />
                    <p>Loading puzzle...</p>
                  </div>
                ) : puzzleError ? (
                  <div className="flex flex-col items-center text-slate-400 px-4 text-center">
                    <p>Failed to load daily puzzle.</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-4 px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm text-white transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : dailyPuzzle && puzzleFen ? (
                  <div className="w-full h-full pointer-events-none opacity-50 group-hover:scale-105 transition-transform duration-500">
                    <Chessboard
                      position={puzzleFen}
                      customDarkSquareStyle={{ backgroundColor: "#334155" }}
                      customLightSquareStyle={{ backgroundColor: "#94a3b8" }}
                    />
                  </div>
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1529699211952-734e80c4d42b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="Chess Board"
                    className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10 flex flex-col justify-end p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Daily Puzzle</h3>
                  <a
                    href={dailyPuzzle ? `https://lichess.org/training/${dailyPuzzle.puzzle.id}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors w-fit text-sm"
                  >
                    Solve on Lichess
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
