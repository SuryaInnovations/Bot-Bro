import { ChartSpecification, ChartType, ParsedDataset } from "./data-types";
import { SelectedChartConfig } from "./chart-selector";
import { calculateTrendline } from "./data-analytics";

const COLOR_PALETTE = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#E11D48", // Rose
];

export function generateEChartsOption(
  spec: SelectedChartConfig,
  dataset: ParsedDataset,
  theme: "dark" | "light" = "dark"
): Record<string, any> {
  const isDark = theme === "dark";
  const textColor = isDark ? "#E2E8F0" : "#1E293B";
  const mutedTextColor = isDark ? "#94A3B8" : "#64748B";
  const borderColor = isDark ? "#334155" : "#E2E8F0";
  const splitLineColor = isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.07)";

  const xCol = spec.xAxisColumn || dataset.columns[0];
  const yCols = spec.yAxisColumns.length > 0 ? spec.yAxisColumns : [dataset.columns[1] || dataset.columns[0]];
  const categories = dataset.rows.map((r) => String(r[xCol] !== undefined ? r[xCol] : ""));

  const baseOption: Record<string, any> = {
    color: COLOR_PALETTE,
    backgroundColor: "transparent",
    animationDuration: 750,
    animationEasing: "cubicOut",
    title: {
      text: spec.title,
      subtext: `Analysis across ${dataset.totalRows} data points`,
      left: "center",
      textStyle: {
        color: textColor,
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "system-ui, sans-serif",
      },
      subtextStyle: {
        color: mutedTextColor,
        fontSize: 11,
      },
      top: 10,
    },
    tooltip: {
      trigger: ["pie", "donut", "treemap", "sunburst", "radar"].includes(spec.type) ? "item" : "axis",
      backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
      borderColor: borderColor,
      borderWidth: 1,
      textStyle: {
        color: textColor,
        fontSize: 12,
      },
      axisPointer: {
        type: spec.type === "bar" || spec.type === "horizontal-bar" ? "shadow" : "cross",
        label: {
          backgroundColor: isDark ? "#334155" : "#CBD5E1",
        },
      },
    },
    legend: {
      top: 48,
      type: "scroll",
      textStyle: {
        color: mutedTextColor,
        fontSize: 11,
      },
    },
    grid: {
      top: 85,
      left: 16,
      right: 24,
      bottom: categories.length > 15 ? 65 : 40,
      containLabel: true,
    },
  };

  // 1. Bar Chart
  if (spec.type === "bar" || spec.type === "grouped-bar" || spec.type === "stacked-bar") {
    const isStacked = spec.type === "stacked-bar";
    return {
      ...baseOption,
      xAxis: {
        type: "category",
        data: categories,
        axisLine: { lineStyle: { color: borderColor } },
        axisLabel: {
          color: mutedTextColor,
          fontSize: 11,
          rotate: categories.length > 8 ? 35 : 0,
        },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: splitLineColor } },
        axisLabel: { color: mutedTextColor, fontSize: 11 },
      },
      dataZoom:
        categories.length > 15
          ? [
              { type: "inside", start: 0, end: Math.min(100, Math.floor((15 / categories.length) * 100)) },
              { type: "slider", start: 0, end: Math.min(100, Math.floor((15 / categories.length) * 100)), bottom: 5 },
            ]
          : undefined,
      series: yCols.map((col, idx) => ({
        name: col,
        type: "bar",
        stack: isStacked ? "total" : undefined,
        itemStyle: { borderRadius: isStacked ? 0 : [4, 4, 0, 0] },
        data: dataset.rows.map((r) => Number(r[col]) || 0),
      })),
    };
  }

  // 2. Horizontal Bar Chart
  if (spec.type === "horizontal-bar") {
    return {
      ...baseOption,
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { color: splitLineColor } },
        axisLabel: { color: mutedTextColor, fontSize: 11 },
      },
      yAxis: {
        type: "category",
        data: categories,
        axisLine: { lineStyle: { color: borderColor } },
        axisLabel: { color: mutedTextColor, fontSize: 11 },
        inverse: true,
      },
      series: yCols.map((col) => ({
        name: col,
        type: "bar",
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        data: dataset.rows.map((r) => Number(r[col]) || 0),
      })),
    };
  }

  // 3. Line & Multi-Line Chart
  if (spec.type === "line" || spec.type === "multi-line") {
    return {
      ...baseOption,
      xAxis: {
        type: "category",
        data: categories,
        boundaryGap: false,
        axisLine: { lineStyle: { color: borderColor } },
        axisLabel: {
          color: mutedTextColor,
          fontSize: 11,
          rotate: categories.length > 10 ? 30 : 0,
        },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: splitLineColor } },
        axisLabel: { color: mutedTextColor, fontSize: 11 },
      },
      dataZoom:
        categories.length > 20
          ? [
              { type: "inside", start: 0, end: 100 },
              { type: "slider", start: 0, end: 100, bottom: 5 },
            ]
          : undefined,
      series: yCols.map((col, i) => ({
        name: col,
        type: "line",
        smooth: true,
        showSymbol: categories.length < 30,
        symbolSize: 6,
        data: dataset.rows.map((r) => Number(r[col]) || 0),
      })),
    };
  }

  // 4. Area & Stacked Area Chart
  if (spec.type === "area" || spec.type === "stacked-area") {
    const isStacked = spec.type === "stacked-area";
    return {
      ...baseOption,
      xAxis: {
        type: "category",
        data: categories,
        boundaryGap: false,
        axisLine: { lineStyle: { color: borderColor } },
        axisLabel: { color: mutedTextColor, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: splitLineColor } },
        axisLabel: { color: mutedTextColor, fontSize: 11 },
      },
      series: yCols.map((col, i) => ({
        name: col,
        type: "line",
        smooth: true,
        stack: isStacked ? "total" : undefined,
        areaStyle: { opacity: 0.35 },
        data: dataset.rows.map((r) => Number(r[col]) || 0),
      })),
    };
  }

  // 5. Pie & Donut Chart
  if (spec.type === "pie" || spec.type === "donut") {
    const isDonut = spec.type === "donut";
    const primaryY = yCols[0];
    const pieData = dataset.rows.map((r) => ({
      name: String(r[xCol] || "Item"),
      value: Number(r[primaryY]) || 0,
    }));

    return {
      ...baseOption,
      series: [
        {
          name: primaryY,
          type: "pie",
          radius: isDonut ? ["42%", "72%"] : "70%",
          center: ["50%", "58%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: isDonut ? 6 : 2,
            borderColor: isDark ? "#0F172A" : "#FFFFFF",
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: "{b}: {d}%",
            color: mutedTextColor,
            fontSize: 11,
          },
          data: pieData,
        },
      ],
    };
  }

  // 6. Scatter Plot
  if (spec.type === "scatter" || spec.type === "bubble") {
    const xNumeric = dataset.rows.map((r) => Number(r[xCol]) || 0);
    const yNumeric = dataset.rows.map((r) => Number(r[yCols[0]]) || 0);
    const scatterData = dataset.rows.map((r, i) => [xNumeric[i], yNumeric[i]]);

    // Calculate trendline
    const trend = calculateTrendline(xNumeric, yNumeric);
    const minX = Math.min(...xNumeric);
    const maxX = Math.max(...xNumeric);

    return {
      ...baseOption,
      xAxis: {
        type: "value",
        name: xCol,
        splitLine: { lineStyle: { color: splitLineColor } },
        axisLabel: { color: mutedTextColor, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        name: yCols[0],
        splitLine: { lineStyle: { color: splitLineColor } },
        axisLabel: { color: mutedTextColor, fontSize: 11 },
      },
      series: [
        {
          name: `${xCol} vs ${yCols[0]}`,
          type: "scatter",
          symbolSize: spec.type === "bubble" ? 18 : 10,
          data: scatterData,
        },
        {
          name: `Trendline (${trend.formula}, R²=${trend.r2})`,
          type: "line",
          data: [
            [minX, trend.slope * minX + trend.intercept],
            [maxX, trend.slope * maxX + trend.intercept],
          ],
          lineStyle: { type: "dashed", color: "#EF4444", width: 2 },
          showSymbol: false,
        },
      ],
    };
  }

  // 7. Correlation Matrix Heatmap
  if (spec.type === "correlation-matrix" || spec.type === "heatmap") {
    const numCols = Object.entries(dataset.columnTypes)
      .filter(([_, t]) => t === "number")
      .map(([c]) => c);

    const corr = dataset.correlation;
    const heatmapData: [number, number, number][] = [];

    if (corr) {
      for (let i = 0; i < corr.columns.length; i++) {
        for (let j = 0; j < corr.columns.length; j++) {
          heatmapData.push([i, j, corr.matrix[i][j]]);
        }
      }
    }

    return {
      ...baseOption,
      tooltip: {
        position: "top",
        formatter: (p: any) =>
          `Correlation between ${numCols[p.value[0]]} and ${numCols[p.value[1]]}: <b>${p.value[2]}</b>`,
      },
      xAxis: {
        type: "category",
        data: numCols,
        axisLabel: { color: mutedTextColor, rotate: 30, fontSize: 10 },
      },
      yAxis: {
        type: "category",
        data: numCols,
        axisLabel: { color: mutedTextColor, fontSize: 10 },
      },
      visualMap: {
        min: -1,
        max: 1,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 5,
        inRange: {
          color: ["#3B82F6", "#FFFFFF", "#EF4444"],
        },
        textStyle: { color: mutedTextColor, fontSize: 10 },
      },
      series: [
        {
          name: "Correlation",
          type: "heatmap",
          data: heatmapData,
          label: {
            show: true,
            color: "#0F172A",
            fontSize: 10,
            formatter: (p: any) => p.value[2].toFixed(2),
          },
        },
      ],
    };
  }

  // 8. Radar Chart
  if (spec.type === "radar") {
    const indicatorCols = yCols.slice(0, 6);
    const maxVals: Record<string, number> = {};
    indicatorCols.forEach((col) => {
      maxVals[col] = Math.max(...dataset.rows.map((r) => Number(r[col]) || 0), 10);
    });

    return {
      ...baseOption,
      radar: {
        indicator: indicatorCols.map((c) => ({ name: c, max: maxVals[c] })),
        shape: "circle",
        splitArea: {
          show: true,
          areaStyle: { color: isDark ? ["#1E293B", "#0F172A"] : ["#F8FAFC", "#F1F5F9"] },
        },
        axisLine: { lineStyle: { color: borderColor } },
        splitLine: { lineStyle: { color: splitLineColor } },
      },
      series: [
        {
          type: "radar",
          data: dataset.rows.slice(0, 5).map((row, idx) => ({
            value: indicatorCols.map((col) => Number(row[col]) || 0),
            name: String(row[xCol] || `Item ${idx + 1}`),
          })),
        },
      ],
    };
  }

  // 9. Funnel Chart
  if (spec.type === "funnel") {
    const funnelData = dataset.rows.map((r) => ({
      name: String(r[xCol] || "Stage"),
      value: Number(r[yCols[0]]) || 0,
    }));

    return {
      ...baseOption,
      series: [
        {
          name: spec.title,
          type: "funnel",
          left: "10%",
          top: 60,
          bottom: 40,
          width: "80%",
          sort: "descending",
          gap: 2,
          label: {
            show: true,
            position: "inside",
            formatter: "{b}: {c}",
            color: "#FFFFFF",
          },
          data: funnelData,
        },
      ],
    };
  }

  // Default fallback to bar chart
  return {
    ...baseOption,
    xAxis: { type: "category", data: categories },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: dataset.rows.map((r) => Number(r[yCols[0]]) || 0) }],
  };
}

export function buildChartSpecification(
  spec: SelectedChartConfig,
  dataset: ParsedDataset,
  theme: "dark" | "light" = "dark"
): ChartSpecification {
  const options = generateEChartsOption(spec, dataset, theme);
  return {
    id: `chart-${Date.now()}`,
    title: spec.title,
    type: spec.type,
    xAxisColumn: spec.xAxisColumn,
    yAxisColumns: spec.yAxisColumns,
    options,
    dataset,
    insights: spec.insights,
    suggestedFollowUps: spec.suggestedFollowUps,
  };
}
