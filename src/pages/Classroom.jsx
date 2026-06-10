import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { uploadImages } from "../lib/cloudinaryService";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  FileText,
  CheckSquare,
  Library,
  Plus,
  Check,
  Video,
  File,
  X,
  Calendar,
  CalendarPlus,
  Star,
  Trash2,
  Edit2,
  Link as LinkIcon,
  Clock,
  ImagePlus,
  Loader2,
  Image as ImageIcon,
  ChevronRight,
  LayoutGrid,
  Target,
  ChevronLeft,
} from "lucide-react";
import InteractiveBoard from "../components/chess/InteractiveBoard";
import {
  submitHomework,
  evaluateHomework,
  deleteHomework,
  deleteMaterial,
  deleteSession,
  fetchClassroomDetails,
  addNotes,
  setMonthlyTarget,
  deleteMonthlyTarget,
  requestRework,
} from "../store/classroomsSlice";
import ProgressTracker from "../components/dashboard/ProgressTracker";
import Markdown from "react-markdown";
import MarkdownEditor from "../components/common/MarkdownEditor";
import AssignHomeworkModal from "../components/dashboard/AssignHomeworkModal";
import ScheduleSessionModal from "../components/modals/ScheduleSessionModal";
import UpdateSessionStatusModal from "../components/modals/UpdateSessionStatusModal";
import ViewSessionModal from "../components/modals/ViewSessionModal";
import AddMaterialModal from "../components/modals/AddMaterialModal";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import ImageViewerModal from "../components/modals/ImageViewerModal";
import WorksheetEvaluationModal from "../components/modals/WorksheetEvaluationModal";

const PDFViewer = ({ fileUrl }) => {
  const getEmbeddableUrl = (url) => {
    if (!url) return url;
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    return url;
  };
  const embedUrl = getEmbeddableUrl(fileUrl);
  return (
    <div className="flex-1 min-h-[500px] w-full rounded-2xl border-2 border-slate-700/50 bg-slate-900 flex flex-col overflow-hidden mb-6 mt-4">
      <div className="p-4 border-b border-slate-700/80 bg-slate-900 flex justify-between items-center px-6">
        <h4 className="font-medium text-slate-300">Assignment Document</h4>
        <a href={fileUrl} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors rounded-lg border border-slate-600/50">Open in New Tab</a>
      </div>
      <div className="flex-1 flex flex-col bg-slate-800 relative min-h-[500px]">
        <iframe
          src={embedUrl}
          className="w-full h-full bg-slate-200 border-0 flex-1"
          title="Assignment Work"
        />
      </div>
    </div>
  );
};

export default function Classroom() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "sessions";

  const { user } = useSelector((state) => state.auth);
  const { classrooms, status, detailsStatus } = useSelector((state) => state.classrooms);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [evaluatingId, setEvaluatingId] = useState(null);
  const [activeSolvingBoardId, setActiveSolvingBoardId] = useState(null);
  const [evaluatingHomework, setEvaluatingHomework] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [score, setScore] = useState(0);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState(null);
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [updatingSession, setUpdatingSession] = useState(null);
  const [viewingSessionId, setViewingSessionId] = useState(null);
  const [editingHomework, setEditingHomework] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedMonthSessions, setSelectedMonthSessions] = useState(null);
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });
  const [submissionFiles, setSubmissionFiles] = useState({}); // hwId -> File[]
  const [submissionPreviews, setSubmissionPreviews] = useState({}); // hwId -> string[]
  const [submissionTexts, setSubmissionTexts] = useState({}); // hwId -> string
  const [editingSubmissions, setEditingSubmissions] = useState({}); // hwId -> boolean
  const [keptExistingImages, setKeptExistingImages] = useState({}); // hwId -> string[]
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionFileRefs = useRef({});

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const foundClassroom = classrooms.find((c) => c.id === id);
  const currentTarget = foundClassroom?.monthlyTargets?.find(t => t.month === currentMonth && t.year === currentYear);

  const [targetValue, setTargetValue] = useState("");
  const [targetTitle, setTargetTitle] = useState("");
  const [isSavingTarget, setIsSavingTarget] = useState(false);

  useEffect(() => {
    if (currentTarget) {
      setTargetValue(currentTarget.target.toString());
      setTargetTitle(currentTarget.title || "");
    }
  }, [currentTarget]);
  const classroom = foundClassroom
    ? {
      ...foundClassroom,
      sessions: (foundClassroom.sessions || []).map(s => ({ ...s, status: s.status?.toLowerCase() })),
      homework: (foundClassroom.homework || []).map(h => ({ ...h, status: h.status?.toLowerCase() })),
      materials: foundClassroom.materials || [],
    }
    : null;
  const isTrainer = user?.role === "trainer";

  useEffect(() => {
    if (id) {
      dispatch(fetchClassroomDetails(id));
    }
  }, [dispatch, id]);



  // Show skeleton loader when details are fetching (either overall status=loading, or detailsStatus=loading for this classroom)
  const isLoadingDetails = detailsStatus === 'loading' && (!classroom || !classroom.sessions);

  if ((status === 'loading' || detailsStatus === 'loading') && (!classroom || classroom.id !== id)) {
    return (
      <div className="space-y-6">
        {/* Tab bar skeleton */}
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 w-24 bg-slate-700/60 rounded-xl animate-pulse" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-3">
              <div className="h-3 w-24 bg-slate-700/60 rounded animate-pulse" />
              <div className="h-5 w-40 bg-slate-700/60 rounded animate-pulse" />
              <div className="h-3 w-full bg-slate-700/60 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-slate-700/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!classroom)
    return (
      <div className="p-8 text-center text-slate-400">Classroom not found.</div>
    );

  const tabs = [
    { id: "sessions", label: "Sessions", icon: Calendar },
    { id: "homework", label: "Homework", icon: FileText },
    { id: "evaluations", label: "Evaluations", icon: CheckSquare },
    { id: "materials", label: "Materials", icon: Library },
  ];

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const handleNotesChange = (e) => {
    dispatch(addNotes({ classroomId: classroom.id, notes: e.target.value }));
  };

  const handleEvaluate = (homeworkId) => {
    dispatch(
      evaluateHomework({
        classroomId: classroom.id,
        homeworkId,
        evaluationData: { feedback: feedbackText, score },
      }),
    );
    setEvaluatingId(null);
    setFeedbackText("");
    setScore(0);
  };

  const handleModalEvaluate = (id, modalScore, modalFeedback) => {
    dispatch(evaluateHomework({
      classroomId: classroom.id,
      homeworkId: id,
      evaluationData: { score: modalScore, feedback: modalFeedback },
    }));
    setEvaluatingHomework(null);
  };

  const handleModalRework = (id, modalFeedback) => {
    dispatch(requestRework({
      classroomId: classroom.id,
      homeworkId: id,
      feedback: modalFeedback,
    }));
    setEvaluatingHomework(null);
  };

  const handleSubmitHomework = async (hw, submission) => {
    const files = submissionFiles[hw.id] || [];
    const keptImages = keptExistingImages[hw.id] || [];
    setIsSubmitting(true);
    try {
      let imageUrls = [...keptImages];
      if (files.length > 0) {
        const newUploads = await uploadImages(files);
        imageUrls = [...imageUrls, ...newUploads];
      }
      dispatch(submitHomework({
        classroomId: classroom.id,
        homeworkId: hw.id,
        submissionData: { submission, submissionImageUrls: imageUrls },
      }));
      setSubmissionFiles((prev) => ({ ...prev, [hw.id]: [] }));
      setSubmissionPreviews((prev) => ({ ...prev, [hw.id]: [] }));
      setEditingSubmissions((prev) => ({ ...prev, [hw.id]: false }));
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickSubmissionImages = (hwId, files) => {
    const arr = Array.from(files);
    setSubmissionFiles((prev) => ({ ...prev, [hwId]: [...(prev[hwId] || []), ...arr] }));
    setSubmissionPreviews((prev) => ({ ...prev, [hwId]: [...(prev[hwId] || []), ...arr.map((f) => URL.createObjectURL(f))] }));
  };

  const handleRemoveSubmissionImage = (hwId, index) => {
    setSubmissionFiles((prev) => ({
      ...prev,
      [hwId]: (prev[hwId] || []).filter((_, i) => i !== index),
    }));
    setSubmissionPreviews((prev) => ({
      ...prev,
      [hwId]: (prev[hwId] || []).filter((_, i) => i !== index),
    }));
  };

  const handleRemoveKeptImage = (hwId, index) => {
    setKeptExistingImages((prev) => ({
      ...prev,
      [hwId]: (prev[hwId] || []).filter((_, i) => i !== index),
    }));
  };

  const handleSaveTarget = async () => {
    if (!targetValue) return;
    setIsSavingTarget(true);
    await dispatch(setMonthlyTarget({
      classroomId: classroom.id,
      targetData: {
        month: currentMonth,
        year: currentYear,
        target: parseInt(targetValue, 10),
        title: targetTitle || null,
      }
    }));
    setIsSavingTarget(false);
  };

  const handleRemoveTarget = async () => {
    setConfirmation({
      isOpen: true,
      title: "Remove Target",
      message: `Are you sure you want to remove the target for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}?`,
      onConfirm: async () => {
        setIsSavingTarget(true);
        await dispatch(deleteMonthlyTarget({
          classroomId: classroom.id,
          month: currentMonth,
          year: currentYear,
        }));
        setIsSavingTarget(false);
        setTargetValue("");
        setTargetTitle("");
      },
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "sessions": {
        const normalizedSessions = classroom.sessions.map(s => ({
          ...s,
          status: s.status ? s.status.toLowerCase() : ""
        }));

        const todayStr = new Date(currentTime.getTime() - currentTime.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        const getEffectiveDate = (s) => s.rescheduledDate ? s.rescheduledDate.split('T')[0] : (s.date ? s.date.split('T')[0] : "");

        const sessionsThisMonthCount = normalizedSessions.filter(s => {
          const d = getEffectiveDate(s);
          if (!d) return false;
          const dateObj = new Date(d);
          return dateObj.getMonth() + 1 === currentMonth && dateObj.getFullYear() === currentYear && s.status !== "cancelled";
        }).length;

        const liveSessions = normalizedSessions.filter(
          (s) => s.status === "ongoing",
        );
        const upcomingSessions = normalizedSessions.filter(
          (s) => ["scheduled", "postponed", "preponed"].includes(s.status) && getEffectiveDate(s) >= todayStr
        );
        const pastSessions = normalizedSessions.filter((s) =>
          ["completed", "cancelled"].includes(s.status) ||
          (["scheduled", "postponed", "preponed"].includes(s.status) && getEffectiveDate(s) < todayStr)
        );

        const pastSessionsByMonth = {};
        pastSessions.forEach(session => {
          const dateStr = getEffectiveDate(session) || session.date;
          if (!dateStr) return;
          const dateObj = new Date(dateStr);
          const monthStr = dateObj.toLocaleDateString('default', { month: 'long', year: 'numeric' });
          if (!pastSessionsByMonth[monthStr]) pastSessionsByMonth[monthStr] = [];
          pastSessionsByMonth[monthStr].push(session);
        });

        const sortedMonths = Object.keys(pastSessionsByMonth).sort((a, b) => {
          return new Date(`1 ${b}`).getTime() - new Date(`1 ${a}`).getTime();
        });

        const getUpcomingTimeInfo = (s) => {
          if (!["scheduled", "postponed", "preponed"].includes(s.status)) return null;
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

        const renderSessionCard = (session) => {
          const upcomingText = getUpcomingTimeInfo(session);

          return (
            <div
              key={session.id}
              onClick={() => {
                setViewingSessionId(session.id);
              }}
              className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 group relative cursor-pointer hover:border-emerald-500/50 transition-colors"
            >

              {isTrainer && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUpdatingSession(session);
                      setIsUpdateStatusModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                    title="Update Status"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSession(session);
                      setIsScheduleModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmation({
                        isOpen: true,
                        title: "Cancel Session",
                        message: `Are you sure you want to cancel "${session.title}"?`,
                        onConfirm: () => {
                          dispatch(deleteSession({ classroomId: classroom.id, sessionId: session.id }));
                        },
                      });
                    }}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${session.status === "ongoing"
                    ? "bg-emerald-500/20 text-emerald-400 animate-pulse"
                    : session.status === "scheduled"
                      ? "bg-blue-500/10 text-blue-400"
                      : session.status === "completed"
                        ? "bg-slate-700 text-slate-400"
                        : session.status === "cancelled"
                          ? "bg-red-500/10 text-red-400"
                          : session.status === "postponed"
                            ? "bg-orange-500/10 text-orange-400"
                            : session.status === "preponed"
                              ? "bg-purple-500/10 text-purple-400"
                              : "bg-amber-500/10 text-amber-400"
                    }`}
                >
                  {session.status === "ongoing" ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <Calendar className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{session.title}</h3>
                    <span
                      className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold ${session.status === "ongoing"
                        ? "bg-emerald-500 text-white"
                        : session.status === "scheduled"
                          ? "bg-blue-500 text-white"
                          : session.status === "completed"
                            ? "bg-slate-600 text-slate-200"
                            : session.status === "cancelled"
                              ? "bg-red-500 text-white"
                              : session.status === "postponed"
                                ? "bg-orange-500 text-white"
                                : session.status === "preponed"
                                  ? "bg-purple-500 text-white"
                                  : "bg-amber-500 text-white"
                        }`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {new Date(session.date).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>
                    {session.startTime} - {session.endTime}
                  </span>
                  {upcomingText && (
                    <span className="ml-2 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold rounded-full animate-pulse flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {upcomingText}
                    </span>
                  )}
                </div>

                {session.status === "cancelled" && session.cancellationReason && (
                  <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <p className="text-xs text-red-400 font-medium uppercase mb-1">
                      Cancellation Reason
                    </p>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">
                      {session.cancellationReason}
                    </p>
                  </div>
                )}

                {(session.status === "postponed" ||
                  session.status === "preponed") &&
                  session.rescheduledDate && (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                      <p className="text-xs text-amber-400 font-medium uppercase mb-1">
                        Rescheduled To
                      </p>
                      <p className="text-sm text-slate-300">
                        {new Date(
                          session.rescheduledDate,
                        ).toLocaleDateString()}{" "}
                        at {session.rescheduledStart}
                      </p>
                    </div>
                  )}

                {session.status === "completed" &&
                  (session.notes || session.materials) && (
                    <div className="p-3 bg-slate-700/30 border border-slate-600/30 rounded-xl space-y-2">
                      {session.notes && (
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase mb-1">
                            Session Notes
                          </p>
                          <div className="text-sm text-slate-300 line-clamp-2 prose prose-sm prose-invert max-w-none">
                            <Markdown>{session.notes}</Markdown>
                          </div>
                        </div>
                      )}
                      {session.materials && session.materials.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase mb-1">
                            Materials
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {session.materials.map((mat) => {
                              if (mat.type?.toLowerCase() === "image" && mat.url) {
                                return mat.url.split(",").map((src, i) => (
                                  <img
                                    key={`${mat.id}-${i}`}
                                    src={src}
                                    alt="material"
                                    className="h-8 w-8 rounded object-cover cursor-pointer hover:opacity-80 border border-slate-600 shadow-sm transition-opacity"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setViewerImage(src);
                                    }}
                                  />
                                ));
                              }
                              return (
                                <a
                                  key={mat.id}
                                  href={mat.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-400/5 px-2 py-1 rounded-lg border border-emerald-400/10"
                                >
                                  <Library className="w-3 h-3" /> {mat.title}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {session.link &&
                  session.status !== "cancelled" &&
                  session.status !== "completed" && (
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <LinkIcon className="w-4 h-4 text-slate-500" />
                      <a
                        href={session.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline truncate max-w-[200px]"
                      >
                        {session.link}
                      </a>
                    </div>
                  )}
              </div>

              {session.status === "ongoing" && (
                <a
                  href={session.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                >
                  <Video className="w-4 h-4" /> Join Live Session
                </a>
              )}

              {session.status === "scheduled" && (
                <a
                  href={session.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                >
                  Join Session
                </a>
              )}

              {["scheduled", "postponed", "preponed"].includes(session.status) && (
                <a
                  href={getGoogleCalendarUrl(session, classroom)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { e.stopPropagation(); }}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl font-medium transition-colors"
                >
                  <CalendarPlus className="w-4 h-4" /> Add to Google Calendar
                </a>
              )}
            </div>
          );
        };

        return (
          <div className="space-y-10">
            {isTrainer && (
              <section className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-indigo-400" /> Current Month Target ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})
                    </h2>
                    <p className="text-sm text-slate-400">Set a session target for the student to keep track of planned lessons.</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <input
                      type="text"
                      value={targetTitle}
                      onChange={(e) => setTargetTitle(e.target.value)}
                      placeholder="e.g. Christmas Sessions"
                      className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 w-48 text-sm"
                    />
                    <input
                      type="number"
                      min="1"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      placeholder="Target (e.g. 8)"
                      className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 w-32 text-sm"
                    />
                    <button
                      onClick={handleSaveTarget}
                      disabled={isSavingTarget}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {isSavingTarget ? "Saving..." : "Save Target"}
                    </button>
                  </div>
                </div>
                {currentTarget && (
                  <div className="pt-4 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-sm font-medium flex items-center gap-2">
                        Target: {currentTarget.target} {currentTarget.title ? `(${currentTarget.title})` : ""}
                        <button
                          onClick={handleRemoveTarget}
                          disabled={isSavingTarget}
                          className="ml-2 p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
                          title="Remove Target"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-sm text-slate-300">
                        {sessionsThisMonthCount} / {currentTarget.target} sessions planned or completed
                      </div>
                    </div>
                    {currentTarget.target - sessionsThisMonthCount > 0 ? (
                      <div className="text-sm font-medium text-amber-400 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        {currentTarget.target - sessionsThisMonthCount} pending
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-emerald-400 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <CheckSquare className="w-4 h-4" /> Target Met
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
            {/* Live Sessions */}
            {liveSessions.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <h2 className="text-xl font-semibold">Live Sessions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {liveSessions.map(renderSessionCard)}
                </div>
              </section>
            )}

            {/* Upcoming Sessions */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
                {isTrainer && (
                  <button
                    onClick={() => {
                      setEditingSession(null);
                      setIsScheduleModalOpen(true);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Schedule Session
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingSessions.map(renderSessionCard)}
                {isLoadingDetails ? (
                  [...Array(2)].map((_, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-700/60 animate-pulse" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-4 w-32 bg-slate-700/60 rounded animate-pulse" />
                          <div className="h-3 w-24 bg-slate-700/60 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="h-3 w-28 bg-slate-700/60 rounded animate-pulse" />
                      <div className="h-9 w-full bg-slate-700/60 rounded-xl animate-pulse" />
                    </div>
                  ))
                ) : upcomingSessions.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-2xl">
                    No upcoming sessions scheduled.
                  </div>
                ) : null}
              </div>
            </section>

            {/* Past Sessions */}
            {sortedMonths.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-400">
                  Session History
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {sortedMonths.map(month => (
                    <div
                      key={month}
                      onClick={() => setSelectedMonthSessions({ month, sessions: pastSessionsByMonth[month] })}
                      className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-5 group cursor-pointer hover:border-emerald-500/50 transition-colors flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-700/80 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                          <Calendar className="w-6 h-6 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-white group-hover:text-emerald-400 transition-colors">{month}</h3>
                          <p className="text-sm text-slate-400">{pastSessionsByMonth[month].length} Session{pastSessionsByMonth[month].length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <AnimatePresence>
              {selectedMonthSessions && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-6 border-b border-slate-800/80 shrink-0 bg-slate-900 z-10">
                      <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-emerald-400" />
                        Sessions in {selectedMonthSessions.month}
                      </h3>
                      <button
                        onClick={() => setSelectedMonthSessions(null)}
                        className="p-2 bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 rounded-full transition-colors flex items-center justify-center"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedMonthSessions.sessions.map((session) => renderSessionCard(session))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {isLoadingDetails ? (
              <div className="p-12 text-center text-slate-500 border border-dashed border-slate-700 rounded-2xl">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm">Loading sessions...</p>
              </div>
            ) : classroom.sessions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-dashed border-slate-700 rounded-2xl">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No sessions found.</p>
              </div>
            ) : null}
          </div>
        );
      }

      case "homework":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Assignments</h2>
              {isTrainer && (
                <button
                  onClick={() => {
                    setEditingHomework(null);
                    setIsAssignModalOpen(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Assign Homework
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-6">
              {classroom.homework.map((hw) => (
                <div
                  key={hw.id}
                  id={`homework-${hw.id}`}
                  className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden"
                >
                  <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold">{hw.title}</h3>
                      <div className="flex items-center flex-wrap gap-3 mt-2">
                        <p className="text-sm text-slate-400 flex items-center gap-1.5 capitalize">
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
                          {hw.dueDate && (
                            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm">
                              <Clock className="w-3.5 h-3.5" />
                              Due: {new Date(hw.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {hw.submittedAt && (
                            <span className="px-2.5 py-1 bg-slate-800/80 text-slate-400 border border-slate-700/50 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm">
                              <CheckSquare className="w-3.5 h-3.5" />
                              Submitted: {new Date(hw.submittedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isTrainer && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingHomework(hw);
                              setIsAssignModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmation({
                                isOpen: true,
                                title: "Delete Assignment",
                                message: `Are you sure you want to delete "${hw.title}"?`,
                                onConfirm: () => {
                                  dispatch(deleteHomework({ classroomId: classroom.id, homeworkId: hw.id }));
                                },
                              });
                            }}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {hw.status?.toLowerCase() === "assigned" && !hw.feedback && (
                        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
                          Assigned
                        </span>
                      )}
                      {hw.status?.toLowerCase() === "assigned" && hw.feedback && (
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                          Rework
                        </span>
                      )}
                      {hw.status?.toLowerCase() === "submitted" && (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                          Submitted
                        </span>
                      )}
                      {hw.status?.toLowerCase() === "evaluated" && (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                          Evaluated
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    {hw.description && (
                      <div className="mb-6 prose prose-invert max-w-none text-slate-300">
                        <Markdown>{hw.description}</Markdown>
                      </div>
                    )}

                    {/* Trainer's reference images */}
                    {hw.imageUrls && hw.imageUrls.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-slate-400 uppercase mb-2">Reference Images</p>
                        <div className="flex flex-wrap gap-3">
                          {hw.imageUrls.flatMap(u => (typeof u === 'string' ? u.split(',') : [])).filter(Boolean).map((url, i) => (
                            <div key={i} onClick={(e) => { e.stopPropagation(); setViewerImage(url); }} className="cursor-pointer group relative">
                              <img src={url} alt={`ref-${i}`} className="w-24 h-24 object-cover rounded-xl border border-slate-600 group-hover:border-emerald-500 transition-colors shadow-sm" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                <ImageIcon className="w-6 h-6 text-white drop-shadow-lg" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(hw.type?.toLowerCase() === "image" || hw.type?.toLowerCase() === "worksheet") && hw.fileUrl && hw.fileUrl !== "#" && (
                      <PDFViewer fileUrl={hw.fileUrl} />
                    )}

                    {hw.type?.toLowerCase() === "puzzle" && hw.puzzleSets && hw.puzzleSets.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-slate-300 font-medium">Please solve the following puzzle sets:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {hw.puzzleSets.map((ps, index) => (
                            <a
                              key={index}
                              href={ps.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-900/50 border border-slate-700 hover:border-emerald-500 hover:bg-slate-800 transition-all rounded-xl p-4 group flex flex-col h-full"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                                  <LinkIcon className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <h4 className="font-semibold text-slate-200 line-clamp-1 break-all" title={ps.link}>{ps.link}</h4>
                              </div>
                              <div className="flex justify-between items-center text-sm text-slate-400 mb-2">
                                <span className="bg-slate-800 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-300 border border-slate-700 shadow-sm">
                                  Target: {ps.expectedCount} puzzles
                                </span>
                              </div>
                              {ps.instruction && (
                                <p className="text-sm text-slate-500 italic mt-auto line-clamp-2">
                                  "{ps.instruction}"
                                </p>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {hw.status?.toLowerCase() === "assigned" && hw.feedback && (
                      <div className="mt-6 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-red-400 mb-2">
                          {isTrainer ? "You Requested Rework" : "Trainer Requested Rework"}
                        </h4>
                        <div className="prose prose-sm prose-invert max-w-none text-slate-300">
                          <Markdown>{hw.feedback}</Markdown>
                        </div>
                      </div>
                    )}

                    {hw.type?.toLowerCase() === "board" && hw.challenge && (
                      <div className="max-w-[440px] mx-auto">
                        {hw.challenge.description && !hw.description && (
                          <p className="text-slate-300 mb-6 text-center">
                            {hw.challenge.description}
                          </p>
                        )}
                        {isTrainer ? (
                          <InteractiveBoard
                            id={`board-${hw.id}`}
                            initialFen={hw.challenge.fen}
                            winningMoves={hw.challenge.winningMoves}
                            targetOrientation={hw.challenge.orientation}
                            isTrainer={isTrainer}
                            classroomId={classroom.id}
                            studentName={user?.name || "Student"}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 bg-slate-900 border border-slate-700 rounded-xl">
                            <LayoutGrid className="w-16 h-16 text-slate-500 mb-4 opacity-50" />
                            <h4 className="text-slate-300 font-medium mb-6 text-center">Interactive Chess Puzzle</h4>
                            <button
                              onClick={() => {
                                setActiveSolvingBoardId(hw.id);
                              }}
                              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 text-lg"
                            >
                              Start solving this
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {!isTrainer &&
                      (hw.status?.toLowerCase() === "assigned" || (hw.status?.toLowerCase() === "submitted" && editingSubmissions[hw.id])) &&
                      hw.type?.toLowerCase() !== "board" && (
                        <div className="mt-6 space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Your Answer</label>
                            <textarea
                              value={submissionTexts[hw.id] ?? (hw.submission || "")}
                              onChange={(e) => setSubmissionTexts(prev => ({ ...prev, [hw.id]: e.target.value }))}
                              placeholder="Type your answer here..."
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 resize-none h-24 mb-4 text-sm"
                            />

                            <p className="text-sm text-slate-400">Attach evidence images (optional)</p>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              ref={(el) => { if (el) submissionFileRefs.current[hw.id] = el; }}
                              className="hidden"
                              onChange={(e) => handlePickSubmissionImages(hw.id, e.target.files)}
                            />
                            {((submissionPreviews[hw.id] || []).length > 0 || (keptExistingImages[hw.id] || []).length > 0) && (
                              <div className="flex flex-wrap gap-3">
                                {(keptExistingImages[hw.id] || []).map((src, i) => (
                                  <div key={`kept-${i}`} className="relative group">
                                    <img
                                      src={src}
                                      alt={`sub-kept-${i}`}
                                      className="w-16 h-16 object-cover rounded-lg border border-slate-600 cursor-pointer hover:border-emerald-500 transition-colors"
                                      onClick={(e) => { e.stopPropagation(); setViewerImage(src); }}
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleRemoveKeptImage(hw.id, i); }}
                                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    >×</button>
                                  </div>
                                ))}
                                {(submissionPreviews[hw.id] || []).map((src, i) => (
                                  <div key={`new-${i}`} className="relative group">
                                    <img
                                      src={src}
                                      alt={`sub-${i}`}
                                      className="w-16 h-16 object-cover rounded-lg border border-slate-600 cursor-pointer hover:border-emerald-500 transition-colors"
                                      onClick={(e) => { e.stopPropagation(); setViewerImage(src); }}
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleRemoveSubmissionImage(hw.id, i); }}
                                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    >×</button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => submissionFileRefs.current[hw.id]?.click()}
                              className="flex items-center gap-2 text-xs px-3 py-2 border border-dashed border-slate-600 hover:border-emerald-500 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors"
                            >
                              <ImagePlus className="w-3 h-3" /> Add Images
                            </button>
                          </div>
                          <div className="flex justify-end gap-2">
                            {editingSubmissions[hw.id] && (
                              <button
                                disabled={isSubmitting}
                                onClick={() => {
                                  setEditingSubmissions(prev => ({ ...prev, [hw.id]: false }));
                                  setSubmissionTexts(prev => ({ ...prev, [hw.id]: undefined }));
                                }}
                                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              disabled={isSubmitting || (!(submissionTexts[hw.id] ?? hw.submission)?.trim() && !(submissionFiles[hw.id]?.length > 0) && !(keptExistingImages[hw.id]?.length > 0))}
                              onClick={() => {
                                handleSubmitHomework(hw, (submissionTexts[hw.id] ?? hw.submission) || "Submitted evidence images.");
                                setSubmissionTexts(prev => ({ ...prev, [hw.id]: "" }));
                              }}
                              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                              {editingSubmissions[hw.id] ? "Update Submission" : "Mark as Completed"}
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Evaluation Report – visible to students */}
                    {!isTrainer && hw.status?.toLowerCase() === "submitted" && !editingSubmissions[hw.id] && (
                      <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <p className="text-sm font-semibold text-amber-400">Awaiting Evaluation</p>
                          </div>
                          <p className="text-sm text-slate-400">Your trainer will review and grade your submission soon.</p>
                        </div>
                        {hw.type?.toLowerCase() !== "board" && (
                          <button
                            onClick={() => {
                              setEditingSubmissions(prev => ({ ...prev, [hw.id]: true }));
                              setKeptExistingImages(prev => ({ ...prev, [hw.id]: hw.submissionImageUrls || [] }));
                              setSubmissionTexts(prev => ({ ...prev, [hw.id]: hw.submission || "" }));
                            }}
                            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shrink-0 border border-amber-500/20"
                          >
                            <Edit2 className="w-4 h-4" /> Edit Submission
                          </button>
                        )}
                      </div>
                    )}

                    {!isTrainer && hw.status?.toLowerCase() === "evaluated" && (
                      <div className="mt-6 bg-slate-900/50 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <p className="text-sm font-semibold text-emerald-400">Trainer Evaluation</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${i < (hw.score || 0) ? 'text-amber-400 fill-current' : 'text-slate-600'}`}
                              />
                            ))}
                            <span className="ml-2 text-sm font-bold text-amber-400">{hw.score}/5</span>
                          </div>
                        </div>
                        {hw.feedback && (
                          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                            <p className="text-xs font-medium text-slate-400 uppercase mb-2">Trainer Feedback</p>
                            <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{hw.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              ))}
              {isLoadingDetails ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                      <div className="space-y-2">
                        <div className="h-5 w-40 bg-slate-700/60 rounded animate-pulse" />
                        <div className="h-3 w-28 bg-slate-700/60 rounded animate-pulse" />
                      </div>
                      <div className="w-20 h-8 bg-slate-700/60 rounded-xl animate-pulse" />
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="h-3 w-full bg-slate-700/60 rounded animate-pulse" />
                      <div className="h-3 w-3/4 bg-slate-700/60 rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-slate-700/60 rounded animate-pulse" />
                    </div>
                  </div>
                ))
              ) : classroom.homework.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-2xl">
                  No homework assigned yet.
                </div>
              ) : null}
            </div>
          </div>
        );

      case "evaluations":
        const submitted = classroom.homework.filter(
          (hw) => hw.status === "submitted" || hw.status === "evaluated",
        );
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Submission Inbox</h2>
            {submitted.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-8 text-center">
                <CheckSquare className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400">
                  No submitted homework to review yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {submitted.map((hw) => (
                  <div
                    key={hw.id}
                    className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden"
                  >
                    <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-semibold">{hw.title}</h3>
                        <p className="text-sm text-slate-400 capitalize">
                          {hw.type} Challenge
                        </p>
                      </div>
                      {(hw.status?.toLowerCase() === "submitted" || hw.status?.toLowerCase() === "evaluated") &&
                        isTrainer &&
                        evaluatingId !== hw.id && (
                          <button
                            onClick={() => {
                              if (hw.type !== "board") {
                                setEvaluatingHomework(hw);
                              } else {
                                setEvaluatingId(hw.id);
                                setScore(hw.score || 0);
                                setFeedbackText(hw.feedback || "");
                              }
                            }}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors"
                          >
                            {hw.status?.toLowerCase() === "evaluated" ? "Edit Evaluation" : "Grade & Comment"}
                          </button>
                        )}
                      {hw.status?.toLowerCase() === "evaluated" && !isTrainer && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={`star-display-${hw.id}-${i}`}
                                className={`w-4 h-4 ${i < (hw.score || 0) ? "fill-current" : "text-slate-600"}`}
                              />
                            ))}
                          </div>
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Evaluated
                          </span>
                        </div>
                      )}
                      {hw.status?.toLowerCase() === "evaluated" && isTrainer && evaluatingId !== hw.id && (
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs font-medium text-slate-400">Current Score:</span>
                          <div className="flex items-center gap-1 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={`star-display-${hw.id}-${i}`}
                                className={`w-4 h-4 ${i < (hw.score || 0) ? "fill-current" : "text-slate-600"}`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <p className="text-slate-300 mb-4">Student Submission:</p>
                      {hw.type === "board" ? (
                        <div className="bg-slate-900 p-4 rounded-xl font-mono text-sm text-emerald-400">
                          {hw.studentSubmission || "No moves recorded."}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl border border-slate-700">
                            <FileText className="w-6 h-6 text-slate-400" />
                            <p className="text-sm font-medium text-slate-200">
                              {hw.submission || "Worksheet completed."}
                            </p>
                          </div>
                          {hw.submissionImageUrls && hw.submissionImageUrls.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-slate-400 uppercase mb-2">Student Submitted Images</p>
                              <div className="flex flex-wrap gap-3">
                                {hw.submissionImageUrls.flatMap(u => (typeof u === 'string' ? u.split(',') : [])).filter(Boolean).map((url, i) => (
                                  <div key={i} onClick={(e) => { e.stopPropagation(); setViewerImage(url); }} className="cursor-pointer group relative">
                                    <img src={url} alt={`student-img-${i}`} className="w-24 h-24 object-cover rounded-xl border border-slate-600 group-hover:border-emerald-500 transition-colors shadow-sm" />
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                      <ImageIcon className="w-6 h-6 text-white drop-shadow-lg" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {evaluatingId === hw.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-6 space-y-4"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-slate-300">
                              Score:
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={`star-button-${hw.id}-${star}`}
                                  onClick={() => setScore(star)}
                                  className={`p-1 transition-colors ${star <= score ? "text-amber-400" : "text-slate-600 hover:text-amber-400/50"}`}
                                >
                                  <Star
                                    className={`w-6 h-6 ${star <= score ? "fill-current" : ""}`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <MarkdownEditor
                            value={feedbackText}
                            onChange={(val) => setFeedbackText(val)}
                            placeholder="Provide feedback... Use markdown for formatting."
                          />

                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEvaluatingId(null);
                                setFeedbackText("");
                                setScore(0);
                              }}
                              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                handleEvaluate(hw.id);
                              }}
                              disabled={score === 0}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Submit Evaluation
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {(hw.status === "evaluated" || (hw.status?.toLowerCase() === "assigned" && hw.feedback)) && hw.feedback && (
                        <div className={`mt-6 ${hw.status?.toLowerCase() === "assigned" ? "bg-amber-500/10 border-amber-500/20" : "bg-blue-500/10 border-blue-500/20"} border rounded-xl p-4`}>
                          <h4 className={`text-sm font-medium ${hw.status?.toLowerCase() === "assigned" ? "text-amber-400" : "text-blue-400"} mb-2`}>
                            {hw.status?.toLowerCase() === "assigned" ? "Trainer Requested Rework" : "Trainer Feedback"}
                          </h4>
                          <div className="prose prose-sm prose-invert max-w-none text-slate-300">
                            <Markdown>{hw.feedback}</Markdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "materials":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Library</h2>
              {isTrainer && (
                <button
                  onClick={() => {
                    setIsMaterialModalOpen(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Upload Material
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {classroom.materials.map((mat) => {
                const MaterialIcon =
                  mat.type === "video"
                    ? Video
                    : mat.type === "image"
                      ? ImageIcon
                      : mat.type === "pdf"
                        ? FileText
                        : File;
                return (
                  <div
                    key={mat.id}
                    onClick={(e) => {
                      if (mat.type?.toLowerCase() !== "image") {
                        window.open(mat.url, "_blank");
                      }
                    }}
                    className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer group relative flex flex-col h-full"
                  >
                    {isTrainer && (
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMaterial(mat);
                            setIsMaterialModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmation({
                              isOpen: true,
                              title: "Delete Material",
                              message: `Are you sure you want to delete "${mat.title}"?`,
                              onConfirm: () => {
                                dispatch(deleteMaterial({ classroomId: classroom.id, materialId: mat.id }));
                              },
                            });
                          }}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-600 transition-colors">
                      <MaterialIcon className="w-6 h-6 text-slate-300 group-hover:text-white" />
                    </div>
                    <h3 className="font-medium text-lg text-slate-200 group-hover:text-white transition-colors">
                      {mat.title}
                    </h3>
                    <p className="text-sm text-slate-400 uppercase tracking-wider mt-1 mb-3">
                      {mat.type}
                    </p>
                    {mat.type?.toLowerCase() === "image" && mat.url && (
                      <div className="flex gap-2 mt-auto overflow-x-auto pb-1 custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                        {mat.url.split(",").map((src, i) => (
                          <img
                            key={i}
                            src={src}
                            alt={`material-img-${i}`}
                            className="h-16 w-16 rounded-lg object-cover flex-shrink-0 hover:opacity-80 transition-opacity border border-slate-600 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setViewerImage(src); }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {classroom.materials.length === 0 && (
                <div className="col-span-full p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-2xl">
                  No materials uploaded yet.
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {isTrainer ? `${classroom.studentName}'s Classroom` : "My Classroom"}
          </h1>
          <p className="text-slate-400 mt-1">
            {isTrainer
              ? "Manage lessons, assignments, and progress."
              : "Access your lessons, assignments, and materials."}
          </p>
        </div>
        <button
          onClick={() => navigate(isTrainer ? "/trainer" : "/student")}
          className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-slate-700 flex items-center gap-2 w-fit shrink-0"
        >
          <ChevronLeft className="w-4 h-4" /> Go Back to Dashboard
        </button>
      </header>

      <div className="flex space-x-1 bg-slate-800/50 backdrop-blur-md p-1 rounded-2xl border border-slate-700/50 w-full sm:w-fit overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${isActive
                ? "text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
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

      <div className="mt-8">{renderContent()}</div>

      <AnimatePresence>
        {viewingSessionId && (
          <ViewSessionModal
            classroomId={classroom.id}
            sessionId={viewingSessionId}
            onClose={() => setViewingSessionId(null)}
            onImageClick={(src) => setViewerImage(src)}
            onHomeworkClick={(hwId) => {
              setSearchParams({ tab: "homework" });
              setTimeout(() => {
                const el = document.getElementById(`homework-${hwId}`);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 300);
            }}
          />
        )}
        {isAssignModalOpen && (
          <AssignHomeworkModal
            key="assign-modal"
            classroomId={classroom.id}
            homework={editingHomework || undefined}
            onClose={() => {
              setIsAssignModalOpen(false);
              setEditingHomework(null);
            }}
          />
        )}

        {isScheduleModalOpen && (
          <ScheduleSessionModal
            key="schedule-modal"
            classroomId={classroom.id}
            session={editingSession || undefined}
            onClose={() => {
              setIsScheduleModalOpen(false);
              setEditingSession(null);
            }}
          />
        )}

        {isUpdateStatusModalOpen && updatingSession && (
          <UpdateSessionStatusModal
            key="update-status-modal"
            classroomId={classroom.id}
            session={updatingSession}
            onClose={() => {
              setIsUpdateStatusModalOpen(false);
              setUpdatingSession(null);
            }}
          />
        )}

        {isMaterialModalOpen && (
          <AddMaterialModal
            key="material-modal"
            classroomId={classroom.id}
            material={editingMaterial}
            onClose={() => {
              setIsMaterialModalOpen(false);
              setEditingMaterial(null);
            }}
          />
        )}

        {confirmation.isOpen && (
          <ConfirmationModal
            key="confirmation-modal"
            isOpen={confirmation.isOpen}
            title={confirmation.title}
            message={confirmation.message}
            onConfirm={() => {
              confirmation.onConfirm();
              setConfirmation((prev) => ({ ...prev, isOpen: false }));
            }}
            onClose={() =>
              setConfirmation((prev) => ({ ...prev, isOpen: false }))
            }
          />
        )}

        <ImageViewerModal
          key="image-viewer-modal"
          isOpen={!!viewerImage}
          onClose={() => setViewerImage(null)}
          imageUrl={viewerImage}
        />

        <WorksheetEvaluationModal
          key="worksheet-eval-modal"
          isOpen={!!evaluatingHomework}
          onClose={() => setEvaluatingHomework(null)}
          homework={evaluatingHomework}
          onSubmit={handleModalEvaluate}
          onRequestRework={handleModalRework}
        />

        {/* Active Solving Board Modal */}
        {activeSolvingBoardId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative"
            >
              <div className="flex items-center justify-between pl-4 pr-1 top-0 left-0 w-full mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <LayoutGrid className="w-6 h-6 text-emerald-400" />
                  Homework Puzzle
                </h3>
                <button
                  autoFocus
                  onClick={() => setActiveSolvingBoardId(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors flex items-center justify-center -mr-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {(() => {
                const hw = classroom.homework.find((h) => h.id === activeSolvingBoardId);
                if (!hw) return null;
                return (
                  <div className="mt-4">
                    {hw.challenge?.description && (
                      <div className="mb-6 bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                        <p className="text-slate-200 text-lg">{hw.challenge.description}</p>
                      </div>
                    )}

                    <div className="px-4">
                      <InteractiveBoard
                        id={`modal-board-${hw.id}`}
                        initialFen={hw.challenge.fen}
                        winningMoves={hw.challenge.winningMoves}
                        targetOrientation={hw.challenge.orientation}
                        isTrainer={false}
                        classroomId={classroom.id}
                        studentName={user?.name || "Student"}
                        onSuccess={() => {
                          if (hw.status?.toLowerCase() === "assigned") {
                            dispatch(
                              submitHomework({
                                classroomId: classroom.id,
                                homeworkId: hw.id,
                                submission: hw.challenge.winningMoves.join(",") || "Position explored.",
                              })
                            );
                            setTimeout(() => setActiveSolvingBoardId(null), 1500);
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
