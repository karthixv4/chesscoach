import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function ProgressTracker({ homework }) {
  const data = useMemo(() => {
    const completed = homework.filter(
      (h) => h.status === "submitted" || h.status === "evaluated",
    ).length;
    const pending = homework.filter((h) => h.status === "assigned").length;

    return [
      { name: "Completed", value: completed, color: "#10b981" }, // emerald-500
      { name: "Pending", value: pending, color: "#f59e0b" }, // amber-500
    ];
  }, [homework]);

  if (homework.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500">
        No homework assigned yet.
      </div>
    );
  }

  return (
    <div className="h-48 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "none",
              borderRadius: "8px",
              color: "#f8fafc",
            }}
            itemStyle={{ color: "#f8fafc" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
        <span className="text-2xl font-semibold text-slate-200">
          {data[0].value}
        </span>
        <span className="text-xs text-slate-400">Done</span>
      </div>
    </div>
  );
}
