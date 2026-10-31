"use client";

import React, { useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  BarChart3,
  LineChart,
  PieChart,
  Download,
  FileSpreadsheet,
  Table,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Search,
  Activity,
  Layers,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { ChartSpecification, ChartType, ParsedDataset } from "@/lib/analytics/data-types";
import { generateEChartsOption } from "@/lib/analytics/echarts-generator";

// Dynamically import echarts-for-react to prevent SSR document/canvas undefined errors
const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full flex items-center justify-center bg-[var(--surface-subtle)]/30 rounded-xl text-xs text-[var(--text-muted)] animate-pulse">
      Rendering interactive visualization...
    </div>
  ),
});

interface InteractiveChartProps {
  spec: ChartSpecification;
  onFollowUpQuery?: (query: string) => void;
}

const AVAILABLE_CHART_TYPES: { type: ChartType; label: string; icon: any }[] = [
  { type: "bar", label: "Bar Chart", icon: BarChart3 },
  { type: "horizontal-bar", label: "Horizontal Bar", icon: BarChart3 },
  { type: "line", label: "Line Chart", icon: LineChart },
  { type: "area", label: "Area Chart", icon: LineChart },
  { type: "pie", label: "Pie Chart", icon: PieChart },
  { type: "donut", label: "Donut Chart", icon: PieChart },
  { type: "scatter", label: "Scatter Plot", icon: Activity },
  { type: "funnel", label: "Funnel Chart", icon: Layers },
  { type: "radar", label: "Radar Chart", icon: Layers },
];

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  spec,
  onFollowUpQuery,
}) => {
  const chartInstanceRef = useRef<any>(null);
  const [currentType, setCurrentType] = useState<ChartType>(spec.type);
  const [showDataTable, setShowDataTable] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [tableSortCol, setTableSortCol] = useState<string | null>(null);
  const [tableSortAsc, setTableSortAsc] = useState(true);

  // Re-generate chart option when chart type changes
  const activeOption = useMemo(() => {
    if (currentType === spec.type && spec.options) {
      return spec.options;
    }
    return generateEChartsOption(
      {
        type: currentType,
        title: spec.title,
        xAxisColumn: spec.xAxisColumn || spec.dataset.columns[0] || "",
        yAxisColumns: spec.yAxisColumns,
        insights: spec.insights || [],
        suggestedFollowUps: spec.suggestedFollowUps || [],
      },
      spec.dataset,
      "dark"
    );
  }, [currentType, spec]);

  // Export high-resolution PNG
  const handleDownloadPNG = () => {
    if (!chartInstanceRef.current) return;
    try {
      const dataUrl = chartInstanceRef.current.getDataURL({
        type: "png",
        pixelRatio: 2,
        backgroundColor: "#0F172A",
      });
      const link = document.createElement("a");
      link.download = `${spec.title.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "chart"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export PNG:", err);
    }
  };

  // Export underlying dataset to CSV
  const handleExportCSV = () => {
    if (!spec.dataset || !spec.dataset.rows || spec.dataset.rows.length === 0) return;
    try {
      const cols = spec.dataset.columns;
      const headers = cols.join(",");
      const csvLines = spec.dataset.rows.map((row) =>
        cols
          .map((col) => {
            const val = row[col] !== undefined ? String(row[col]) : "";
            return val.includes(",") || val.includes('"') || val.includes("\n")
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          })
          .join(",")
      );
      const csvContent = [headers, ...csvLines].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${spec.title.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "dataset"}.csv`
      );
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export CSV:", err);
    }
  };

  // Filter and sort data rows for table preview
  const filteredRows = useMemo(() => {
    if (!spec.dataset?.rows) return [];
    let rows = [...spec.dataset.rows];
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      rows = rows.filter((r) =>
        Object.values(r).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (tableSortCol) {
      rows.sort((a, b) => {
        const valA = a[tableSortCol];
        const valB = b[tableSortCol];
        if (typeof valA === "number" && typeof valB === "number") {
          return tableSortAsc ? valA - valB : valB - valA;
        }
        return tableSortAsc
          ? String(valA || "").localeCompare(String(valB || ""))
          : String(valB || "").localeCompare(String(valA || ""));
      });
    }
    return rows;
  }, [spec.dataset?.rows, tableSearch, tableSortCol, tableSortAsc]);

  const stats = spec.dataset?.statistics || {};
  const primaryMetric = spec.yAxisColumns?.[0] || Object.keys(stats)[0];
  const metricStats = primaryMetric ? stats[primaryMetric] : null;

  return (
    <div
      className={`my-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-subtle transition-all overflow-hidden ${
        isFullScreen
          ? "fixed inset-4 z-50 flex flex-col bg-slate-900 border-slate-700 shadow-2xl p-4"
          : "w-full"
      }`}
    >
      {/* Chart Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 border-b border-[var(--border)] bg-[var(--surface-subtle)]/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-tight text-[var(--foreground)] line-clamp-1">
              {spec.title}
            </h4>
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
              <span>{spec.dataset.totalRows} data points</span>
              <span>•</span>
              <span className="capitalize">{currentType.replace("-", " ")}</span>
              {metricStats && (
                <>
                  <span>•</span>
                  <span>Avg: {metricStats.mean.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Chart Type Selector Dropdown */}
          <div className="relative inline-block text-left">
            <select
              value={currentType}
              onChange={(e) => setCurrentType(e.target.value as ChartType)}
              className="text-[11px] font-medium py-1 px-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:border-indigo-500/40 focus:outline-none cursor-pointer transition"
            >
              {AVAILABLE_CHART_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Data Table */}
          <button
            onClick={() => {
              setShowDataTable(!showDataTable);
              if (showStats) setShowStats(false);
            }}
            className={`p-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1 ${
              showDataTable
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
            }`}
            title="Toggle Raw Data Table"
          >
            <Table className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Data</span>
          </button>

          {/* Toggle Statistical Summary */}
          {Object.keys(stats).length > 0 && (
            <button
              onClick={() => {
                setShowStats(!showStats);
                if (showDataTable) setShowDataTable(false);
              }}
              className={`p-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1 ${
                showStats
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
              title="Toggle Statistical Insights"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Stats</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition flex items-center gap-1 text-[11px]"
            title="Export CSV Dataset"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden md:inline">CSV</span>
          </button>

          {/* Download PNG */}
          <button
            onClick={handleDownloadPNG}
            className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition flex items-center gap-1 text-[11px]"
            title="Download PNG Image"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden md:inline">PNG</span>
          </button>

          {/* Full Screen Toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
            title={isFullScreen ? "Exit Fullscreen" : "Maximize Chart"}
          >
            {isFullScreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main ECharts Canvas Display */}
      {!showDataTable && (
        <div
          className={`p-3 relative ${
            isFullScreen ? "flex-1 min-h-[500px]" : "h-[360px] md:h-[400px]"
          }`}
        >
          <ReactECharts
            onChartReady={(inst: any) => {
              chartInstanceRef.current = inst;
            }}
            option={activeOption}
            style={{ height: "100%", width: "100%" }}
            notMerge={true}
            lazyUpdate={true}
            opts={{ renderer: "canvas" }}
          />
        </div>
      )}

      {/* Data Table View */}
      {showDataTable && (
        <div className="p-3.5 space-y-3 bg-[var(--surface)] max-h-[420px] flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search rows..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              Showing {filteredRows.length} of {spec.dataset.totalRows} records
            </span>
          </div>

          <div className="overflow-x-auto overflow-y-auto border border-[var(--border)] rounded-xl flex-1 max-h-[300px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--surface-subtle)] sticky top-0 border-b border-[var(--border)] z-10">
                <tr>
                  {spec.dataset.columns.map((col) => (
                    <th
                      key={col}
                      onClick={() => {
                        if (tableSortCol === col) {
                          setTableSortAsc(!tableSortAsc);
                        } else {
                          setTableSortCol(col);
                          setTableSortAsc(true);
                        }
                      }}
                      className="px-3 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--foreground)] whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>{col}</span>
                        <ArrowUpDown className="w-3 h-3 text-[var(--text-muted)]/70" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/50">
                {filteredRows.slice(0, 100).map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[var(--surface-subtle)]/40 transition-colors"
                  >
                    {spec.dataset.columns.map((col) => (
                      <td
                        key={col}
                        className="px-3 py-1.5 text-xs text-[var(--foreground)] whitespace-nowrap font-mono"
                      >
                        {row[col] !== undefined && row[col] !== null
                          ? String(row[col])
                          : "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistical Summary Panel */}
      {showStats && Object.keys(stats).length > 0 && (
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-subtle)]/30 space-y-4 max-h-[420px] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Object.entries(stats).map(([colName, s]) => (
              <div
                key={colName}
                className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider truncate">
                    {colName}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">N={s.count}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-1">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Mean</span>
                    <span className="font-semibold">{s.mean.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Median</span>
                    <span className="font-semibold">{s.median.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Min / Max</span>
                    <span className="font-mono text-[10px]">{s.min} – {s.max}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Std Dev</span>
                    <span className="font-mono text-[10px]">{s.stdDev.toLocaleString()}</span>
                  </div>
                </div>
                {s.outliers.length > 0 && (
                  <div className="pt-1 text-[10px] text-amber-400">
                    ⚠️ {s.outliers.length} outlier(s) detected (&gt;1.5×IQR)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Key Insights Bar */}
      {spec.insights && spec.insights.length > 0 && (
        <div className="px-4 py-2.5 border-t border-[var(--border)] bg-indigo-500/5 text-xs text-[var(--foreground)] space-y-1">
          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Key Mathematical Insights</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[var(--text-muted)] pl-1">
            {spec.insights.map((insight, idx) => (
              <li key={idx} className="leading-snug">
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conversational Follow-up Buttons */}
      {spec.suggestedFollowUps && spec.suggestedFollowUps.length > 0 && (
        <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-subtle)]/40 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mr-1">
            Follow-up:
          </span>
          {spec.suggestedFollowUps.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (onFollowUpQuery) {
                  onFollowUpQuery(action);
                } else if (action.toLowerCase().includes("pie")) {
                  setCurrentType("pie");
                } else if (action.toLowerCase().includes("line")) {
                  setCurrentType("line");
                } else if (action.toLowerCase().includes("bar")) {
                  setCurrentType("bar");
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-indigo-500/10 border border-[var(--border)] hover:border-indigo-500/30 text-[11px] text-[var(--foreground)] transition shadow-xs flex items-center gap-1"
            >
              <span>{action}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
