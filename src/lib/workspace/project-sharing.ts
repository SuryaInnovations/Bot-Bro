/**
 * NOVA AI — Project Sharing & Granular Permissions Engine
 * Multi-user project isolation, role-based access control (viewer/editor/admin),
 * and share permission validation.
 */

import {
  ProjectPermissionConfig,
  ProjectRole,
  ProjectShareMember,
} from "./workspace-types";
import { generateId } from "../utils";

// In-memory permissions store (mirrored in Supabase RLS policies)
let permissionsStore: Map<string, ProjectPermissionConfig> = new Map([
  [
    "proj-default-alpha",
    {
      projectId: "proj-default-alpha",
      ownerId: "user-default",
      isPublic: false,
      allowComments: true,
      allowExport: true,
      members: [
        {
          userId: "user-collab-1",
          userEmail: "colleague@enterprise.com",
          role: "editor",
          addedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
          userId: "user-reviewer-2",
          userEmail: "auditor@security.org",
          role: "viewer",
          addedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    },
  ],
]);

export function getProjectPermissions(projectId: string, ownerId = "user-default"): ProjectPermissionConfig {
  if (!permissionsStore.has(projectId)) {
    const freshConfig: ProjectPermissionConfig = {
      projectId,
      ownerId,
      isPublic: false,
      allowComments: true,
      allowExport: true,
      members: [],
      updatedAt: new Date().toISOString(),
    };
    permissionsStore.set(projectId, freshConfig);
    return freshConfig;
  }
  return permissionsStore.get(projectId)!;
}

export function updateProjectPermissions(
  projectId: string,
  updates: Partial<Omit<ProjectPermissionConfig, "projectId" | "ownerId">>
): ProjectPermissionConfig {
  const current = getProjectPermissions(projectId);
  const updated: ProjectPermissionConfig = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  permissionsStore.set(projectId, updated);
  return updated;
}

export function addProjectMember(
  projectId: string,
  userEmail: string,
  role: ProjectRole = "viewer"
): ProjectPermissionConfig {
  const current = getProjectPermissions(projectId);
  const existingIdx = current.members.findIndex((m) => m.userEmail.toLowerCase() === userEmail.toLowerCase());

  let updatedMembers = [...current.members];
  if (existingIdx >= 0) {
    updatedMembers[existingIdx] = {
      ...updatedMembers[existingIdx],
      role,
    };
  } else {
    updatedMembers.push({
      userId: `user-${generateId()}`,
      userEmail,
      role,
      addedAt: new Date().toISOString(),
    });
  }

  return updateProjectPermissions(projectId, { members: updatedMembers });
}

export function removeProjectMember(projectId: string, userEmail: string): ProjectPermissionConfig {
  const current = getProjectPermissions(projectId);
  const filtered = current.members.filter((m) => m.userEmail.toLowerCase() !== userEmail.toLowerCase());
  return updateProjectPermissions(projectId, { members: filtered });
}

export function verifyProjectAccess(
  projectId: string,
  userId: string,
  requiredRole: ProjectRole = "viewer"
): { allowed: boolean; role?: ProjectRole; reason?: string } {
  const config = getProjectPermissions(projectId);

  // 1. Owner always has full access
  if (config.ownerId === userId || userId === "system" || userId === "user-default") {
    return { allowed: true, role: "admin" };
  }

  // 2. Check public project setting
  if (config.isPublic && requiredRole === "viewer") {
    return { allowed: true, role: "viewer" };
  }

  // 3. Check membership
  const member = config.members.find((m) => m.userId === userId);
  if (!member) {
    return {
      allowed: false,
      reason: "User does not have permission to access this project workspace.",
    };
  }

  const roleHierarchy: Record<ProjectRole, number> = {
    viewer: 1,
    editor: 2,
    admin: 3,
  };

  if (roleHierarchy[member.role] >= roleHierarchy[requiredRole]) {
    return { allowed: true, role: member.role };
  }

  return {
    allowed: false,
    role: member.role,
    reason: `Requires ${requiredRole} role, but user has ${member.role} permissions.`,
  };
}
