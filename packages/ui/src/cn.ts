import { clsx, type ClassValue } from "clsx";

/** Tiny class-name joiner. Kept dependency-light on purpose (no tailwind-merge). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
