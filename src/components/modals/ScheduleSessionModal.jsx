import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Link as LinkIcon, Video, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createSession, updateSession } from "../../store/classroomsSlice";
import ClockTimePicker from "../ui/ClockTimePicker";

export default function ScheduleSessionModal({
  onClose,
  classroomId,
  session,
}) {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const extractDate = (dateString) => {
    if (!dateString) return "";
    try { return new Date(dateString).toISOString().split("T")[0]; } catch(e) { return dateString.split("T")[0]; }
  };

  const [title, setTitle] = useState(session?.title || "");
  const [date, setDate] = useState(extractDate(session?.date) || "");
  const [startTime, setStartTime] = useState(session?.startTime || "");
  const [endTime, setEndTime] = useState(session?.endTime || "");
  const [endTimeLocked, setEndTimeLocked] = useState(true);
  const [mode, setMode] = useState(session?.mode || "ONLINE");
  const [link, setLink] = useState(session?.link || "");

  const calcEndTime = (start) => {
    if (!start) return "";
    const [h, m] = start.split(":").map(Number);
    const totalMins = h * 60 + m + 60;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  };

  const handleStartTimeChange = (val) => {
    setStartTime(val);
    if (endTimeLocked) {
      setEndTime(calcEndTime(val));
    }
  };

  useEffect(() => {
    if (session) {
      setTitle(session.title);
      setDate(extractDate(session.date) || "");
      setStartTime(session.startTime);
      setEndTime(session.endTime);
      setMode(session.mode || "ONLINE");
      setLink(session.link || "");
    }
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !startTime || !endTime) return;
    if (mode === "ONLINE" && !link.trim()) return;

    try {
      setIsSubmitting(true);
      if (session) {
        const updatedSession = {
          title,
          date,
          startTime,
          endTime,
          mode,
          link: mode === "ONLINE" ? link : null,
        };
        await dispatch(updateSession({ classroomId, sessionId: session.id, sessionData: updatedSession })).unwrap();
      } else {
        const newSession = {
          title,
          date,
          startTime,
          endTime,
          mode,
          link: mode === "ONLINE" ? link : null,
        };
        await dispatch(createSession({ classroomId, sessionData: newSession })).unwrap();
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
            <p className="text-emerald-400 font-medium animate-pulse">Saving Session...</p>
          </div>
        </div>
      )}
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Video className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                {session ? "Edit Session" : "Schedule Session"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Session Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g., Weekly Strategy Review"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Start Time
                </label>
                <ClockTimePicker
                  value={startTime}
                  onChange={handleStartTimeChange}
                  placeholder="Select time"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-medium text-slate-400">
                    End Time
                  </label>
                  <button
                    type="button"
                    onClick={() => setEndTimeLocked(l => !l)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      endTimeLocked
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white'
                    }`}
                  >
                    {endTimeLocked ? '🔒 Auto (1 hr)' : '✏️ Manual'}
                  </button>
                </div>
                <ClockTimePicker
                  value={endTime}
                  onChange={setEndTime}
                  placeholder="Select time"
                  disabled={endTimeLocked}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Session Mode
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("ONLINE")}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    mode === "ONLINE"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  Online
                </button>
                <button
                  type="button"
                  onClick={() => setMode("OFFLINE")}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    mode === "OFFLINE"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  Offline
                </button>
              </div>
            </div>

            {mode === "ONLINE" && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Meeting Link
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="url"
                    required={mode === "ONLINE"}
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : (session ? "Save Changes" : "Schedule Session")}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
    </>
  );
}
