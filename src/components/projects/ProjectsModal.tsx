"use client";

import React, { useState } from "react";
import { X, Folder, Plus, Trash2, Edit2, FileText, Check } from "lucide-react";
import { Project } from "@/types";

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onCreateProject: (proj: { name: string; description: string; instructions: string }) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onSelectProject: (id: string) => void;
  activeProjectId?: string;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  projects,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onSelectProject,
  activeProjectId,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateProject({
        name: name.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
      });
      setName("");
      setDescription("");
      setInstructions("");
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-dropdown overflow-hidden z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-nova-500" />
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Projects & Knowledge
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {isCreating ? (
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Next.js SaaS Architecture"
                  required
                  className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-nova-500"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the project goal"
                  className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-nova-500"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  Custom System Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Specific rules, coding standards, or domain knowledge for this project..."
                  rows={4}
                  className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-nova-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-nova-500 text-white font-medium hover:bg-nova-600 transition"
                >
                  Create Project
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[var(--text-muted)]">
                  Organize conversations and customize Claude with dedicated project instructions.
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nova-500 text-white font-medium hover:bg-nova-600 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project</span>
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="py-10 text-center text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-2xl">
                  No projects yet. Create your first project to organize chats and files.
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                        activeProjectId === proj.id
                          ? "border-nova-500 bg-nova-500/10"
                          : "border-[var(--border)] bg-[var(--surface-subtle)]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-nova-500/10 text-nova-500 flex items-center justify-center shrink-0">
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <h4 className="font-semibold text-xs text-[var(--foreground)] truncate">
                            {proj.name}
                          </h4>
                          {proj.description && (
                            <p className="text-[11px] text-[var(--text-muted)] truncate">
                              {proj.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            onSelectProject(proj.id);
                            onClose();
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                            activeProjectId === proj.id
                              ? "bg-nova-500 text-white"
                              : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
                          }`}
                        >
                          {activeProjectId === proj.id ? "Selected" : "Select"}
                        </button>
                        <button
                          onClick={() => onDeleteProject(proj.id)}
                          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-rose-500 transition"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
