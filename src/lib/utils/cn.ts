import { clsx, type ClassValue } from "clsx";

/** Combina clases condicionalmente. Wrapper fino sobre clsx. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
