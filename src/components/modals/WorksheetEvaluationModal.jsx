import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Star, Image as ImageIcon, Loader2 } from "lucide-react";

export default function WorksheetEvaluationModal({ isOpen, onClose, homework, onSubmit }) {
  const [trainerIdx, setTrainerIdx] = useState(0);
  const [studentIdx, setStudentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && homework) {
      setTrainerIdx(0);
      setStudentIdx(0);
      setScore(homework.score || 0);
      setFeedback(homework.feedback || "");
      setIsSubmitting(false);
    }
  }, [isOpen, homework]);

  const trainerImages = homework?.imageUrls ? homework.imageUrls.flatMap(u => (typeof u === 'string' ? u.split(',') : [])).filter(Boolean) : [];
  const studentImages = homework?.submissionImageUrls ? homework.submissionImageUrls.flatMap(u => (typeof u === 'string' ? u.split(',') : [])).filter(Boolean) : [];

  const isPuzzle = homework?.type?.toLowerCase() === 'puzzle';
  const hasFileUrl = homework?.fileUrl && homework.fileUrl !== "#";

  const getEmbeddableUrl = (url) => {
    if (!url) return url;
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    return url;
  };

  const embedUrl = hasFileUrl ? getEmbeddableUrl(homework.fileUrl) : "";
  const handleTrainerNext = () => setTrainerIdx(i => (i + 1) % trainerImages.length);
  const handleTrainerPrev = () => setTrainerIdx(i => (i - 1 + trainerImages.length) % trainerImages.length);

  const handleStudentNext = () => setStudentIdx(i => (i + 1) % studentImages.length);
  const handleStudentPrev = () => setStudentIdx(i => (i - 1 + studentImages.length) % studentImages.length);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(homework.id, score, feedback);
    setIsSubmitting(false);
    onClose();
  };

  const Carousel = ({ images, currentIndex, onNext, onPrev, title }) => (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        {title} ({images.length > 0 ? `${currentIndex + 1} of ${images.length}` : '0'})
      </h3>
      <div className="flex-1 min-h-[250px] relative bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden flex items-center justify-center group">
        {images.length > 0 ? (
          <>
            <img 
              src={images[currentIndex]} 
              alt={`${title}-${currentIndex}`} 
              className="w-full h-full object-contain"
            />
            {images.length > 1 && (
              <>
                <button 
                  onClick={onPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={onNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500">
            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm text-center px-4">No images attached.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {(isOpen && homework) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl w-full ${isPuzzle ? 'max-w-xl' : 'max-w-6xl'} max-h-[90vh] flex flex-col overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50">
              <div>
                <h2 className="text-xl font-bold text-white">Evaluate Worksheet</h2>
                <p className="text-sm text-slate-400 mt-1">{homework.title}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[500px]">
                
                {/* Left Side: Trainer's Assignment */}
                {!isPuzzle && (
                  <div className="w-full lg:w-1/2 flex flex-col">
                    <div className="flex-1 flex flex-col h-full">
                      {hasFileUrl ? (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                              Assignment Reference
                            </h3>
                            <a href={homework.fileUrl} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors rounded-lg border border-slate-600/50 shadow-sm">Open in New Tab</a>
                          </div>
                          <div className="flex-1 min-h-[400px] w-full rounded-2xl border-2 border-slate-700/50 bg-slate-900 flex flex-col overflow-hidden">
                            <div className="flex-1 flex flex-col bg-slate-800 relative">
                              <iframe 
                                src={embedUrl} 
                                className="w-full h-full bg-slate-200 flex-1 border-0" 
                                title="Assignment Work" 
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <Carousel 
                          images={trainerImages} 
                          currentIndex={trainerIdx} 
                          onNext={handleTrainerNext} 
                          onPrev={handleTrainerPrev} 
                          title="Assignment Reference"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Right Side: Student Submission & Evaluation */}
                <div className={`w-full ${isPuzzle ? 'lg:w-full' : 'lg:w-1/2'} flex flex-col gap-6`}>
                  
                  {/* Top Right: Student Evidence */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 min-h-0 mb-3">
                      <Carousel 
                        images={studentImages} 
                        currentIndex={studentIdx} 
                        onNext={handleStudentNext} 
                        onPrev={handleStudentPrev} 
                        title="Student Submission"
                      />
                    </div>
                    {homework.submission && (
                       <div className="flex-none bg-slate-900 border border-slate-700 rounded-xl p-4 max-h-48 overflow-y-auto custom-scrollbar">
                         <p className="text-xs font-medium text-slate-400 uppercase mb-1 sticky top-0 bg-slate-900 pb-1">Text Submission:</p>
                         <p className="text-sm text-slate-300 whitespace-pre-wrap">{homework.submission}</p>
                       </div>
                    )}
                  </div>

                  {/* Bottom Right: Grading Form */}
                  <div className="flex-none bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                      {homework?.status === 'evaluated' ? 'Edit Evaluation' : 'Grade Submission'}
                    </h3>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-sm font-medium text-slate-400">Score:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setScore(star)}
                            className={`p-1 transition-colors ${
                              star <= score ? "text-amber-400" : "text-slate-600 hover:text-amber-400/50"
                            }`}
                          >
                            <Star className={`w-8 h-8 ${star <= score ? "fill-current" : ""}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-emerald-500 resize-none placeholder:text-slate-500"
                      placeholder="Provide constructive feedback for the student..."
                      rows={3}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />

                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={score === 0 || isSubmitting}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          "Submit Evaluation"
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
