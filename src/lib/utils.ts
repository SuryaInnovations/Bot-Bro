import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function groupConversationsByDate<T extends { updatedAt: string }>(
  items: T[]
): { label: string; items: T[] }[] {
  const groups: { [key: string]: T[] } = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    "Previous 30 Days": [],
    Older: [],
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOf7Days = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const startOf30Days = startOfToday - 30 * 24 * 60 * 60 * 1000;

  items.forEach((item) => {
    const time = new Date(item.updatedAt).getTime();
    if (time >= startOfToday) {
      groups["Today"].push(item);
    } else if (time >= startOfYesterday) {
      groups["Yesterday"].push(item);
    } else if (time >= startOf7Days) {
      groups["Previous 7 Days"].push(item);
    } else if (time >= startOf30Days) {
      groups["Previous 30 Days"].push(item);
    } else {
      groups["Older"].push(item);
    }
  });

  return Object.entries(groups)
    .filter(([_, list]) => list.length > 0)
    .map(([label, items]) => ({ label, items }));
}

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // Rule of thumb: ~4 characters per token in English
  return Math.ceil(text.length / 4);
}
