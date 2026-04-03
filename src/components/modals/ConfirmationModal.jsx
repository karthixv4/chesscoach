import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}) {
  if (!isOpen) return null;

  const colors = {
    danger: "bg-red-500 hover:bg-red-600 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
    info: "bg-emerald-500 hover:bg-emerald-600 text-white",
  };

  const iconColors = {
    danger: "text-red-400",
    warning: "text-amber-400",
    info: "text-emerald-400",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl bg-slate-700/50 ${iconColors[variant]}`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {message}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 bg-slate-700/30 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-colors text-sm font-medium"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-colors ${colors[variant]}`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
