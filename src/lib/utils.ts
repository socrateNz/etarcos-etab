import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// ============================================
// TAILWIND
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// DATES
// ============================================

export function formatDate(
  date: string | Date | null | undefined,
  fmt = "dd/MM/yyyy"
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: fr });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, "dd/MM/yyyy à HH:mm");
}

export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

export function formatAcademicYear(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return `${format(start, "yyyy")}–${format(end, "yyyy")}`;
}

// ============================================
// NUMBERS & CURRENCY
// ============================================

export function formatCurrency(
  amount: number,
  currency = "XAF",
  locale = "fr-CM"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("fr-FR")} ${currency}`;
  }
}

export function formatNumber(
  num: number,
  locale = "fr-FR"
): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ============================================
// STRINGS
// ============================================

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

// ============================================
// GRADES & ACADEMIC
// ============================================

export function getMention(average: number, maxGrade = 20): string {
  const pct = (average / maxGrade) * 20;
  if (pct >= 18) return "Très Bien";
  if (pct >= 16) return "Bien";
  if (pct >= 14) return "Assez Bien";
  if (pct >= 12) return "Passable";
  if (pct >= 10) return "Suffisant";
  return "Insuffisant";
}

export function getMentionColor(average: number, maxGrade = 20): string {
  const pct = (average / maxGrade) * 20;
  if (pct >= 16) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 14) return "text-blue-600 dark:text-blue-400";
  if (pct >= 12) return "text-amber-600 dark:text-amber-400";
  if (pct >= 10) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

export function formatGrade(value: number, maxValue = 20): string {
  return `${value.toFixed(2)}/${maxValue}`;
}

// ============================================
// FILES
// ============================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

// ============================================
// COLORS
// ============================================

export function hashToColor(str: string): string {
  const colors = [
    "#6366f1", "#8b5cf6", "#06b6d4", "#10b981",
    "#f59e0b", "#ef4444", "#ec4899", "#14b8a6",
    "#f97316", "#84cc16",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ============================================
// URL HELPERS
// ============================================

export function buildSearchParams(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
}

// ============================================
// VALIDATION
// ============================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^[+]?[\d\s\-()]{8,}$/.test(phone);
}

// ============================================
// RANDOM
// ============================================

export function generateStudentNumber(prefix = "EL"): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${prefix}${year}${random}`;
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const ts = now.getTime().toString().slice(-8);
  return `REC${ts}`;
}

// ============================================
// DELAY
// ============================================

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
