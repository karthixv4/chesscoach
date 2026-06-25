import { Star, ChevronRight, MessageSquare, Award } from "lucide-react";
import Markdown from "react-markdown";
import ExpandableMarkdown from "../common/ExpandableMarkdown";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function EvaluationsDeck({ homework, classroomId }) {
  const navigate = useNavigate();
  // Filter for evaluated homework only
  const evaluatedHomework = (homework || [])
    .filter((h) => h.status?.toLowerCase() === "evaluated")
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (evaluatedHomework.length === 0) return null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 mb-8 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Recent Evaluations
        </h2>
        <button
          onClick={() => navigate(`/classroom/${classroomId}?tab=evaluations`)}
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
        >
          View all <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {evaluatedHomework.map((hw, i) => (
          <motion.div
            key={hw.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="shrink-0 w-72 sm:w-80 bg-slate-700/30 rounded-xl p-5 border border-slate-600/50 flex flex-col snap-start cursor-pointer hover:bg-slate-700/50 transition-colors"
            onClick={() => navigate(`/classroom/${classroomId}?tab=evaluations`)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-white text-lg line-clamp-1 flex-1 mr-2">{hw.title}</h3>
              <span className="text-xs font-medium px-2 py-1 bg-slate-800 text-slate-300 rounded-lg capitalize shrink-0">
                {hw.type}
              </span>
            </div>

            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, idx) => (
                <Star
                  key={idx}
                  className={`w-4 h-4 ${idx < (hw.score || 0) ? "text-amber-400 fill-amber-400" : "text-slate-600"
                    }`}
                />
              ))}
              <span className="text-xs text-slate-400 ml-2">Score</span>
            </div>

            <div className="flex-1 bg-slate-800/50 rounded-lg p-3 text-sm text-slate-300 border border-slate-700/50">
              <div className="flex gap-2 items-start">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="italic prose prose-sm prose-invert max-w-none text-slate-300">
                  <ExpandableMarkdown content={hw.feedback || "Great effort!"} maxHeight={80} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
