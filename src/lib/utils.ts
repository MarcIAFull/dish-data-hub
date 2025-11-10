import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a URL-friendly slug from a string
 * Removes accents, special characters, tabs, and normalizes spacing
 */
export function generateSlug(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .toLowerCase()
    .normalize('NFD')                      // Decompõe acentos (é → e + ́)
    .replace(/[\u0300-\u036f]/g, '')       // Remove marcas diacríticas
    .replace(/[^a-z0-9\s-]/g, '')          // Remove especiais (incluindo tabs!)
    .replace(/\s+/g, '-')                  // Espaços → hífens
    .replace(/-+/g, '-')                   // Remove hífens duplicados
    .replace(/^-+|-+$/g, '')               // Remove hífens nas pontas
    .trim();
}

/**
 * Checks if a slug is valid (only lowercase letters, numbers, and hyphens)
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
