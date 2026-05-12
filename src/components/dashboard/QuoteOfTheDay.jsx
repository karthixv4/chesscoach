import React, { useState, useEffect } from "react";
import { Quote } from "lucide-react";
import { motion } from "framer-motion";
import chessQuotes from "../../lib/quotes.json";

export default function QuoteOfTheDay() {
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto minimize after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMinimized(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const todayIndex =
    Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % chessQuotes.length;
  const { quote, author, wikiSlug } = chessQuotes[todayIndex];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        layout: { duration: 0.6, type: "spring", bounce: 0.2 },
        opacity: { duration: 0.5 } 
      }}
      className={`relative overflow-hidden bg-gradient-to-r from-slate-800/80 to-slate-800/40 backdrop-blur-md border border-slate-700/50 group hover:border-indigo-500/50 transition-colors rounded-2xl ${
        isMinimized ? "p-4" : "p-6 sm:p-8"
      }`}
    >
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 text-slate-700/30 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
        <Quote className={`transition-all duration-700 ${isMinimized ? "w-16 h-16 opacity-50" : "w-32 h-32 opacity-100"}`} />
      </div>

      <motion.div layout className="relative z-10 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <motion.div layout className="flex items-center gap-2">
            <div className={`bg-indigo-500/20 rounded-lg transition-all ${isMinimized ? "p-1.5" : "p-2"}`}>
              <Quote className={`text-indigo-400 ${isMinimized ? "w-3 h-3" : "w-4 h-4"}`} />
            </div>
            <span className={`uppercase tracking-widest text-indigo-400 font-bold transition-all ${isMinimized ? "text-[10px]" : "text-xs"}`}>
              Quote of the Day
            </span>
          </motion.div>
        </div>
        
        <motion.blockquote 
          layout
          className={`font-medium text-slate-200 italic transition-all ${
            isMinimized ? "text-base mt-1" : "text-lg sm:text-xl md:text-2xl mt-3 leading-relaxed"
          }`}
        >
          "{quote}"
        </motion.blockquote>
        
        <motion.div layout className={`text-right transition-all ${isMinimized ? "mt-1" : "mt-2"}`}>
          <a
            href={`https://en.wikipedia.org/wiki/${wikiSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 transition-colors font-semibold text-indigo-400 underline underline-offset-4 ${
              isMinimized ? "text-sm" : "text-base hover:text-indigo-300"
            }`}
          >
            — {author}
          </a>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
