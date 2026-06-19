import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, FileText, CheckCircle, BarChart3,
  BookOpen, Send, Save, ChevronDown,
} from "lucide-react";
import {
  generateReport, saveDraft, publishReport, fetchReports,
} from "../../store/reportsSlice";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// Build a list of the last 6 months (including current)
function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return options;
}

// Stat row in the auto-generated section
function StatRow({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/40 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">
        {value ?? <span className="text-slate-500 font-normal">—</span>}
        {sub && <span className="text-slate-500 font-normal text-xs ml-1">{sub}</span>}
      </span>
    </div>
  );
}

// Editable textarea section
function EditorSection({ label, hint, value, onChange, onBlur, placeholder }) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-semibold text-slate-200">{label}</label>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={4}
        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 resize-none transition-colors"
      />
    </div>
  );
}

export default function ReportEditorModal({ classroom, onClose }) {
  const dispatch = useDispatch();
  const { reports, status, saveStatus } = useSelector(s => s.reports);

  const monthOptions = getMonthOptions();
  const [selectedOption, setSelectedOption] = useState(monthOptions[0]);

  // Fix: filter by this classroom's id so we don't match another student's report
  const existingReport = reports.find(
    r =>
      r.classroomId === classroom.id &&
      r.month === selectedOption.month &&
      r.year === selectedOption.year
  );

  // Local editable state
  const [areasOfStrength, setAreasOfStrength] = useState("");
  const [areasToImprove, setAreasToImprove] = useState("");
  const [trainerComments, setTrainerComments] = useState("");
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const reportId = existingReport?.id;
  const isGenerating = status === "loading";

  // Fix: fetch reports for this specific classroom when the modal opens
  // so that existing drafts are loaded even if they weren't fetched before.
  useEffect(() => {
    dispatch(fetchReports(classroom.id));
  }, [dispatch, classroom.id]);

  // Sync local textarea state whenever the found report changes
  useEffect(() => {
    if (existingReport) {
      setAreasOfStrength(existingReport.areasOfStrength || "");
      setAreasToImprove(existingReport.areasToImprove || "");
      setTrainerComments(existingReport.trainerComments || "");
    } else {
      setAreasOfStrength("");
      setAreasToImprove("");
      setTrainerComments("");
    }
    setShowPublishConfirm(false);
  }, [existingReport?.id, selectedOption.month, selectedOption.year]);

  // Auto-save on blur
  const handleBlurSave = useCallback(() => {
    if (!reportId) return;
    dispatch(saveDraft({
      classroomId: classroom.id,
      reportId,
      data: { areasOfStrength, areasToImprove, trainerComments },
    }));
  }, [dispatch, classroom.id, reportId, areasOfStrength, areasToImprove, trainerComments]);

  const handleGenerate = () => {
    dispatch(generateReport({
      classroomId: classroom.id,
      month: selectedOption.month,
      year: selectedOption.year,
    }));
  };

  const handlePublish = () => {
    dispatch(saveDraft({
      classroomId: classroom.id,
      reportId,
      data: { areasOfStrength, areasToImprove, trainerComments },
    })).then(() => {
      dispatch(publishReport({ classroomId: classroom.id, reportId }));
      setShowPublishConfirm(false);
    });
  };

  const stats = existingReport?.statsSnapshot;
  const isPublished = existingReport?.status === "PUBLISHED";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-end p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel — full width on mobile, max-xl on desktop */}
      <motion.div
        className="relative z-10 w-full max-w-xl h-full max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 60, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-500/10 rounded-xl shrink-0">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-white leading-none truncate">Monthly Report</h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{classroom.studentName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {/* Save indicator */}
            <AnimatePresence>
              {saveStatus === "saving" && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs text-slate-400 flex items-center gap-1 hidden sm:flex"
                >
                  <Save className="w-3 h-3 animate-pulse" /> Saving…
                </motion.span>
              )}
              {saveStatus === "saved" && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs text-emerald-400 flex items-center gap-1 hidden sm:flex"
                >
                  <CheckCircle className="w-3 h-3" /> Saved
                </motion.span>
              )}
            </AnimatePresence>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Month selector row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <select
                value={`${selectedOption.year}-${selectedOption.month}`}
                onChange={e => {
                  const [y, m] = e.target.value.split("-");
                  setSelectedOption({ year: Number(y), month: Number(m) });
                }}
                className="w-full appearance-none bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-slate-500 pr-8"
              >
                {monthOptions.map(o => (
                  <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
                    {MONTH_NAMES[o.month - 1]} {o.year}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            {/* Status badge or Generate button */}
            {existingReport ? (
              <span className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold border ${
                isPublished
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              }`}>
                {isPublished ? "Published" : "Draft"}
              </span>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="shrink-0 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isGenerating ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating…</>
                ) : (
                  <><BarChart3 className="w-4 h-4" /> Generate</>
                )}
              </button>
            )}
          </div>

          {/* No report yet — prompt to generate */}
          {!existingReport && !isGenerating && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <FileText className="w-10 h-10 opacity-30" />
              <p className="text-sm text-center">
                No report for this month yet. Click <strong className="text-slate-400">Generate</strong> to auto-fill a draft.
              </p>
            </div>
          )}

          {/* Loading state while generating */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <span className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-sm">Building report from your data…</p>
            </div>
          )}

          {/* Report content */}
          {existingReport && (
            <>
              {/* ── Auto-generated Stats ── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Auto-generated Stats</h3>
                  <span className="text-[10px] text-slate-600 ml-1">(read-only)</span>
                </div>
                <div className="bg-slate-900/50 rounded-xl border border-slate-700/40 px-4 py-1 divide-y divide-slate-700/30">
                  <StatRow label="Sessions Completed" value={`${stats?.sessionsCompleted ?? "—"} / ${stats?.sessionsScheduled ?? "—"}`} sub="scheduled" />
                  <StatRow label="Sessions Cancelled" value={stats?.sessionsCancelled ?? "—"} />
                  <StatRow label="Homework Assigned" value={stats?.hwAssigned ?? "—"} />
                  <StatRow label="Homework Submitted" value={stats?.hwSubmitted ?? "—"} />
                  <StatRow label="Homework Evaluated" value={stats?.hwEvaluated ?? "—"} />
                  <StatRow
                    label="Average Score"
                    value={stats?.avgScore != null ? `${stats.avgScore}%` : null}
                    sub={stats?.avgScore == null ? "(no evaluated homework)" : undefined}
                  />
                  {stats?.practiceLogsCount > 0 && (
                    <>
                      <StatRow label="Practice Days Logged" value={stats.practiceLogsCount} />
                      <StatRow label="Total Practice Time" value={`${stats.totalPracticeMinutes} min`} />
                      <StatRow label="Total Games Played" value={stats.totalPracticeGames} />
                    </>
                  )}
                </div>
              </section>

              {/* ── Trainer-authored sections ── */}
              <section className="space-y-5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trainer Remarks</h3>
                </div>

                <EditorSection
                  label="Areas of Strength"
                  hint="What has the student done well this month?"
                  placeholder="e.g. Strong tactical vision, consistent opening preparation..."
                  value={areasOfStrength}
                  onChange={setAreasOfStrength}
                  onBlur={handleBlurSave}
                />

                <EditorSection
                  label="Areas to Improve"
                  hint="What should the student focus on next?"
                  placeholder="e.g. Endgame technique, time management in complex positions..."
                  value={areasToImprove}
                  onChange={setAreasToImprove}
                  onBlur={handleBlurSave}
                />

                <EditorSection
                  label="Trainer Comments"
                  hint="Any additional observations, encouragement, or context."
                  placeholder="Free-form notes — visible to the student/parent after publishing."
                  value={trainerComments}
                  onChange={setTrainerComments}
                  onBlur={handleBlurSave}
                />
              </section>

              {/* Publish confirmation inline */}
              <AnimatePresence>
                {showPublishConfirm && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex flex-col gap-3"
                  >
                    <p className="text-sm text-slate-300">
                      Once published, this report will be visible to the student. You can still edit it after publishing.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handlePublish}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" /> Confirm Publish
                      </button>
                      <button
                        onClick={() => setShowPublishConfirm(false)}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded-xl text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* ── Sticky footer ── */}
        {existingReport && (
          <div className="shrink-0 px-4 sm:px-6 py-4 border-t border-slate-700/50 bg-slate-800 flex gap-3">
            {/* Mobile save indicator */}
            <AnimatePresence>
              {saveStatus === "saving" && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs text-slate-400 flex items-center gap-1 sm:hidden absolute left-4 top-4"
                >
                  <Save className="w-3 h-3 animate-pulse" /> Saving…
                </motion.span>
              )}
            </AnimatePresence>
            <button
              onClick={handleBlurSave}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm transition-colors"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            {!showPublishConfirm && (
              <button
                onClick={() => setShowPublishConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors"
              >
                <Send className="w-4 h-4" />
                {isPublished ? "Re-publish" : "Publish"}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
