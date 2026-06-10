import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Activity, Target } from 'lucide-react';

export default function StudentSessionStats({ sessions, classrooms, isLoading }) {
  const stats = useMemo(() => {
    const studentMap = {};
    
    // Determine the active month based on the first session, or default to current date
    let currentMonth = new Date().getMonth() + 1;
    let currentYear = new Date().getFullYear();
    if (sessions && sessions.length > 0) {
      const firstDateStr = sessions[0].rescheduledDate || sessions[0].date;
      if (firstDateStr) {
        const d = new Date(firstDateStr);
        currentMonth = d.getMonth() + 1;
        currentYear = d.getFullYear();
      }
    }

    // Pre-populate with students who have a target set for this month
    if (classrooms) {
      classrooms.forEach(c => {
        if (!c.studentId || !c.studentName) return;
        const mt = c.monthlyTargets?.find(t => t.month === currentMonth && t.year === currentYear);
        if (mt) {
          studentMap[c.studentId] = {
            id: c.studentId,
            name: c.studentName,
            totalScheduled: 0,
            completed: 0,
            target: mt.target,
            targetTitle: mt.title,
          };
        }
      });
    }
    
    if (sessions) {
      sessions.forEach(session => {
        const studentId = session.classroom?.student?.id;
        const studentName = session.classroom?.student?.name;
        if (!studentId || !studentName) return;
        
        const status = session.status?.toLowerCase() || '';
        if (status === 'cancelled') return;
        
        if (!studentMap[studentId]) {
          studentMap[studentId] = {
            id: studentId,
            name: studentName,
            totalScheduled: 0,
            completed: 0,
            target: null,
            targetTitle: null,
          };
        }
        
        studentMap[studentId].totalScheduled += 1;
        if (status === 'completed') {
          studentMap[studentId].completed += 1;
        }
      });
    }
    
    // Sort by target progress first, then by total scheduled
    return Object.values(studentMap).sort((a, b) => {
      const aTotal = a.target || a.totalScheduled;
      const bTotal = b.target || b.totalScheduled;
      return bTotal - aTotal;
    });
  }, [sessions, classrooms]);

  return (
    <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 flex flex-col h-full max-h-[800px]">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/50 shrink-0">
        <div className="p-2 bg-indigo-500/10 rounded-xl shrink-0">
          <Activity className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">Monthly Progress</h2>
          <p className="text-xs text-slate-400 mt-0.5">Sessions completed vs targeted</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6 flex-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-28 bg-slate-700/60 rounded animate-pulse" />
                <div className="h-4 w-10 bg-slate-700/60 rounded animate-pulse" />
              </div>
              <div className="h-2 w-full bg-slate-700/60 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      ) : stats.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-slate-500 py-10">
          <Users className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm text-center">No active students this month.</p>
        </div>
      ) : (
        <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
          {stats.map((student, i) => {
            const displayTotal = student.target || student.totalScheduled;
            const percentage = displayTotal > 0 ? (student.completed / displayTotal) * 100 : 0;
            const isDone = student.completed >= displayTotal && displayTotal > 0;
            
            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group"
              >
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200 group-hover:text-white transition-colors text-sm truncate max-w-[150px]">
                      {student.name}
                    </span>
                    {student.target && (
                      <span title={student.targetTitle || "Session Target"} className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30 flex items-center gap-1">
                        <Target className="w-2.5 h-2.5" />
                        Target
                      </span>
                    )}
                    {isDone && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    <span className={isDone ? "text-emerald-400" : "text-white"}>{student.completed}</span> / {displayTotal}
                  </span>
                </div>
                
                <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                    className={`h-full rounded-full relative ${
                      isDone 
                        ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                        : (student.target ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-blue-500')
                    }`}
                  >
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
