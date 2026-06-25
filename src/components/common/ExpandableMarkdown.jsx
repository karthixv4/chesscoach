import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ExpandableMarkdown({ content, maxHeight = 120, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    // Check if content exceeds max height
    if (contentRef.current) {
      if (contentRef.current.scrollHeight > maxHeight) {
        setNeedsExpansion(true);
      } else {
        setNeedsExpansion(false);
      }
    }
  }, [content, maxHeight]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={contentRef}
        className={`relative overflow-hidden transition-all duration-300`}
        style={{ maxHeight: isExpanded ? "10000px" : `${maxHeight}px` }}
      >
        <div className="prose prose-sm prose-invert max-w-none text-slate-300">
          <Markdown>{content}</Markdown>
        </div>
        
        {/* Gradient overlay when collapsed */}
        {!isExpanded && needsExpansion && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />
        )}
      </div>
      
      {needsExpansion && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="mt-2 text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1 transition-colors z-10 relative"
        >
          {isExpanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show Less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Read More</>
          )}
        </button>
      )}
    </div>
  );
}
