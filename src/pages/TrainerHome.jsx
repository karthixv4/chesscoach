import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setActiveClassroom, fetchClassrooms, deleteClassroom, fetchClassroomDetails, fetchTrainerSessions } from "../store/classroomsSlice";
import { fetchInactiveStudents } from "../store/dailyLogsSlice";
import { fetchReports } from "../store/reportsSlice";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ChevronRight, Activity, CheckCircle,
  Trash2, Edit2, AlertTriangle, Flame, BarChart3, Clock, Calendar, ClipboardList, Video, FileText,
} from "lucide-react";
import AddStudentModal from "../components/modals/AddStudentModal";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import ViewSessionModal from "../components/modals/ViewSessionModal";
import StudentActivityDrawer from "../components/dashboard/StudentActivityDrawer";
import ReportEditorModal from "../components/modals/ReportEditorModal";
import QuoteOfTheDay from "../components/dashboard/QuoteOfTheDay";
import CalendarView from "../components/dashboard/CalendarView";
import StudentSessionStats from "../components/dashboard/StudentSessionStats";
import { FEATURES } from "../config/features";

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function Tooltip({ content, children }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseEnter = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ x: rect.left + rect.width / 2, y: rect.top });
    }
    setVisible(true);
  };

  return (
    <span
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
          >
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-600/60 text-slate-200 text-xs rounded-xl px-3 py-2 shadow-2xl shadow-black/40 whitespace-nowrap max-w-xs">
              {content}
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-700/80" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// ─── Inactivity badge ─────────────────────────────────────────────────────────
function ActivityBadge({ studentData }) {
  if (!studentData) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
        No data
      </span>
    );
  }
  if (studentData.neverLogged) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-500 flex items-center gap-1">
        <Clock className="w-3 h-3" /> Never logged
      </span>
    );
  }
  if (studentData.flagged) {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 flex items-center gap-1 font-medium">
        <AlertTriangle className="w-3 h-3" />
        {studentData.daysInactive}d inactive
      </span>
    );
  }
  if (studentData.daysInactive === 0) {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1 font-medium">
        <Flame className="w-3 h-3" /> Active today
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center gap-1 font-medium">
      <Clock className="w-3 h-3" />
      {studentData.daysInactive}d ago
    </span>
  );
}

// ─── Last session badge ───────────────────────────────────────────────────────
function getLastSessionInfo(sessions) {
  if (!sessions || sessions.length === 0) return null;
  // Only consider completed sessions
  const completed = sessions.filter(
    (s) => s.status?.toLowerCase() === "completed"
  );
  if (completed.length === 0) return null;
  const sorted = [...completed].sort((a, b) => new Date(b.date) - new Date(a.date));
  const last = sorted[0];
  const lastDate = new Date(last.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);
  const diffMs = today - lastDate;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return { diffDays, date: last.date, title: last.title };
}

function LastSessionBadge({ sessions, isLoading }) {
  if (isLoading) {
    return <span className="w-24 h-5 rounded-full bg-slate-700/60 animate-pulse inline-block" />;
  }

  const info = getLastSessionInfo(sessions);

  if (!info) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-500 border border-slate-600/40 font-medium cursor-default select-none">
        <Video className="w-3 h-3" />
        No completed sessions
      </span>
    );
  }

  const { diffDays, title } = info;
  const label = diffDays === 0
    ? "0 days ago"
    : diffDays === 1
    ? "1 day ago"
    : `${diffDays} days ago`;

  const tooltipContent = (
    <span className="flex flex-col gap-0.5">
      <span className="text-slate-400 font-normal">Last completed session</span>
      <span className="text-white font-semibold">&ldquo;{title}&rdquo;</span>
    </span>
  );

  let colorClass = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (diffDays > 30) colorClass = "bg-red-500/15 text-red-400 border-red-500/30";
  else if (diffDays > 7) colorClass = "bg-amber-500/15 text-amber-400 border-amber-500/30";
  else if (diffDays > 0) colorClass = "bg-blue-500/15 text-blue-400 border-blue-500/30";

  return (
    <Tooltip content={tooltipContent}>
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium cursor-default select-none ${colorClass}`}>
        <Video className="w-3 h-3" />
        {label}
      </span>
    </Tooltip>
  );
}

export default function TrainerHome() {
  const { classrooms, status, detailsStatus, trainerSessions, trainerSessionsStatus } = useSelector((state) => state.classrooms);
  const { inactiveStudents, inactiveStatus } = useSelector((state) => state.dailyLogs);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [drawerClassroom, setDrawerClassroom] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [reportClassroom, setReportClassroom] = useState(null);
  const [inactiveDays, setInactiveDays] = useState(3);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [confirmation, setConfirmation] = useState({
    isOpen: false, title: "", message: "", onConfirm: () => {},
  });

  useEffect(() => {
    dispatch(fetchClassrooms()).then((action) => {
      if (action.meta.requestStatus === "fulfilled" && Array.isArray(action.payload)) {
        action.payload.forEach((c) => {
          if (!c.homework) dispatch(fetchClassroomDetails(c.id));
        });
      }
    });
  }, [dispatch]);

  // Fetch inactive students whenever inactiveDays changes
  useEffect(() => {
    dispatch(fetchInactiveStudents(inactiveDays));
  }, [dispatch, inactiveDays]);

  // Fetch reports for all classrooms when feature is on
  useEffect(() => {
    if (FEATURES.ENABLE_MONTHLY_REPORTS && classrooms.length > 0) {
      classrooms.forEach(c => dispatch(fetchReports(c.id)));
    }
  }, [dispatch, classrooms.length]);

  // Build a lookup map: classroomId → inactivity info
  const inactivityMap = {};
  (inactiveStudents?.students || []).forEach((s) => {
    inactivityMap[s.classroomId] = s;
  });



  const handleSelectStudent = (classroomId) => {
    dispatch(setActiveClassroom(classroomId));
    navigate(`/classroom/${classroomId}`);
  };

  if (status === "loading" && classrooms.length === 0) {
    return (
      <div className="space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Trainer Dashboard</h1>
            <p className="text-slate-400 mt-1">Manage your students and classrooms</p>
          </div>
          <div className="w-32 h-9 bg-slate-700/60 rounded-xl animate-pulse" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-700/60 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-24 bg-slate-700/60 rounded animate-pulse" />
                  <div className="h-6 w-10 bg-slate-700/60 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <div className="h-5 w-32 bg-slate-700/60 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-slate-700/50">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 sm:p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-700/60 animate-pulse shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-36 bg-slate-700/60 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-slate-700/60 rounded animate-pulse" />
                </div>
                <div className="w-5 h-5 bg-slate-700/60 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const flaggedCount = inactiveStudents?.flaggedCount ?? 0;

  return (
    <div className="space-y-8">
      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddStudentModalOpen && (
          <AddStudentModal
            trainerId={user?.id || "t1"}
            student={editingStudent || undefined}
            onClose={() => {
              setIsAddStudentModalOpen(false);
              setEditingStudent(null);
            }}
          />
        )}

        <ConfirmationModal
          isOpen={confirmation.isOpen}
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={() => {
            confirmation.onConfirm();
            setConfirmation((prev) => ({ ...prev, isOpen: false }));
          }}
          onClose={() => setConfirmation((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Student activity drawer */}
        {drawerClassroom && (
          <StudentActivityDrawer
            key={drawerClassroom.id}
            classroom={drawerClassroom}
            onClose={() => setDrawerClassroom(null)}
          />
        )}

        {/* Report editor drawer */}
        {FEATURES.ENABLE_MONTHLY_REPORTS && reportClassroom && (
          <ReportEditorModal
            key={reportClassroom.id}
            classroom={reportClassroom}
            onClose={() => setReportClassroom(null)}
          />
        )}

        {/* View Session Modal */}
        {selectedSession && (
          <ViewSessionModal
            classroomId={selectedSession.classroomId}
            sessionId={selectedSession.id}
            onClose={() => setSelectedSession(null)}
            onHomeworkClick={(hwId) => {
              navigate(`/classroom/${selectedSession.classroomId}?tab=homework&id=${hwId}`);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Trainer Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage your students and classrooms</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "dashboard" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "calendar" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              Calendar
            </button>
          </div>
          <button
            onClick={() => {
              setIsAddStudentModalOpen(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Users className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </header>

      {/* ── Quote of the Day ─────────────────────────────────────────────── */}
      <QuoteOfTheDay />

      {activeTab === "calendar" && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <CalendarView 
              sessions={trainerSessions} 
              isLoading={trainerSessionsStatus === "loading"} 
              onMonthChange={({ startDate, endDate }) => dispatch(fetchTrainerSessions({ startDate, endDate }))} 
              userRole="trainer" 
              onSessionClick={(session) => setSelectedSession(session)}
            />
          </div>
          <div className="xl:col-span-1">
            <StudentSessionStats sessions={trainerSessions} classrooms={classrooms} isLoading={trainerSessionsStatus === "loading"} />
          </div>
        </div>
      )}

      {activeTab === "dashboard" && (
        <>
      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${FEATURES.ENABLE_PRACTICE_LOGS ? "md:grid-cols-4" : "md:grid-cols-3"} gap-6`}>
        {/* Active students */}
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Students</p>
              <p className="text-2xl font-semibold">{classrooms.length}</p>
            </div>
          </div>
        </div>

        {/* Pending evaluations */}
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Pending Evals</p>
              <p className="text-2xl font-semibold">
                {classrooms.reduce(
                  (acc, c) =>
                    acc + (c.homework || []).filter((h) => h.status?.toLowerCase() === "submitted").length,
                  0
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Total Sessions */}
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Sessions</p>
              <p className="text-2xl font-semibold">
                {classrooms.reduce((acc, c) => acc + (c.sessions || []).length, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Needs nudge — dynamic threshold */}
        {FEATURES.ENABLE_PRACTICE_LOGS && (
          <div className={`backdrop-blur-md p-6 rounded-2xl border transition-colors ${
            flaggedCount > 0
              ? "bg-red-500/10 border-red-500/30"
              : "bg-slate-800/50 border-slate-700/50"
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${flaggedCount > 0 ? "bg-red-500/15" : "bg-slate-700/50"}`}>
                <AlertTriangle className={`w-6 h-6 ${flaggedCount > 0 ? "text-red-400" : "text-slate-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-400 font-medium">Needs Nudge</p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-2xl font-semibold ${flaggedCount > 0 ? "text-red-400" : ""}`}>
                    {inactiveStatus === "loading" ? "…" : flaggedCount}
                  </p>
                </div>
              </div>
            </div>
            {/* Threshold control */}
            <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Flag after</span>
              <select
                value={inactiveDays}
                onChange={(e) => {
                  const days = Number(e.target.value);
                  setInactiveDays(days);
                }}
                className="flex-1 bg-slate-700/70 border border-slate-600/50 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-slate-500"
              >
                {[1, 2, 3, 5, 7, 14].map((d) => (
                  <option key={d} value={d}>{d} day{d !== 1 ? "s" : ""} inactive</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Student overview grid ─────────────────────────────────────────── */}
      <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Students</h2>
          <span className="text-xs text-slate-500">Click a student for analytics</span>
        </div>
        <div className="divide-y divide-slate-700/50">
          {classrooms.map((classroom, i) => {
            const activityData = inactivityMap[classroom.id];
            const isFlagged = activityData?.flagged;

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                key={classroom.id}
                className={`p-4 sm:p-5 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                  isFlagged ? "hover:bg-red-500/5" : "hover:bg-slate-700/30"
                }`}
              >
                {/* Left: avatar + info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold shrink-0 ${
                      FEATURES.ENABLE_PRACTICE_LOGS && isFlagged
                        ? "bg-red-500/15 text-red-400 ring-2 ring-red-500/30"
                        : FEATURES.ENABLE_PRACTICE_LOGS && activityData?.daysInactive === 0
                        ? "bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500/20"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {classroom.studentName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-medium text-lg truncate ${FEATURES.ENABLE_PRACTICE_LOGS && isFlagged ? "text-red-300" : "group-hover:text-emerald-400"} transition-colors`}>
                        {classroom.studentName}
                      </h3>
                      {FEATURES.ENABLE_PRACTICE_LOGS && <ActivityBadge studentData={activityData} />}
                      {/* Pending evaluation pill */}
                      {detailsStatus === "loading" && !classroom.homework ? (
                        <span className="w-16 h-5 rounded-full bg-slate-700/60 animate-pulse inline-block" />
                      ) : (
                        (() => {
                          const pendingHw = (classroom.homework || []).filter(
                            (h) => h.status?.toLowerCase() === "submitted"
                          );
                          return pendingHw.length > 0 ? (
                            <Tooltip
                              content={
                                <span className="flex flex-col gap-1">
                                  <span className="text-slate-400 font-normal mb-0.5">Awaiting your evaluation</span>
                                  {pendingHw.map((h) => (
                                    <span key={h.id} className="flex items-center gap-1.5">
                                      <ClipboardList className="w-3 h-3 text-amber-400 shrink-0" />
                                      <span className="text-white font-medium truncate max-w-[180px]">{h.title}</span>
                                    </span>
                                  ))}
                                </span>
                              }
                            >
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium cursor-default select-none">
                                <ClipboardList className="w-3 h-3" />
                                {pendingHw.length} pending
                              </span>
                            </Tooltip>
                          ) : null;
                        })()
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Assignments count */}
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/40 font-medium cursor-default select-none">
                        <Activity className="w-3 h-3" />
                        {detailsStatus === "loading" && !classroom.homework ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                            <span className="text-slate-500">Loading…</span>
                          </span>
                        ) : (
                          <>{(classroom.homework || []).length} Assignments</>
                        )}
                      </span>

                      {/* Last session badge */}
                      <LastSessionBadge
                        sessions={classroom.sessions}
                        isLoading={detailsStatus === "loading" && !classroom.sessions}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: action buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                  {/* Analytics button */}
                  {FEATURES.ENABLE_PRACTICE_LOGS && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDrawerClassroom(classroom);
                      }}
                      className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      title="View analytics"
                    >
                      <BarChart3 className="w-5 h-5" />
                    </button>
                  )}

                  {/* Monthly report button */}
                  {FEATURES.ENABLE_MONTHLY_REPORTS && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportClassroom(classroom);
                      }}
                      className="p-2 text-slate-500 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Monthly report"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingStudent({ id: classroom.id, studentName: classroom.studentName });
                      setIsAddStudentModalOpen(true);
                    }}
                    className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Edit student"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmation({
                        isOpen: true,
                        title: "Delete Student",
                        message: `Are you sure you want to delete ${classroom.studentName}? This will permanently remove all related details.`,
                        onConfirm: () => {
                          dispatch(deleteClassroom(classroom.id));
                        },
                      });
                    }}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Delete student"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  {/* Go to classroom */}
                  <button
                    onClick={() => handleSelectStudent(classroom.id)}
                    className="p-2 text-slate-500 group-hover:text-emerald-400 transition-colors"
                    title="Open classroom"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
