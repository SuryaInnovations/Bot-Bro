import { ChartType, ParsedDataset } from "./data-types";

export interface SelectedChartConfig {
  type: ChartType;
  xAxisColumn?: string;
  yAxisColumns: string[];
  title: string;
  insights: string[];
  suggestedFollowUps: string[];
}

export function selectOptimalChart(
  dataset: ParsedDataset,
  userQuery = "",
  preferredType?: ChartType
): SelectedChartConfig {
  const query = userQuery.toLowerCase();
  const columns = dataset.columns;
  const types = dataset.columnTypes;

  const dateCols = columns.filter((c) => types[c] === "date");
  const numCols = columns.filter((c) => types[c] === "number");
  const strCols = columns.filter((c) => types[c] === "string");

  // 0. Preferred Chart Type override if explicitly supplied
  if (preferredType) {
    return buildConfig(
      preferredType,
      strCols[0] || dateCols[0] || columns[0],
      numCols.length > 0 ? [numCols[0]] : [columns[1] || columns[0]],
      dataset
    );
  }

  // 1. Explicit user chart type overrides
  if (query.includes("horizontal bar") || query.includes("ranking")) {
    return buildConfig("horizontal-bar", strCols[0] || columns[0], [numCols[0] || columns[1]], dataset);
  }
  if (query.includes("donut") || query.includes("doughnut")) {
    return buildConfig("donut", strCols[0] || columns[0], [numCols[0] || columns[1]], dataset);
  }
  if (query.includes("pie") || query.includes("percentage") || query.includes("distribution")) {
    return buildConfig("pie", strCols[0] || columns[0], [numCols[0] || columns[1]], dataset);
  }
  if (query.includes("scatter") || query.includes("relationship") || query.includes("correlation between")) {
    if (numCols.length >= 2) {
      return buildConfig("scatter", numCols[0], [numCols[1]], dataset);
    }
  }
  if (query.includes("correlation matrix") || query.includes("heatmap") || query.includes("all numerical")) {
    return buildConfig("correlation-matrix", numCols[0] || columns[0], numCols, dataset);
  }
  if (query.includes("histogram") || query.includes("frequency")) {
    return buildConfig("histogram", numCols[0] || columns[0], [numCols[0] || columns[0]], dataset);
  }
  if (query.includes("box plot") || query.includes("boxplot") || query.includes("outlier")) {
    return buildConfig("boxplot", strCols[0] || columns[0], [numCols[0] || columns[1]], dataset);
  }
  if (query.includes("radar") || query.includes("spider")) {
    return buildConfig("radar", strCols[0] || columns[0], numCols.slice(0, 6), dataset);
  }
  if (query.includes("funnel") || query.includes("conversion rate")) {
    return buildConfig("funnel", strCols[0] || columns[0], [numCols[0] || columns[1]], dataset);
  }
  if (query.includes("waterfall")) {
    return buildConfig("waterfall", strCols[0] || columns[0], [numCols[0] || columns[1]], dataset);
  }
  if (query.includes("treemap")) {
    return buildConfig("treemap", strCols[0] || columns[0], [numCols[0] || columns[1]], dataset);
  }
  if (query.includes("candlestick") || query.includes("stock") || query.includes("ohlc")) {
    return buildConfig("candlestick", dateCols[0] || columns[0], numCols.slice(0, 4), dataset);
  }
  if (query.includes("area") || query.includes("cumulative")) {
    return buildConfig("area", dateCols[0] || strCols[0] || columns[0], [numCols[0] || columns[1]], dataset);
  }
  if (query.includes("line") || query.includes("trend") || query.includes("over time") || query.includes("monthly")) {
    return buildConfig("line", dateCols[0] || strCols[0] || columns[0], [numCols[0] || columns[1]], dataset);
  }
  if (query.includes("bar") || query.includes("compare")) {
    return buildConfig("bar", strCols[0] || columns[0], [numCols[0] || columns[1]], dataset);
  }

  // 2. Intelligent Data-Shape Driven Selection
  // Rule A: If there's a date column + numerical column -> Line Chart
  if (dateCols.length > 0 && numCols.length > 0) {
    if (numCols.length > 1 && query.includes("all")) {
      return buildConfig("multi-line", dateCols[0], numCols.slice(0, 4), dataset);
    }
    return buildConfig("line", dateCols[0], [numCols[0]], dataset);
  }

  // Rule B: If 1 category column + 1 numerical column
  if (strCols.length > 0 && numCols.length > 0) {
    const distinctCategories = dataset.rows.length;
    // Few categories (< 7) and share/percentage intent -> Donut chart
    if (distinctCategories <= 6 && (query.includes("share") || query.includes("ratio"))) {
      return buildConfig("donut", strCols[0], [numCols[0]], dataset);
    }
    // High cardinality (> 8 categories) -> Horizontal Bar Chart for readability
    if (distinctCategories > 8) {
      return buildConfig("horizontal-bar", strCols[0], [numCols[0]], dataset);
    }
    // Default -> Bar Chart
    return buildConfig("bar", strCols[0], [numCols[0]], dataset);
  }

  // Rule C: If multiple numeric columns and no categorical -> Correlation Heatmap or Scatter
  if (numCols.length >= 3 && strCols.length === 0) {
    return buildConfig("correlation-matrix", numCols[0], numCols, dataset);
  }
  if (numCols.length >= 2 && strCols.length === 0) {
    return buildConfig("scatter", numCols[0], [numCols[1]], dataset);
  }

  // Default fallback -> Standard Bar
  const xCol = strCols[0] || dateCols[0] || columns[0] || "Index";
  const yCol = numCols[0] || columns[1] || columns[0];
  return buildConfig("bar", xCol, [yCol], dataset);
}

function buildConfig(
  type: ChartType,
  xAxisColumn: string,
  yAxisColumns: string[],
  dataset: ParsedDataset
): SelectedChartConfig {
  const primaryY = yAxisColumns[0];
  const stats = primaryY && dataset.statistics ? dataset.statistics[primaryY] : null;

  const insights: string[] = [];
  if (stats) {
    insights.push(`Average ${primaryY}: ${stats.mean} (Median: ${stats.median})`);
    insights.push(`Range: from ${stats.min} to ${stats.max} across ${dataset.totalRows} records`);
    if (stats.outliers && stats.outliers.length > 0) {
      insights.push(`${stats.outliers.length} statistical outlier(s) detected (${stats.outliers.slice(0, 3).join(", ")})`);
    }
  }

  const suggestedFollowUps: string[] = [
    `Switch to ${type === "bar" ? "line chart" : "bar chart"}`,
    "Show statistical summary & outliers",
    "Export chart data to CSV",
  ];

  return {
    type,
    xAxisColumn,
    yAxisColumns,
    title: `${primaryY ? formatTitle(primaryY) : "Data"} by ${xAxisColumn ? formatTitle(xAxisColumn) : "Category"}`,
    insights,
    suggestedFollowUps,
  };
}

function formatTitle(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
