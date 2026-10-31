import * as XLSX from "xlsx";
import { ParsedDataset } from "./data-types";
import {
  calculateColumnStatistics,
  calculateCorrelationMatrix,
} from "./data-analytics";

/**
 * Parses raw text, CSV, markdown, JSON, or an Excel buffer into a normalized ParsedDataset.
 */
export function parseDataset(
  input: string | Buffer,
  sourceTypeOrTitle: "csv" | "excel" | "json" | "markdown" | "manual" | string = "csv",
  title = "Dataset"
): ParsedDataset {
  let rows: Record<string, any>[] = [];
  let columns: string[] = [];
  let sourceType: "csv" | "excel" | "json" | "markdown" | "manual" = "csv";
  let datasetTitle = title;

  if (["csv", "excel", "json", "markdown", "manual"].includes(sourceTypeOrTitle)) {
    sourceType = sourceTypeOrTitle as any;
  } else if (typeof sourceTypeOrTitle === "string" && sourceTypeOrTitle.trim()) {
    datasetTitle = sourceTypeOrTitle;
    if (Buffer.isBuffer(input)) sourceType = "excel";
    else if (typeof input === "string" && input.trim().startsWith("[")) sourceType = "json";
    else if (typeof input === "string" && input.includes("|") && input.includes("\n")) sourceType = "markdown";
    else sourceType = "csv";
  }

  if (sourceType === "excel" || Buffer.isBuffer(input)) {
    const workbook = XLSX.read(input, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json(sheet);
    if (rows.length > 0) {
      columns = Object.keys(rows[0]);
    }
  } else if (sourceType === "json" || (typeof input === "string" && input.trim().startsWith("["))) {
    try {
      const parsed = JSON.parse(input as string);
      if (Array.isArray(parsed) && parsed.length > 0) {
        rows = parsed;
        columns = Object.keys(rows[0]);
      }
    } catch {
      // Fallback to text parsing
      const res = parseTextOrCsv(input as string);
      rows = res.rows;
      columns = res.columns;
    }
  } else if (typeof input === "string" && input.includes("|") && input.includes("\n")) {
    // Markdown table
    const res = parseMarkdownTable(input);
    rows = res.rows;
    columns = res.columns;
  } else if (typeof input === "string") {
    // CSV or delimited text
    const res = parseTextOrCsv(input);
    rows = res.rows;
    columns = res.columns;
  }

  // Detect column types
  const columnTypes: Record<string, "string" | "number" | "date" | "boolean"> = {};
  for (const col of columns) {
    columnTypes[col] = inferColumnType(rows.map((r) => r[col]));
  }

  // Cast values to inferred types
  const normalizedRows = rows.map((row) => {
    const newRow: Record<string, any> = {};
    for (const col of columns) {
      const rawVal = row[col];
      const type = columnTypes[col];
      if (type === "number") {
        const num = parseFloat(String(rawVal).replace(/[^0-9.-]/g, ""));
        newRow[col] = isNaN(num) ? 0 : num;
      } else if (type === "date") {
        newRow[col] = String(rawVal);
      } else {
        newRow[col] = rawVal !== undefined && rawVal !== null ? String(rawVal) : "";
      }
    }
    return newRow;
  });

  const dataset: ParsedDataset = {
    id: `ds-${Date.now()}`,
    title: datasetTitle,
    columns,
    columnTypes,
    rows: normalizedRows,
    totalRows: normalizedRows.length,
    sourceType,
  };

  // Precompute statistics for numerical columns
  const statistics: Record<string, any> = {};
  for (const [col, type] of Object.entries(columnTypes)) {
    if (type === "number") {
      const nums = normalizedRows.map((r) => r[col]);
      statistics[col] = calculateColumnStatistics(nums, col);
    }
  }
  dataset.statistics = statistics;

  // Precompute correlation if multiple numeric columns exist
  const numericCount = Object.values(columnTypes).filter((t) => t === "number").length;
  if (numericCount >= 2 && normalizedRows.length >= 3) {
    dataset.correlation = calculateCorrelationMatrix(dataset);
  }

  return dataset;
}

function parseTextOrCsv(text: string): { rows: Record<string, any>[]; columns: string[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return { rows: [], columns: [] };

  const delimiter = lines[0].includes("\t")
    ? "\t"
    : lines[0].includes(";")
    ? ";"
    : ",";

  const rawHeaders = splitCsvLine(lines[0], delimiter);
  const columns = rawHeaders.map((h, i) => h.trim().replace(/^["']|["']$/g, "") || `Column_${i + 1}`);

  const rows: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i], delimiter);
    if (values.length === 0) continue;
    const row: Record<string, any> = {};
    columns.forEach((col, idx) => {
      let val = values[idx] !== undefined ? values[idx].trim().replace(/^["']|["']$/g, "") : "";
      row[col] = val;
    });
    rows.push(row);
  }

  return { rows, columns };
}

function parseMarkdownTable(text: string): { rows: Record<string, any>[]; columns: string[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|") && l.endsWith("|"));

  if (lines.length < 3) return { rows: [], columns: [] };

  const headerLine = lines[0];
  const columns = headerLine
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean);

  const rows: Record<string, any>[] = [];
  // Skip line 0 (headers) and line 1 (|---|---| separator)
  for (let i = 2; i < lines.length; i++) {
    const values = lines[i]
      .split("|")
      .map((c) => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    if (values.length === 0) continue;
    const row: Record<string, any> = {};
    columns.forEach((col, idx) => {
      row[col] = values[idx] !== undefined ? values[idx] : "";
    });
    rows.push(row);
  }

  return { rows, columns };
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function inferColumnType(values: any[]): "string" | "number" | "date" | "boolean" {
  let numCount = 0;
  let dateCount = 0;
  let boolCount = 0;
  let validCount = 0;

  for (const v of values) {
    if (v === null || v === undefined || v === "") continue;
    validCount++;
    const s = String(v).trim();

    if (s.toLowerCase() === "true" || s.toLowerCase() === "false") {
      boolCount++;
    } else if (/^-?\$?[0-9,]+(?:\.[0-9]+)?%?$/.test(s)) {
      numCount++;
    } else if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(s) || /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(s)) {
      dateCount++;
    }
  }

  if (validCount === 0) return "string";
  if (numCount / validCount > 0.7) return "number";
  if (dateCount / validCount > 0.7) return "date";
  if (boolCount / validCount > 0.7) return "boolean";
  return "string";
}

/**
 * Extracts tabular CSV, Markdown table, or JSON from mixed natural language message text.
 */
export function extractTabularDataFromText(text: string): string | null {
  if (!text) return null;

  // 1. Check for markdown table: | Col 1 | Col 2 |
  const mdMatch = text.match(/(\|.+?\|\s*\n\|[-:\s|]+?\|\s*\n(?:\|.+?\|\s*\n?)+)/);
  if (mdMatch) return mdMatch[1].trim();

  // 2. Check for fenced code blocks containing csv, json, or text
  const codeBlockMatch = text.match(/```(?:csv|json|text)?\s*([\s\S]+?)\s*```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // 3. Check for lines with comma-separated values (at least 2 lines)
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const csvLines = lines.filter((l) => l.includes(",") && !l.startsWith("http") && !l.startsWith("https"));
  if (csvLines.length >= 2) return csvLines.join("\n");

  // 4. Check for JSON array of objects
  const jsonMatch = text.match(/\[\s*\{[\s\S]+\}\s*\]/);
  if (jsonMatch) return jsonMatch[0].trim();

  return null;
}
