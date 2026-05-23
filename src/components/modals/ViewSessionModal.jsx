import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Library, BookOpen, Link as LinkIcon, Video, CheckSquare, FastForward, Rewind, CheckCircle, XCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Markdown from "react-markdown";

export default function ViewSessionModal({
  onClose,
  classroomId,
  sessionId,
  onHomeworkClick,
  onImageClick
}) {
  const dispatch = useDispatch();
  
  const { classrooms, studentSessions, trainerSessions } = useSelector((state) => state.classrooms);
  
  const classroom = classrooms.find(c => c.id === classroomId);
  const session = classroom?.sessions?.find(s => s.id === sessionId) 
    || studentSessions.find(s => s.id === sessionId)
    || trainerSessions.find(s => s.id === sessionId);

  const materials = session?.sessionMaterials?.map(sm => sm.material) || session?.materials || [];
  const homeworks = session?.sessionHomework?.map(sh => sh.homework) || session?.homework || [];

  const [expandedNotes, setExpandedNotes] = useState(false);

  const renderStatusBadge = (status) => {
    const s = status?.toLowerCase();
    let bg = "bg-slate-700 blur-0 text-slate-300";
    if (s === "ongoing") bg = "bg-emerald-500 text-white animate-pulse";
    if (s === "scheduled") bg = "bg-blue-500 text-white";
    if (s === "completed") bg = "bg-slate-600 text-white";
    if (s === "cancelled") bg = "bg-red-500 text-white";
    if (s === "postponed") bg = "bg-orange-500 text-white";
    if (s === "preponed") bg = "bg-purple-500 text-white";

    return (
      <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-bold ${bg}`}>
        {status}
      </span>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl my-8 relative"
        >

          <div className="p-4 sm:p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Session Details
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {session ? (
            <div className="p-4 sm:p-6 space-y-6">
              {/* Header Info */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">{session.title}</h3>
                  {renderStatusBadge(session.status)}
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(session.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>
                      {session.startTime} - {session.endTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status specific messages */}
              {session.status?.toLowerCase() === "cancelled" && session.cancellationReason && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-xs text-red-400 font-medium uppercase mb-1">Reason for Cancellation</p>
                  <p className="text-sm text-slate-300">{session.cancellationReason}</p>
                </div>
              )}

              {(session.status?.toLowerCase() === "postponed" || session.status?.toLowerCase() === "preponed") && session.rescheduledDate && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-xs text-amber-400 font-medium uppercase mb-1">Rescheduled To</p>
                    <p className="text-sm text-slate-300">
                      {new Date(session.rescheduledDate).toLocaleDateString()} at {session.rescheduledStart} - {session.rescheduledEnd}
                    </p>
                  </div>
                </div>
              )}

              {/* Live Link */}
              {session.link && session.status?.toLowerCase() !== "cancelled" && session.status?.toLowerCase() !== "completed" && (
                <div>
                  <a
                    href={session.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                  >
                    <Video className="w-5 h-5" /> Join Live Session
                  </a>
                </div>
              )}

              {/* Notes */}
              {session.notes && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Session Notes</h4>
                  <div className="px-4 py-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                    <div className={`prose prose-invert max-w-none text-slate-300 text-sm ${!expandedNotes ? 'line-clamp-3 overflow-hidden text-ellipsis' : ''}`}>
                      <Markdown>{session.notes}</Markdown>
                    </div>
                    {session.notes.length > 150 && (
                      <button
                        onClick={() => setExpandedNotes(!expandedNotes)}
                        className="text-emerald-400 hover:text-emerald-300 text-xs font-medium mt-2 focus:outline-none"
                      >
                        {expandedNotes ? "Show Less" : "Show More"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Materials */}
              {materials.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Library className="w-4 h-4" /> Attached Materials
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {materials.map((mat) => {
                      if (mat.type?.toLowerCase() === "image" && mat.url) {
                         const images = mat.url.split(",").filter(Boolean);
                         if (images.length > 0) {
                           return (
                             <div key={mat.id} className="flex flex-col gap-2 p-3 bg-slate-900 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-colors">
                                <span className="text-sm font-medium text-slate-300 truncate">{mat.title}</span>
                                <div className="flex flex-wrap gap-2">
                                  {images.map((src, i) => (
                                     <img
                                       key={`${mat.id}-${i}`}
                                       src={src}
                                       alt={mat.title}
                                       className="h-10 w-10 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                       onClick={() => onImageClick ? onImageClick(src) : window.open(src, '_blank')}
                                     />
                                  ))}
                                </div>
                             </div>
                           )
                         }
                      }
                      
                      return (
                        <a
                          key={mat.id}
                          href={mat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 transition-all group"
                        >
                          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">{mat.title}</p>
                            <p className="text-xs text-slate-500">{mat.type || "Link"}</p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Homework */}
              {homeworks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" /> Assigned Homework
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {homeworks.map(hw => (
                      <div
                        key={hw.id}
                        className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                             <CheckSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200 truncate">{hw.title}</p>
                            <p className="text-xs text-slate-500 capitalize">{hw.type} • {hw.status}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onClose();
                            onHomeworkClick && onHomeworkClick(hw.id);
                          }}
                          className="text-sm px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium whitespace-nowrap"
                        >
                          View Task
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
             <div className="p-8 text-center text-slate-400">Loading session...</div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
