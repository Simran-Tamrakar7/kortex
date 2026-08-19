import { Priority } from '@kortex/shared';

export interface SLACalculationResult {
  isBreached: boolean;
  remainingMinutes: number;
  targetDate: Date;
}

export function calculateTaskSLA(
  createdAt: Date,
  priority: Priority,
  slaConfig: {
    firstResponseMinutes: number;
    resolutionMinutes: number;
    priorityModifiers?: Record<string, number>;
  } | null,
  isResolved: boolean = false
): SLACalculationResult | null {
  if (!slaConfig) return null;

  const modifiers: Record<string, number> = slaConfig.priorityModifiers || {
    URGENT: 0.25,
    HIGH: 0.5,
    MEDIUM: 1.0,
    LOW: 2.0,
  };

  const multiplier = modifiers[priority] || 1.0;
  const targetMinutes = Math.round(slaConfig.resolutionMinutes * multiplier);

  const targetDate = new Date(createdAt.getTime() + targetMinutes * 60 * 1000);
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const remainingMinutes = Math.round(diffMs / (1000 * 60));

  return {
    isBreached: !isResolved && remainingMinutes <= 0,
    remainingMinutes: Math.max(0, remainingMinutes),
    targetDate,
  };
}
