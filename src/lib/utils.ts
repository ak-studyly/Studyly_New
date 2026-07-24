import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import type { MaterialType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPostTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";
  if (Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000)
    return formatDistanceToNow(date, { addSuffix: true });
  return format(date, "MMM d, yyyy");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  notes:      "notes",
  past_paper: "past paper",
  slides:     "slides",
  summary:    "summary",
};

export const MATERIAL_TYPE_STYLES: Record<MaterialType, string> = {
  notes:      "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  past_paper: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  slides:     "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  summary:    "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200",
};

export const BRANCHES = [
  "Computer Science and Engineering",
  "Electronics and Communication Engineering",
  "AI/ML",
  "Mechanical",
  "Civil",
];

export const YEARS = [
  { value: 1, label: "1st year" },
  { value: 2, label: "2nd year" },
  { value: 3, label: "3rd year" },
  { value: 4, label: "4th year" },
];

export const CLASS_KEY = "studyly_class";
