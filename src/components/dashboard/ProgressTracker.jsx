import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CalendarDays, CheckCircle2, Clock3, RotateCcw, Star } from "lucide-react";

const STATUS = {
  evaluated: { label: "Evaluated", color: "#10b981", icon: CheckCircle2, tone: "text-emerald-400" },
  assigned: { label: "To do", color: "#f59e0b", icon: CalendarDays, tone: "text-amber-400" },
  submitted: { label: "Awaiting review", color: "#60a5fa", icon: Clock3, tone: "text-blue-400" },
  rework: { label: "Needs rework", color: "#f87171", icon: RotateCcw, tone: "text-red-400" },
};

const formatDueDate = (date) => {
  if (!date) return "No due date";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "No due date";
  return `Due ${parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
};

export default function ProgressTracker({ homework = [] }) {
  const summary = useMemo(() => {
    const counts = { evaluated: 0, assigned: 0, submitted: 0, rework: 0 };
    homework.forEach((item) => {
      const status = item.status?.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
    });

    const scored = homework.filter((item) => item.status?.toLowerCase() === "evaluated" && Number.isFinite(Number(item.score)) && item.score !== null);
    const average = scored.length
      ? scored.reduce((sum, item) => sum + Number(item.score), 0) / scored.length
      : null;
    const chartData = Object.entries(STATUS).map(([key, config]) => ({
      name: config.label,
      value: counts[key],
      color: config.color,
    }));
    const evaluatedItems = homework
      .filter((item) => item.status?.toLowerCase() === "evaluated")
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .slice(0, 3);
    const activeHomework = homework
      .filter((item) => ["assigned", "submitted", "rework"].includes(item.status?.toLowerCase()));
    const activeItems = activeHomework
      .sort((a, b) => {
        const priority = { rework: 0, assigned: 1, submitted: 2 };
        const statusDiff = priority[a.status.toLowerCase()] - priority[b.status.toLowerCase()];
        return statusDiff || new Date(a.dueDate || 8640000000000000) - new Date(b.dueDate || 8640000000000000);
      })
      .slice(0, 3);

    return { counts, average, chartData, evaluatedItems, activeItems, activeCount: activeHomework.length };
  }, [homework]);

  if (homework.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center text-center text-slate-400">
        <CalendarDays className="mb-2 h-7 w-7 text-slate-500" />
        <p>No homework assigned yet.</p>
        <p className="mt-1 text-xs text-slate-500">Your worksheets and tasks will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-40 w-full shrink-0 sm:w-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={summary.chartData} cx="50%" cy="50%" innerRadius={48} outerRadius={66} paddingAngle={summary.chartData.filter((item) => item.value > 0).length > 1 ? 4 : 0} dataKey="value" stroke="none">
                {summary.chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f8fafc" }} itemStyle={{ color: "#f8fafc" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-slate-100">{summary.counts.evaluated}<span className="text-slate-500">/{homework.length}</span></span>
            <span className="text-xs text-slate-400">evaluated</span>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2">
          {Object.entries(STATUS).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/30 px-3 py-2.5">
                <Icon className={`h-4 w-4 shrink-0 ${config.tone}`} />
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-slate-400">{config.label}</p>
                  <p className="text-lg font-semibold leading-tight text-slate-100">{summary.counts[key]}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/15 bg-amber-500/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          Average evaluated score
        </div>
        <p className="shrink-0 text-lg font-semibold text-amber-300">
          {summary.average === null ? <span className="text-sm font-medium text-slate-500">Not graded yet</span> : <>{summary.average.toFixed(1)}<span className="text-sm text-slate-400"> / 5</span></>}
        </p>
      </div>

      {summary.activeItems.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Needs your attention</h3>
          <ul className="divide-y divide-slate-700/60 rounded-xl border border-slate-700/60">
            {summary.activeItems.map((item) => {
              const status = item.status.toLowerCase();
              const config = STATUS[status];
              return (
                <li key={item.id} className="flex min-w-0 items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">{item.title}</p>
                    <p className={`text-xs text-slate-500 ${status === "rework" ? "line-clamp-2 break-words" : "truncate"}`}>{status === "submitted" ? "Submitted · waiting for trainer" : status === "rework" ? (item.feedback || "Review the trainer's feedback") : formatDueDate(item.dueDate)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {item.type && <span className="text-[9px] uppercase tracking-wide text-slate-500">{item.type}</span>}
                    <span className={`rounded-full bg-slate-800 px-2 py-1 text-[10px] font-medium ${config.tone}`}>{config.label}</span>
                  </div>
                </li>
              );
            })}
          </ul>
          {summary.activeCount > summary.activeItems.length && <p className="mt-2 text-right text-xs text-slate-500">+{summary.activeCount - summary.activeItems.length} more active</p>}
        </section>
      )}

      {summary.evaluatedItems.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Recent homework scores</h3>
          <ul className="space-y-1.5">
            {summary.evaluatedItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-slate-300">{item.title}</span>
                <span className="shrink-0 font-semibold text-amber-300">{item.score == null ? "—" : `${item.score}/5`}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
