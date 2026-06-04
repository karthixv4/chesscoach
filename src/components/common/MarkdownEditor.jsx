import React, { useState } from "react";
import Markdown from "react-markdown";
import { Eye, Edit3 } from "lucide-react";

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "Type your text here...",
  minHeight = "120px",
}) {
  const [activeTab, setActiveTab] = useState("write"); // 'write' or 'preview'

  return (
    <div className="flex flex-col border border-slate-700 rounded-xl overflow-hidden bg-slate-900/60 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-colors">
      {/* Tabs Header */}
      <div className="flex items-center gap-1 p-2 bg-slate-800/80 border-b border-slate-700/50">
        <button
          type="button"
          onClick={() => setActiveTab("write")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "write"
              ? "bg-emerald-500/15 text-emerald-400"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Write
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "preview"
              ? "bg-emerald-500/15 text-emerald-400"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
          }`}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
      </div>

      {/* Content Area */}
      <div className="relative" style={{ minHeight }}>
        {activeTab === "write" ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full min-h-[inherit] bg-transparent p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none resize-y"
          />
        ) : (
          <div className="w-full h-full min-h-[inherit] p-4 bg-slate-900/40 overflow-y-auto">
            {value ? (
              <div className="prose prose-sm prose-invert max-w-none text-slate-300">
                <Markdown>{value}</Markdown>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Nothing to preview...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
