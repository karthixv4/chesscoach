import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import Markdown from "react-markdown";

/** A compact note preview that keeps long recaps readable on every screen. */
export default function SessionNotes({ notes, className = "", compact = false }) {
  const [expanded, setExpanded] = useState(false);
  if (!notes) return null;

  return (
    <section className={`min-w-0 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Session Notes</h4>
      </div>
      <div className="px-3 sm:px-4 py-3 bg-slate-900/50 rounded-xl border border-slate-700/50 min-w-0">
        <div className={`prose prose-invert prose-sm max-w-none text-slate-300 break-words [overflow-wrap:anywhere] ${compact ? 'text-xs' : ''} ${expanded ? 'max-h-72 sm:max-h-96 overflow-y-auto overscroll-contain pr-1' : 'max-h-24 overflow-hidden'}`}>
          <Markdown>{notes}</Markdown>
        </div>
        {notes.length > 180 && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((value) => !value);
            }}
            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs font-medium mt-2 min-h-9 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
          >
            {expanded ? <>Show less <ChevronUp className="w-4 h-4" /></> : <>Read full notes <ChevronDown className="w-4 h-4" /></>}
          </button>
        )}
      </div>
    </section>
  );
}
