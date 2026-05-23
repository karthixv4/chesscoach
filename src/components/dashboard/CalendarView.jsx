import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Video, Calendar as CalendarIcon, CheckSquare, XCircle, Clock } from 'lucide-react';

const statusConfig = {
  completed: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", icon: CheckSquare },
  cancelled: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", icon: XCircle },
  ongoing: { bg: "bg-emerald-500/80", text: "text-white", border: "border-emerald-500", icon: Video },
  scheduled: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", icon: CalendarIcon },
  postponed: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30", icon: CalendarIcon },
  preponed: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", icon: CalendarIcon },
};

const getEffectiveDate = (s) => s.rescheduledDate ? s.rescheduledDate.split("T")[0] : s.date ? s.date.split("T")[0] : "";

export default function CalendarView({ sessions, isLoading, onMonthChange, userRole, onSessionClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Notify parent of month boundaries
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Format as YYYY-MM-DD
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
    
    if (onMonthChange) {
      onMonthChange({ startDate: startStr, endDate: endStr });
    }
  }, [currentDate.getFullYear(), currentDate.getMonth()]); // Only trigger when month/year changes

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Map sessions by date
  const sessionsByDate = {};
  sessions?.forEach(session => {
    const dateStr = getEffectiveDate(session);
    if (!dateStr) return;
    if (!sessionsByDate[dateStr]) sessionsByDate[dateStr] = [];
    sessionsByDate[dateStr].push(session);
  });

  return (
    <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">{MONTHS[currentMonth]} {currentYear}</h2>
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 rounded-full text-xs font-medium text-slate-300">
              <span className="w-3 h-3 border-2 border-slate-500 border-t-emerald-500 rounded-full animate-spin"></span>
              Loading...
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors text-slate-400 hover:text-slate-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-sm font-medium hover:bg-slate-700/50 rounded-xl transition-colors text-slate-300"
          >
            Today
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors text-slate-400 hover:text-slate-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-b border-slate-700/50 bg-slate-800/30">
        {WEEKDAYS.map(day => (
          <div key={day} className="p-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider border-r border-slate-700/50 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 bg-slate-900/20">
        {/* Empty cells for preceding days */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[120px] p-2 border-b border-r border-slate-700/30 bg-slate-800/10"></div>
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = i + 1;
          const isToday = date === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
          
          const daySessions = sessionsByDate[dateStr] || [];

          return (
            <div 
              key={date} 
              className={`min-h-[120px] p-2 sm:p-3 border-b border-r border-slate-700/30 flex flex-col gap-2 transition-colors ${isToday ? 'bg-emerald-500/5' : 'hover:bg-slate-800/40'}`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-7 h-7 flex items-center justify-center text-sm rounded-full font-medium ${isToday ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-300'}`}>
                  {date}
                </span>
                {daySessions.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-500 hidden sm:inline-block">{daySessions.length} sessions</span>
                )}
              </div>
              
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[150px] scrollbar-hide">
                {daySessions.map(session => {
                  const statusKey = session.status?.toLowerCase() || 'scheduled';
                  const cfg = statusConfig[statusKey] || statusConfig.scheduled;
                  const Icon = cfg.icon;

                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={session.id}
                      onClick={() => onSessionClick && onSessionClick(session)}
                      title={`${session.title} - ${session.startTime}`}
                      className={`text-xs p-1.5 rounded-lg border flex flex-col gap-1 cursor-pointer hover:brightness-110 transition-all ${cfg.bg} ${cfg.border}`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold truncate">
                        <Icon className={`w-3 h-3 shrink-0 ${cfg.text}`} />
                        <span className={`truncate ${cfg.text}`}>{session.startTime}</span>
                      </div>
                      
                      {userRole === 'trainer' && session.classroom?.student?.name && (
                        <div className="truncate text-[10px] text-slate-300 font-medium">
                          {session.classroom.student.name}
                        </div>
                      )}
                      
                      <div className="truncate text-[10px] opacity-80 mix-blend-plus-lighter">
                        {session.title}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Empty cells for trailing days */}
        {Array.from({ length: (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7 }).map((_, i) => (
          <div key={`empty-end-${i}`} className="min-h-[120px] p-2 border-b border-r border-slate-700/30 bg-slate-800/10"></div>
        ))}
      </div>
    </div>
  );
}
