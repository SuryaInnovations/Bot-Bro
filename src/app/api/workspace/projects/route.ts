import { NextRequest, NextResponse } from "next/server";
import {
  addProjectMember,
  getProjectPermissions,
  removeProjectMember,
  updateProjectPermissions,
  verifyProjectAccess,
} from "@/lib/workspace/project-sharing";
import { ProjectRole } from "@/lib/workspace/workspace-types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId") || "user-default";

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "projectId query parameter is required" },
        { status: 400 }
      );
    }

    const access = verifyProjectAccess(projectId, userId, "viewer");
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: access.reason || "Unauthorized access to project" },
        { status: 403 }
      );
    }

    const permissions = getProjectPermissions(projectId);
    return NextResponse.json({
      success: true,
      permissions,
      userRole: access.role,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve project permissions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = "add_member", // "add_member", "remove_member", "update_settings"
      projectId,
      userEmail,
      role = "viewer",
      isPublic,
      allowComments,
      allowExport,
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "projectId is required" },
        { status: 400 }
      );
    }

    if (action === "add_member") {
      if (!userEmail) {
        return NextResponse.json(
          { success: false, error: "userEmail is required to add member" },
          { status: 400 }
        );
      }
      const updated = addProjectMember(projectId, userEmail, role as ProjectRole);
      return NextResponse.json({ success: true, permissions: updated });
    }

    if (action === "remove_member") {
      if (!userEmail) {
        return NextResponse.json(
          { success: false, error: "userEmail is required to remove member" },
          { status: 400 }
        );
      }
      const updated = removeProjectMember(projectId, userEmail);
      return NextResponse.json({ success: true, permissions: updated });
    }

    if (action === "update_settings") {
      const updated = updateProjectPermissions(projectId, {
        isPublic,
        allowComments,
        allowExport,
      });
      return NextResponse.json({ success: true, permissions: updated });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update project settings" },
      { status: 500 }
    );
  }
}
