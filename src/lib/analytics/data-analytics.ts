import {
  CorrelationMatrix,
  ParsedDataset,
  StatisticalSummary,
  TrendlineAnalysis,
} from "./data-types";

/**
 * Calculates descriptive statistical metrics for a numeric array.
 */
export function calculateColumnStatistics(
  rawValues: (number | null | undefined)[],
  columnName: string
): StatisticalSummary {
  const validNumbers = rawValues.filter(
    (v): v is number => typeof v === "number" && !isNaN(v) && isFinite(v)
  );

  const missingCount = rawValues.length - validNumbers.length;
  const missingPercentage =
    rawValues.length > 0 ? (missingCount / rawValues.length) * 100 : 0;

  if (validNumbers.length === 0) {
    return {
      column: columnName,
      count: 0,
      mean: 0,
      median: 0,
      mode: 0,
      min: 0,
      max: 0,
      range: 0,
      stdDev: 0,
      variance: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      outliers: [],
      outlierIndices: [],
      missingCount,
      missingPercentage,
    };
  }

  const sorted = [...validNumbers].sort((a, b) => a - b);
  const n = sorted.length;

  // 1. Mean
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;

  // 2. Median
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // 3. Mode
  const counts: Record<number, number> = {};
  let maxFreq = 0;
  let mode: number = sorted[0];
  for (const num of sorted) {
    counts[num] = (counts[num] || 0) + 1;
    if (counts[num] > maxFreq) {
      maxFreq = counts[num];
      mode = num;
    }
  }

  // 4. Min, Max, Range
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  // 5. Variance and Standard Deviation
  const variance =
    sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n > 1 ? n - 1 : 1);
  const stdDev = Math.sqrt(variance);

  // 6. Quartiles (Q1, Q3, IQR)
  const q1 = getPercentile(sorted, 0.25);
  const q3 = getPercentile(sorted, 0.75);
  const iqr = q3 - q1;

  // 7. Outlier Detection using Tukey's Fences (1.5 * IQR)
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers: number[] = [];
  const outlierIndices: number[] = [];

  rawValues.forEach((val, idx) => {
    if (typeof val === "number" && !isNaN(val)) {
      if (val < lowerBound || val > upperBound) {
        outliers.push(val);
        outlierIndices.push(idx);
      }
    }
  });

  return {
    column: columnName,
    count: n,
    mean: round(mean, 2),
    median: round(median, 2),
    mode: round(mode, 2),
    min: round(min, 2),
    max: round(max, 2),
    range: round(range, 2),
    stdDev: round(stdDev, 2),
    variance: round(variance, 2),
    q1: round(q1, 2),
    q3: round(q3, 2),
    iqr: round(iqr, 2),
    outliers,
    outlierIndices,
    missingCount,
    missingPercentage: round(missingPercentage, 1),
  };
}

/**
 * Calculates the Pearson correlation coefficient between two numeric series.
 * Returns a value between -1.0 (perfect negative) and +1.0 (perfect positive).
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const validPairs: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    if (typeof x[i] === "number" && !isNaN(x[i]) && typeof y[i] === "number" && !isNaN(y[i])) {
      validPairs.push([x[i], y[i]]);
    }
  }

  const count = validPairs.length;
  if (count < 2) return 0;

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0,
    sumY2 = 0;

  for (const [xi, yi] of validPairs) {
    sumX += xi;
    sumY += yi;
    sumXY += xi * yi;
    sumX2 += xi * xi;
    sumY2 += yi * yi;
  }

  const numerator = count * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (count * sumX2 - sumX * sumX) * (count * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  return round(numerator / denominator, 3);
}

/**
 * Computes a full NxN correlation matrix for all numerical columns in a dataset.
 */
export function calculateCorrelationMatrix(dataset: ParsedDataset): CorrelationMatrix {
  const numericColumns = Object.entries(dataset.columnTypes)
    .filter(([_, type]) => type === "number")
    .map(([col]) => col);

  const matrix: number[][] = [];

  for (let i = 0; i < numericColumns.length; i++) {
    matrix[i] = [];
    const colA = dataset.rows.map((r) => Number(r[numericColumns[i]]));
    for (let j = 0; j < numericColumns.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else {
        const colB = dataset.rows.map((r) => Number(r[numericColumns[j]]));
        matrix[i][j] = calculatePearsonCorrelation(colA, colB);
      }
    }
  }

  return {
    columns: numericColumns,
    matrix,
  };
}

/**
 * Calculates ordinary least squares (OLS) linear regression trendline.
 */
export function calculateTrendline(x: number[], y: number[]): TrendlineAnalysis {
  const n = Math.min(x.length, y.length);
  if (n < 2) {
    return { slope: 0, intercept: 0, r2: 0, trend: "flat", formula: "y = 0" };
  }

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: 0, r2: 0, trend: "flat", formula: "y = 0" };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  const r = calculatePearsonCorrelation(x, y);
  const r2 = round(r * r, 3);

  const trend = slope > 0.05 ? "increasing" : slope < -0.05 ? "decreasing" : "flat";
  const sign = intercept >= 0 ? "+" : "-";
  const formula = `y = ${round(slope, 2)}x ${sign} ${round(Math.abs(intercept), 2)}`;

  return {
    slope: round(slope, 3),
    intercept: round(intercept, 3),
    r2,
    trend,
    formula,
  };
}

function getPercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function round(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
