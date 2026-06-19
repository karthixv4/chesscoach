import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, BookOpen, Calendar, Video, Code, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createLesson, updateLesson } from "../../store/classroomsSlice";
import MarkdownEditor from "../common/MarkdownEditor";

export default function AddLessonModal({ onClose, classroomId, lesson }) {
  const dispatch = useDispatch();
  const { status } = useSelector((state) => state.classrooms);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(lesson?.title || "");
  const [date, setDate] = useState(
    lesson?.date || new Date().toISOString().split("T")[0],
  );
  const [summary, setSummary] = useState(lesson?.summary || "");
  const [detailedNotes, setDetailedNotes] = useState(
    lesson?.detailedNotes || "",
  );
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl || "");
  const [pgn, setPgn] = useState(lesson?.pgn || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !summary.trim()) return;

    const lessonData = {
      id: lesson?.id || `l-${Date.now()}`,
      title,
      date,
      summary,
      detailedNotes,
      videoUrl: videoUrl.trim() || undefined,
      pgn: pgn.trim() || undefined,
      status: lesson?.status || "new",
    };

    try {
      setIsSubmitting(true);
      if (lesson) {
        await dispatch(updateLesson({ classroomId, lessonId: lesson.id, lessonData })).unwrap();
      } else {
        delete lessonData.id;
        await dispatch(createLesson({ classroomId, lessonData })).unwrap();
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      {isSubmitting && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-emerald-400 font-medium">Saving lesson...</p>
          </div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]"
      >
        <div className="p-4 sm:p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {lesson ? "Edit Lesson" : "New Lesson"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Lesson Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g., Opening Principles"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Summary (Short description)
            </label>
            <textarea
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              rows={2}
              placeholder="Brief overview of the lesson..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Detailed Notes (Markdown supported)
            </label>
            <MarkdownEditor
              value={detailedNotes}
              onChange={(val) => setDetailedNotes(val)}
              placeholder="## Lesson Topics\n\n- Topic 1\n- Topic 2..."
              minHeight="150px"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                Video URL (Optional)
              </label>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="https://youtube.com/embed/..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">
                PGN (Optional)
              </label>
              <div className="relative">
                <Code className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={pgn}
                  onChange={(e) => setPgn(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="1. e4 e5 2. Nf3..."
                />
              </div>
            </div>
          </div>
          </div>

          <div className="p-4 sm:p-6 flex gap-3 bg-slate-800 border-t border-slate-700 shrink-0">
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
              className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : (lesson ? "Update Lesson" : "Create Lesson")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
