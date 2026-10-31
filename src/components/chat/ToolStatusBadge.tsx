"use client";

import React from "react";
import { Globe, Terminal, Box, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { ToolExecution } from "@/types";

interface ToolStatusBadgeProps {
  tool: ToolExecution;
}

export const ToolStatusBadge: React.FC<ToolStatusBadgeProps> = ({ tool }) => {
  const getToolIcon = () => {
    switch (tool.name) {
      case "web_search":
      case "web_fetch":
        return <Globe className="w-3.5 h-3.5 text-blue-500" />;
      case "execute_code":
        return <Terminal className="w-3.5 h-3.5 text-amber-500" />;
      case "create_artifact":
        return <Box className="w-3.5 h-3.5 text-nova-500" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  const getToolTitle = () => {
    switch (tool.name) {
      case "web_search":
        return tool.input?.query
          ? `Searching web for "${tool.input.query}"`
          : "Searching the web";
      case "web_fetch":
        return tool.input?.url
          ? `Reading webpage: ${tool.input.url}`
          : "Fetching webpage content";
      case "execute_code":
        return `Executing ${tool.input?.language || "code"} in sandbox`;
      case "create_artifact":
        return `Creating artifact: "${tool.input?.title || "Component"}"`;
      default:
        return `Executing tool ${tool.name}`;
    }
  };

  return (
    <div className="my-1.5 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--foreground)]">
      {getToolIcon()}
      <span className="font-medium text-[11px] truncate max-w-sm">{getToolTitle()}</span>
      <div className="ml-1">
        {tool.status === "running" || tool.status === "pending" ? (
          <Loader2 className="w-3 h-3 animate-spin text-nova-500" />
        ) : tool.status === "completed" ? (
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        ) : (
          <AlertCircle className="w-3 h-3 text-rose-500" />
        )}
      </div>
    </div>
  );
};
