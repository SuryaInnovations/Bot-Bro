export type ChartType =
  // Basic Charts
  | "bar"
  | "horizontal-bar"
  | "grouped-bar"
  | "stacked-bar"
  | "line"
  | "multi-line"
  | "area"
  | "stacked-area"
  | "pie"
  | "donut"
  // Statistical Charts
  | "histogram"
  | "boxplot"
  | "violin"
  | "scatter"
  | "bubble"
  | "heatmap"
  | "correlation-matrix"
  | "normal-curve"
  | "density"
  | "error-bar"
  // Advanced Charts
  | "radar"
  | "waterfall"
  | "funnel"
  | "treemap"
  | "sunburst"
  | "sankey"
  | "network"
  | "gantt"
  | "calendar-heatmap"
  | "candlestick"
  // Geographic Charts
  | "geo-scatter"
  | "choropleth"
  | "bubble-map";

export interface ColumnMetadata {
  name: string;
  type: "string" | "number" | "date" | "boolean";
  distinctValues: number;
  nullCount: number;
  sampleValues: any[];
}

export interface StatisticalSummary {
  column: string;
  count: number;
  mean: number;
  median: number;
  mode: number | string;
  min: number;
  max: number;
  range: number;
  stdDev: number;
  variance: number;
  q1: number;
  q3: number;
  iqr: number;
  outliers: number[];
  outlierIndices: number[];
  missingCount: number;
  missingPercentage: number;
}

export interface TrendlineAnalysis {
  slope: number;
  intercept: number;
  r2: number;
  trend: "increasing" | "decreasing" | "flat";
  formula: string;
}

export interface CorrelationMatrix {
  columns: string[];
  matrix: number[][]; // 2D matrix of Pearson coefficients [-1, 1]
}

export interface ParsedDataset {
  id: string;
  title: string;
  columns: string[];
  columnTypes: Record<string, "string" | "number" | "date" | "boolean">;
  rows: Record<string, any>[];
  totalRows: number;
  statistics?: Record<string, StatisticalSummary>;
  correlation?: CorrelationMatrix;
  sourceType: "csv" | "excel" | "json" | "markdown" | "manual";
}

export interface ChartSpecification {
  id: string;
  title: string;
  subtitle?: string;
  type: ChartType;
  xAxisColumn?: string;
  yAxisColumns: string[];
  groupColumn?: string;
  options: Record<string, any>; // Full Apache ECharts option object
  dataset: ParsedDataset;
  insights: string[];
  suggestedFollowUps: string[];
}
