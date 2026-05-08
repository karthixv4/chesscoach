import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  FastForward,
  Rewind,
  Play,
  FileText,
  BookOpen,
  Loader2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import { updateSessionStatus } from "../../store/classroomsSlice";
import ClockTimePicker from "../ui/ClockTimePicker";

export default function UpdateSessionStatusModal({
  onClose,
  classroomId,
  session,
}) {
  const dispatch = useDispatch();
  const classroom = useSelector((state) =>
    state.classrooms.classrooms.find((c) => c.id === classroomId),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const extractDate = (dateString) => {
    if (!dateString) return "";
    try { return new Date(dateString).toISOString().split("T")[0]; } catch(e) { return dateString.split("T")[0]; }
  };

  // Pull the freshest copy of this session from the store so we always have
  // the correct sessionMaterials / sessionHomework even if the prop was briefly
  // stripped of relations by a plain "update" response.
  const liveSession = useSelector((state) => {
    const c = state.classrooms.classrooms.find((c) => c.id === classroomId);
    return c?.sessions?.find((s) => s.id === session.id) || session;
  });

  const [status, setStatus] = useState((session.status || "scheduled").toLowerCase());
  const [reason, setReason] = useState(session.cancellationReason || "");
  const [rescheduleDate, setRescheduleDate] = useState(
    extractDate(session.rescheduledDate) || "",
  );
  const [rescheduleStart, setRescheduleStart] = useState(
    session.rescheduledStart || "",
  );
  const [rescheduleEnd, setRescheduleEnd] = useState(
    session.rescheduledEnd || "",
  );
  const [notes, setNotes] = useState(liveSession.notes || session.notes || "");

  // Extract the IDs of already-attached materials and homework from the live
  // session so they are pre-selected and never accidentally wiped.
  const initMaterials = () => {
    const sm = liveSession.sessionMaterials || session.sessionMaterials || [];
    return sm.map((item) => item.material?.id || item.materialId).filter(Boolean);
  };
  const initHomework = () => {
    const sh = liveSession.sessionHomework || session.sessionHomework || [];
    return sh.map((item) => item.homework?.id || item.homeworkId).filter(Boolean);
  };

  const [selectedMaterials, setSelectedMaterials] = useState(initMaterials);
  const [selectedHomework, setSelectedHomework] = useState(initHomework);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      // Always include notes, materials, and homework so they are never silently
      // dropped when re-editing a past session regardless of which status is chosen.
      const payload = {
        classroomId,
        sessionId: session.id,
        data: {
          status: status.toUpperCase(),
          notes,
          materialIds: selectedMaterials,
          homeworkIds: selectedHomework,
        }
      };

      if (status === "cancelled") {
        payload.data.cancellationReason = reason;
      } else if (status === "postponed" || status === "preponed") {
        payload.data.rescheduledTo = {
          date: rescheduleDate || null,
          startTime: rescheduleStart,
          endTime: rescheduleEnd
        };
      }

      await dispatch(updateSessionStatus(payload)).unwrap();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMaterial = (id) => {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id],
    );
  };

  const toggleHomework = (id) => {
    setSelectedHomework((prev) =>
      prev.includes(id) ? prev.filter((hid) => hid !== id) : [...prev, id],
    );
  };

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
            <p className="text-emerald-400 font-medium animate-pulse">Updating Status...</p>
          </div>
        </div>
      )}
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg my-8"
        >
          <div className="p-4 sm:p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Update Session Status
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "ongoing",
                  label: "Ongoing",
                  icon: Play,
                  color: "text-blue-400",
                  bg: "bg-blue-400/10",
                },
                {
                  id: "completed",
                  label: "Completed",
                  icon: CheckCircle,
                  color: "text-emerald-400",
                  bg: "bg-emerald-400/10",
                },
                {
                  id: "cancelled",
                  label: "Cancelled",
                  icon: XCircle,
                  color: "text-red-400",
                  bg: "bg-red-400/10",
                },
                {
                  id: "postponed",
                  label: "Postponed",
                  icon: FastForward,
                  color: "text-amber-400",
                  bg: "bg-amber-400/10",
                },
                {
                  id: "preponed",
                  label: "Preponed",
                  icon: Rewind,
                  color: "text-purple-400",
                  bg: "bg-purple-400/10",
                },
                {
                  id: "scheduled",
                  label: "Scheduled",
                  icon: Calendar,
                  color: "text-slate-400",
                  bg: "bg-slate-400/10",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatus(item.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    status === item.id
                      ? `border-${item.color.split("-")[1]}-500 ${item.bg} scale-105`
                      : "border-slate-700 bg-slate-900/50 hover:bg-slate-700/50"
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                  <span className="text-xs font-medium text-slate-300">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {status === "cancelled" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <label className="block text-sm font-medium text-slate-400">
                  Reason for Cancellation
                </label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors h-24 resize-none"
                  placeholder="Enter reason..."
                />
              </motion.div>
            )}

            {(status === "postponed" || status === "preponed") && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">
                      New Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="date"
                        required
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">
                        New Start Time
                      </label>
                      <ClockTimePicker
                        value={rescheduleStart}
                        onChange={setRescheduleStart}
                        placeholder="Select new time"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">
                        New End Time
                      </label>
                      <ClockTimePicker
                        value={rescheduleEnd}
                        onChange={setRescheduleEnd}
                        placeholder="Select new time"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Notes, Materials and Homework — always visible so the trainer can
                edit them when re-opening any past session, not just on first
                completion. */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">
                  Session Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors h-24 resize-none"
                  placeholder="Summary of what was covered..."
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-400">
                  Attach Materials
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                  {classroom?.materials?.length > 0 ? classroom.materials.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMaterial(m.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        selectedMaterials.includes(m.id)
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-slate-700 bg-slate-900/50 hover:bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-200">{m.title}</span>
                      </div>
                      {selectedMaterials.includes(m.id) && (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                    </button>
                  )) : (
                    <p className="text-sm text-slate-500 text-center py-2">
                      No materials available
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-400">
                  Map Homework
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                  {classroom?.homework?.length > 0 ? classroom.homework.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => toggleHomework(h.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        selectedHomework.includes(h.id)
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-slate-700 bg-slate-900/50 hover:bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-200">{h.title}</span>
                      </div>
                      {selectedHomework.includes(h.id) && (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                    </button>
                  )) : (
                    <p className="text-sm text-slate-500 text-center py-2">
                      No homework available
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            <div className="pt-4 flex gap-3 sticky bottom-0 bg-slate-800 py-4 border-t border-slate-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update Status"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
    </>
  );
}
