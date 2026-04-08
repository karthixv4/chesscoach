import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchClassrooms, fetchStudentSessions, fetchClassroomDetails } from "../store/classroomsSlice";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Clock, ChevronRight, Calendar, FileText, CalendarPlus } from "lucide-react";
import ProgressTracker from "../components/dashboard/ProgressTracker";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

export default function StudentHome() {
  const { user } = useSelector((state) => state.auth);
  const { classrooms, status, studentSessions } = useSelector((state) => state.classrooms);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dailyPuzzle, setDailyPuzzle] = useState(null);
  const [puzzleFen, setPuzzleFen] = useState("");
  const [puzzleLoading, setPuzzleLoading] = useState(true);
  const [puzzleError, setPuzzleError] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { id: "upcoming", label: "Upcoming Sessions", icon: Clock },
    { id: "homework", label: "Homework", icon: FileText },
    { id: "submitted", label: "Submitted Homework", icon: CheckCircle },
    { id: "progress", label: "Progress", icon: BookOpen },
  ];

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
      .finally(() => {
        setPuzzleLoading(false);
      });
  }, []);

  useEffect(() => {
    dispatch(fetchClassrooms());
    if (user?.id) {
      dispatch(fetchStudentSessions(user.id));
    }
  }, [dispatch, user?.id]);

  // Find the student's classroom
  const classroom = classrooms.find((c) => c.studentId === user?.id);

  useEffect(() => {
    if (classroom?.id && !classroom.homework) {
      dispatch(fetchClassroomDetails(classroom.id));
    }
  }, [dispatch, classroom?.id, classroom?.homework]);

  if (status === "loading" && classrooms.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-slate-500 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 text-lg">No classroom assigned yet.</p>
      </div>
    );
  }

  const pendingHomework = (classroom.homework || []).filter(
    (h) => h.status?.toLowerCase() === "assigned",
  );
  const completedHomework = (classroom.homework || []).filter(
    (h) => h.status?.toLowerCase() !== "assigned",
  );
  const todayStr = new Date(currentTime.getTime() - currentTime.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const getEffectiveDate = (s) => s.rescheduledDate ? s.rescheduledDate.split('T')[0] : (s.date ? s.date.split('T')[0] : "");

  const upcomingSessions = (studentSessions || classroom.sessions || []).filter(
    (s) => ["SCHEDULED", "POSTPONED", "PREPONED"].includes(s.status?.toUpperCase()) && getEffectiveDate(s) >= todayStr
  );

  const getUpcomingTimeInfo = (s) => {
    if (!["SCHEDULED", "POSTPONED", "PREPONED"].includes(s.status?.toUpperCase())) return null;
    const targetDate = s.rescheduledDate ? s.rescheduledDate.split('T')[0] : (s.date ? s.date.split('T')[0] : null);
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

  const getGoogleCalendarUrl = (session, classroomContext) => {
    const targetDateStr = session.rescheduledDate ? session.rescheduledDate.split('T')[0] : (session.date ? session.date.split('T')[0] : null);
    const targetStart = session.rescheduledStart || session.startTime;
    const targetEnd = session.rescheduledEnd || session.endTime;
    
    if (!targetDateStr || !targetStart || !targetEnd) return "#";
    
    const formatTime = (dateStr, timeStr) => {
      return `${dateStr.replace(/-/g, '')}T${timeStr.replace(/:/g, '')}00`;
    };

    const cDateStart = formatTime(targetDateStr, targetStart);
    const cDateEnd = formatTime(targetDateStr, targetEnd);
    
    const titleComponent = encodeURIComponent(`${classroomContext?.name || 'Chess class'} - ${session.title}`);
    const detailsComponent = encodeURIComponent(`Link: ${session.link}`);
    const locationComponent = encodeURIComponent(session.link || "");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titleComponent}&dates=${cDateStart}/${cDateEnd}&details=${detailsComponent}&location=${locationComponent}`;
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome, {user?.name.split(" ")[0]}
          </h1>
          <p className="text-slate-400 mt-1">
            Ready for your next chess lesson?
          </p>
        </div>
        <button
          onClick={() => navigate(`/classroom/${classroom.id}`)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          Enter Classroom
          <ChevronRight className="w-4 h-4" />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Sessions</p>
              <p className="text-2xl font-semibold">{upcomingSessions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">
                Pending Tasks
              </p>
              <p className="text-2xl font-semibold">{pendingHomework.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Completed</p>
              <p className="text-2xl font-semibold">
                {completedHomework.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Lessons</p>
              <p className="text-2xl font-semibold">
                {(classroom.lessons || []).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex space-x-1 bg-slate-800/50 backdrop-blur-md p-1 rounded-2xl border border-slate-700/50 w-full sm:w-fit overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
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
            {activeTab === "upcoming" && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
                </div>
                <div className="divide-y divide-slate-700/50">
                  {upcomingSessions.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      No upcoming sessions scheduled.
                    </div>
                  ) : (
                    upcomingSessions.map((session, i) => {
                      const upcomingText = getUpcomingTimeInfo(session);
                      return (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
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
                              {new Date(session.date).toLocaleDateString()} • {session.startTime} - {session.endTime}
                            </p>
                            {upcomingText && (
                              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-full animate-pulse flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {upcomingText}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {["SCHEDULED", "POSTPONED", "PREPONED"].includes(session.status?.toUpperCase()) && (
                            <a
                              href={getGoogleCalendarUrl(session, classroom)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
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
                    )})
                  )}
                </div>
              </div>
            )}

            {activeTab === "homework" && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold">Pending Homework</h2>
                </div>
                <div className="divide-y divide-slate-700/50">
                  {pendingHomework.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      All caught up!
                    </div>
                  ) : (
                    pendingHomework.map((hw, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={hw.id}
                        onClick={() => navigate(`/classroom/${classroom.id}?tab=homework&id=${hw.id}`)}
                        className="p-6 hover:bg-slate-700/30 transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <h3 className="font-medium text-lg group-hover:text-blue-400 transition-colors">
                            {hw.title}
                          </h3>
                          <p className="text-sm text-slate-400 capitalize">
                            {hw.type} Challenge
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "submitted" && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold">Submitted Homework</h2>
                </div>
                <div className="divide-y divide-slate-700/50">
                  {completedHomework.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      No submitted homework yet.
                    </div>
                  ) : (
                    completedHomework.map((hw, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={hw.id}
                        onClick={() => navigate(`/classroom/${classroom.id}?tab=evaluations`)}
                        className="p-6 hover:bg-slate-700/30 transition-colors cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <h3 className="font-medium text-lg group-hover:text-emerald-400 transition-colors">
                            {hw.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-slate-400 capitalize">{hw.type} Challenge</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${hw.status?.toLowerCase() === 'evaluated' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {hw.status?.toLowerCase() === 'submitted' ? 'Pending Evaluation' : 'Evaluated'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "progress" && (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold">Homework Progress</h2>
                </div>
                <div className="p-6">
                  <ProgressTracker homework={classroom.homework || []} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <h2 className="text-xl font-semibold">Daily Puzzle</h2>
            </div>
            <div className="p-6">
              <div className="aspect-square w-full bg-slate-700 rounded-xl flex items-center justify-center relative overflow-hidden group cursor-pointer">
                {puzzleLoading ? (
                  <div className="flex flex-col items-center text-slate-400">
                    <div className="w-8 h-8 border-4 border-slate-500 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
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
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Daily Puzzle
                  </h3>
                  <a
                    href={
                      dailyPuzzle
                        ? `https://lichess.org/training/${dailyPuzzle.puzzle.id}`
                        : "#"
                    }
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
