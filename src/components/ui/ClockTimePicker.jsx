import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

export default function ClockTimePicker({ value, onChange, placeholder, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('hour'); // 'hour' | 'minute'
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState('AM');

  // Parse value "HH:mm" on mount or when value changes
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      setMinute(m);
      if (h === 0) {
        setHour(12);
        setPeriod('AM');
      } else if (h === 12) {
        setHour(12);
        setPeriod('PM');
      } else if (h > 12) {
        setHour(h - 12);
        setPeriod('PM');
      } else {
        setHour(h);
        setPeriod('AM');
      }
    }
  }, [value, isOpen]);

  const handleSave = () => {
    let finalHour = hour;
    if (period === 'AM' && hour === 12) finalHour = 0;
    if (period === 'PM' && hour !== 12) finalHour += 12;
    const hh = String(finalHour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    onChange(`${hh}:${mm}`);
    setIsOpen(false);
  };

  const renderClockNumbers = () => {
    const items = mode === 'hour' 
      ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      
    // Reorder so 12 is at the top, index 0
    return items.map((num, i) => {
      // 12 or 0 is at top (-90 degrees)
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const radius = 104;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      const isSelected = mode === 'hour' ? hour === num : minute === num;
      
      return (
        <button
          key={num}
          type="button"
          onClick={() => {
            if (mode === 'hour') {
              setHour(num);
              setMode('minute');
            } else {
              setMinute(num);
            }
          }}
          className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center text-sm font-medium transition-colors z-20 ${
            isSelected 
              ? 'bg-emerald-500 text-white' 
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
          style={{ transform: `translate(${x}px, ${y}px)` }}
        >
          {num === 0 && mode === 'minute' ? '00' : num === 5 && mode === 'minute' ? '05' : num}
        </button>
      );
    });
  };

  // formatting display value
  let displayValue = '';
  if (value) {
     const [h, m] = value.split(':');
     let hh = parseInt(h, 10);
     const p = hh >= 12 ? 'PM' : 'AM';
     hh = hh % 12 || 12;
     displayValue = `${hh}:${m} ${p}`;
  }

  return (
    <>
      <div 
        className={`relative w-full bg-slate-900 border rounded-xl pl-10 pr-4 py-2 text-white transition-colors flex items-center ${
          disabled
            ? 'border-slate-700/50 opacity-50 cursor-not-allowed'
            : 'border-slate-700 cursor-pointer hover:border-emerald-500'
        }`}
        style={{ minHeight: '42px' }}
        onClick={() => {
          if (disabled) return;
          setMode('hour');
          setIsOpen(true);
        }}
      >
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <span className={displayValue ? 'text-white' : 'text-slate-400'}>
          {displayValue || placeholder || 'Select time'}
        </span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 w-[320px] flex flex-col items-center"
            >
              {/* Header */}
              <div className="flex gap-2 text-5xl font-light mb-8 mt-2 items-center">
                <button
                  type="button"
                  onClick={() => setMode('hour')}
                  className={`${mode === 'hour' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'} transition-colors px-2 py-1 rounded-lg hover:bg-slate-700/50`}
                >
                  {String(hour).padStart(2, '0')}
                </button>
                <span className="text-slate-500 -mt-2">:</span>
                <button
                  type="button"
                  onClick={() => setMode('minute')}
                  className={`${mode === 'minute' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'} transition-colors px-2 py-1 rounded-lg hover:bg-slate-700/50`}
                >
                  {String(minute).padStart(2, '0')}
                </button>
                <div className="flex flex-col text-sm justify-center ml-2 border-l border-slate-700 pl-4 h-14 space-y-1">
                  <button
                    type="button"
                    onClick={() => setPeriod('AM')}
                    className={`${period === 'AM' ? 'text-emerald-400 font-medium' : 'text-slate-400 hover:text-white'} text-left`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod('PM')}
                    className={`${period === 'PM' ? 'text-emerald-400 font-medium' : 'text-slate-400 hover:text-white'} text-left`}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Clock Face */}
              <div className="relative w-64 h-64 bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                {/* Center dot */}
                <div className="w-2 h-2 bg-emerald-500 rounded-full absolute z-10" />
                
                {/* Hand */}
                <div 
                  className="absolute w-[2px] bg-emerald-500 origin-bottom transition-transform duration-300"
                  style={{ 
                    height: '104px', 
                    bottom: '50%',
                    left: 'calc(50% - 1px)',
                    transform: `rotate(${
                      mode === 'hour' 
                        ? (hour % 12) * 30 
                        : minute * 6
                    }deg)` 
                  }}
                >
                  <div className="w-8 h-8 rounded-full border-[3px] border-emerald-500 absolute -top-4 -left-[15px] bg-emerald-500/20" />
                </div>

                {/* Numbers */}
                <div className="absolute w-full h-full flex items-center justify-center pointer-events-auto">
                  {renderClockNumbers()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex w-full justify-between mt-2 px-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-sm font-medium transition-colors"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
