import { NextRequest, NextResponse } from "next/server";
import { parseDataset, extractTabularDataFromText } from "@/lib/analytics/data-parser";
import { selectOptimalChart } from "@/lib/analytics/chart-selector";
import { buildChartSpecification } from "@/lib/analytics/echarts-generator";
import { ChartType } from "@/lib/analytics/data-types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      data,
      text,
      chartType,
      title,
      query = "",
      xAxisColumn,
      yAxisColumns,
      theme = "dark",
    } = body;

    let rawDataString = "";

    if (data) {
      if (typeof data === "string") {
        rawDataString = data;
      } else if (Array.isArray(data)) {
        rawDataString = JSON.stringify(data);
      } else if (typeof data === "object") {
        rawDataString = JSON.stringify(data);
      }
    } else if (text) {
      const extracted = extractTabularDataFromText(text);
      if (extracted) {
        rawDataString = extracted;
      } else {
        rawDataString = text;
      }
    }

    if (!rawDataString || !rawDataString.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "No tabular or numerical data provided for visualization.",
        },
        { status: 400 }
      );
    }

    // Parse into structured dataset with mathematical statistics
    const dataset = parseDataset(rawDataString, title || "Dataset Analysis");

    if (dataset.columns.length === 0 || dataset.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not detect tabular rows and columns in the provided data.",
        },
        { status: 400 }
      );
    }

    // Select optimal chart or use requested chart type
    const selectedConfig = selectOptimalChart(
      dataset,
      query || text || "",
      chartType as ChartType | undefined
    );

    if (xAxisColumn && dataset.columns.includes(xAxisColumn)) {
      selectedConfig.xAxisColumn = xAxisColumn;
    }
    if (Array.isArray(yAxisColumns) && yAxisColumns.length > 0) {
      selectedConfig.yAxisColumns = yAxisColumns.filter((c) =>
        dataset.columns.includes(c)
      );
    }
    if (title) {
      selectedConfig.title = title;
    }

    // Build complete ECharts specification
    const spec = buildChartSpecification(
      selectedConfig,
      dataset,
      theme === "light" ? "light" : "dark"
    );

    return NextResponse.json({
      success: true,
      spec,
      dataset: {
        id: dataset.id,
        title: dataset.title,
        columns: dataset.columns,
        columnTypes: dataset.columnTypes,
        totalRows: dataset.totalRows,
        sourceType: dataset.sourceType,
      },
      statistics: dataset.statistics,
      insights: spec.insights,
      suggestedFollowUps: spec.suggestedFollowUps,
    });
  } catch (error: any) {
    console.error("Data visualization API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process data visualization request.",
      },
      { status: 500 }
    );
  }
}
