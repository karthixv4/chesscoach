import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Maximize } from "lucide-react";

export default function ImageViewerModal({ isOpen, onClose, imageUrl }) {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    let downloadUrl = imageUrl;
    // Inject fl_attachment to force download on Cloudinary urls
    if (downloadUrl.includes("/image/upload/")) {
      // make sure it isn't already attached
      if (!downloadUrl.includes("/fl_attachment")) {
        downloadUrl = downloadUrl.replace("/image/upload/", "/image/upload/fl_attachment/");
      }
    }
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "download";
    link.target = "_blank"; // fallback if download attribute is ignored
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8 bg-slate-900/95 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl flex flex-col items-center justify-center h-full"
        >
          {/* Top Controls */}
          <div className="absolute top-4 right-4 flex gap-4">
            <button
              onClick={handleDownload}
              className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors flex items-center justify-center shadow-lg"
              title="Download Image"
            >
              <Download className="w-6 h-6" />
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-slate-800 hover:bg-red-500 text-slate-300 hover:text-white rounded-xl transition-colors shadow-lg"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="w-full h-full p-4 sm:p-12 pb-24 flex items-center justify-center">
            <img 
              src={imageUrl} 
              alt="fullscreen-viewer" 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-slate-700/50"
            />
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-800/80 backdrop-blur-md rounded-full border border-slate-700 text-slate-300 font-medium flex items-center gap-2">
            <Maximize className="w-4 h-4 text-emerald-400" />
            <span>Image Viewer</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
