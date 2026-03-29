'use client';

import { getBeverageConfig, BeverageConfig } from '@/config/beverages';

// Hook to get current beverage configuration
// This allows components to access beverage-specific settings
export function useBeverageConfig(): BeverageConfig {
  return getBeverageConfig();
}

// Re-export types for convenience
export type { BeverageConfig, BeverageType } from '@/config/beverages';
