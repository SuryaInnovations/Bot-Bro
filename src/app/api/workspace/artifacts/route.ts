import { NextRequest, NextResponse } from "next/server";
import {
  exportArtifact,
  getArtifactVersions,
  recordArtifactVersion,
  rollbackArtifactVersion,
} from "@/lib/workspace/artifact-exporter";
import { ArtifactExportFormat } from "@/lib/workspace/workspace-types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const artifactId = searchParams.get("artifactId");

    if (!artifactId) {
      return NextResponse.json(
        { success: false, error: "artifactId query parameter is required" },
        { status: 400 }
      );
    }

    const versions = getArtifactVersions(artifactId);
    return NextResponse.json({
      success: true,
      artifactId,
      versions,
      count: versions.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve artifact versions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = "export", // "version", "rollback", "export"
      artifactId,
      title,
      type,
      content,
      language,
      changeDescription,
      targetVersion,
      format = "markdown",
    } = body;

    if (action === "version") {
      if (!artifactId || !content) {
        return NextResponse.json(
          { success: false, error: "artifactId and content are required to record version" },
          { status: 400 }
        );
      }
      const record = recordArtifactVersion(
        artifactId,
        title || "Artifact",
        type || "text/plain",
        content,
        changeDescription,
        language
      );
      return NextResponse.json({ success: true, version: record });
    }

    if (action === "rollback") {
      if (!artifactId || !targetVersion) {
        return NextResponse.json(
          { success: false, error: "artifactId and targetVersion are required for rollback" },
          { status: 400 }
        );
      }
      const rolledBack = rollbackArtifactVersion(artifactId, Number(targetVersion));
      if (!rolledBack) {
        return NextResponse.json(
          { success: false, error: `Version ${targetVersion} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, version: rolledBack });
    }

    // Default: Export
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Artifact content is required for export" },
        { status: 400 }
      );
    }

    const exportResult = exportArtifact(
      {
        title: title || "Exported_Artifact",
        content,
        language,
        type,
      },
      format as ArtifactExportFormat
    );

    return NextResponse.json({
      success: true,
      export: exportResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process artifact action" },
      { status: 500 }
    );
  }
}
