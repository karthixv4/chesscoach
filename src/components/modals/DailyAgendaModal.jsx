import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Video, CheckSquare, XCircle, Calendar as CalendarIcon } from 'lucide-react';

const statusConfig = {
  completed: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", icon: CheckSquare },
  cancelled: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", icon: XCircle },
  ongoing: { bg: "bg-emerald-500/80", text: "text-white", border: "border-emerald-500", icon: Video },
  scheduled: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", icon: CalendarIcon },
  postponed: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30", icon: CalendarIcon },
  preponed: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", icon: CalendarIcon },
};

function parseTime(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function DailyAgendaModal({ dateStr, sessions, onClose, onSessionClick, userRole }) {
  // Sort sessions chronologically
  const sortedSessions = [...(sessions || [])].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  
  // Working hours limits (10:00 AM to 7:00 PM)
  const defaultStart = 10 * 60; // 10:00
  const defaultEnd = 19 * 60;   // 19:00

  // Compute dynamic start and end if sessions fall outside working hours
  let dayStart = defaultStart;
  let dayEnd = defaultEnd;

  if (sortedSessions.length > 0) {
    const firstSessionStart = parseTime(sortedSessions[0].startTime);
    // Find the max end time among all sessions
    const lastSessionEnd = Math.max(...sortedSessions.map(s => {
      // If endTime is missing, assume session is 1 hour
      return s.endTime ? parseTime(s.endTime) : parseTime(s.startTime) + 60;
    }));

    if (firstSessionStart < dayStart) {
      dayStart = firstSessionStart;
    }
    if (lastSessionEnd > dayEnd) {
      dayEnd = lastSessionEnd;
    }
  }

  // Generate timeline slots (Sessions + Free Times)
  const timeline = [];
  let currentTime = dayStart;

  sortedSessions.forEach(session => {
    const sessionStart = parseTime(session.startTime);
    const sessionEnd = session.endTime ? parseTime(session.endTime) : sessionStart + 60;

    // Is there a gap before this session?
    if (sessionStart > currentTime) {
      timeline.push({
        type: 'free',
        startTime: formatTime(currentTime),
        endTime: formatTime(sessionStart),
        duration: sessionStart - currentTime,
      });
    }

    timeline.push({
      type: 'session',
      session,
      startTime: session.startTime,
      endTime: session.endTime || formatTime(sessionEnd),
    });

    currentTime = Math.max(currentTime, sessionEnd);
  });

  // Is there a gap after the last session until the end of the day?
  if (currentTime < dayEnd) {
    timeline.push({
      type: 'free',
      startTime: formatTime(currentTime),
      endTime: formatTime(dayEnd),
      duration: dayEnd - currentTime,
    });
  }

  const dateObj = new Date(dateStr + 'T00:00:00');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/80 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-white">
              {dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            <p className="text-sm text-slate-400">Daily Agenda & Free Time</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-1">
          {timeline.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400">No sessions or free time slots calculated.</p>
            </div>
          ) : (
            timeline.map((slot, idx) => {
              if (slot.type === 'free') {
                const hours = Math.floor(slot.duration / 60);
                const mins = slot.duration % 60;
                let durationStr = '';
                if (hours > 0) durationStr += `${hours} hr `;
                if (mins > 0) durationStr += `${mins} min`;
                
                return (
                  <div key={`free-${idx}`} className="flex items-stretch gap-4 group">
                    <div className="w-16 flex-shrink-0 flex flex-col items-end text-xs text-slate-500 font-medium pt-1.5">
                      <span>{slot.startTime}</span>
                      <span className="opacity-50">to {slot.endTime}</span>
                    </div>
                    <div className="relative flex flex-col items-center">
                      <div className="w-px h-full bg-slate-700/50 group-hover:bg-emerald-500/30 transition-colors"></div>
                      <div className="absolute top-2 w-2 h-2 rounded-full bg-slate-700/80 border border-slate-600"></div>
                    </div>
                    <div className="flex-1 pb-6 pt-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400/80 text-sm font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Free Time ({durationStr.trim()})
                      </div>
                    </div>
                  </div>
                );
              }

              // Session slot
              const session = slot.session;
              const statusKey = session.status?.toLowerCase() || 'scheduled';
              const cfg = statusConfig[statusKey] || statusConfig.scheduled;
              const Icon = cfg.icon;

              return (
                <div key={`session-${session.id}`} className="flex items-stretch gap-4">
                  <div className="w-16 flex-shrink-0 flex flex-col items-end text-xs text-slate-300 font-bold pt-3.5">
                    <span>{slot.startTime}</span>
                    {slot.endTime && <span className="text-slate-500 font-medium">to {slot.endTime}</span>}
                  </div>
                  
                  <div className="relative flex flex-col items-center">
                    <div className={`w-px h-full ${cfg.bg}`}></div>
                    <div className={`absolute top-4 w-3 h-3 rounded-full ${cfg.bg} border-2 ${cfg.border} ring-4 ring-slate-800`}></div>
                  </div>

                  <div className="flex-1 pb-6">
                    <div 
                      onClick={() => onSessionClick && onSessionClick(session)}
                      className={`p-4 rounded-xl border flex flex-col gap-2 cursor-pointer hover:brightness-110 transition-all ${cfg.bg} ${cfg.border} bg-opacity-40 shadow-sm`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${cfg.text}`} />
                          <h4 className="font-semibold text-white truncate text-sm sm:text-base">{session.title}</h4>
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold bg-slate-900/50 ${cfg.text} shrink-0`}>
                          {statusKey}
                        </span>
                      </div>
                      
                      {userRole === 'trainer' && session.classroom?.student?.name && (
                        <p className="text-xs text-slate-300 truncate pl-6">
                          Student: <span className="font-medium text-slate-200">{session.classroom.student.name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
