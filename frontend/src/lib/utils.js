import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const DEPARTMENTS = [
  { value: 'management', label: 'Management', color: '#6366f1' },
  { value: 'engineering', label: 'Engineering', color: '#0ea5e9' },
  { value: 'design', label: 'Design', color: '#f59e0b' },
  { value: 'marketing', label: 'Marketing', color: '#ec4899' },
  { value: 'sales', label: 'Vertrieb', color: '#10b981' },
  { value: 'hr', label: 'Personal', color: '#8b5cf6' },
  { value: 'finance', label: 'Finanzen', color: '#f97316' },
  { value: 'operations', label: 'Betrieb', color: '#14b8a6' },
  { value: 'it', label: 'IT', color: '#3b82f6' },
  { value: 'other', label: 'Sonstiges', color: '#6b7280' }
];

const DEPT_STORAGE_KEY = 'organigramm_departments';

export function getDepartments() {
  try {
    const stored = JSON.parse(localStorage.getItem(DEPT_STORAGE_KEY) || 'null');
    if (!stored) return DEPARTMENTS.map(d => ({ ...d }));
    return DEPARTMENTS.map(d => ({
      ...d,
      label: stored[d.value]?.label ?? d.label,
      color: stored[d.value]?.color ?? d.color
    }));
  } catch {
    return DEPARTMENTS.map(d => ({ ...d }));
  }
}

export function saveDepartments(departments) {
  const map = {};
  departments.forEach(d => { map[d.value] = { label: d.label, color: d.color }; });
  localStorage.setItem(DEPT_STORAGE_KEY, JSON.stringify(map));
}

export function getDepartmentColor(value) {
  return getDepartments().find(d => d.value === value)?.color ?? '#6b7280';
}
