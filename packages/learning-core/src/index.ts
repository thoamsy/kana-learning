export type ReviewRating = 0 | 1 | 2 | 3;
export const INITIAL_EASE = 2.5;
export const INITIAL_INTERVAL_DAYS = 1;

export interface ScheduleInput {
  ease: number;
  intervalDays: number;
  rating: ReviewRating;
}

export interface ScheduleOutput {
  ease: number;
  intervalDays: number;
}

export function scheduleNext(input: ScheduleInput): ScheduleOutput {
  if (input.rating === 0) {
    return { ease: Math.max(1.3, input.ease - 0.2), intervalDays: 1 };
  }

  if (input.rating === 1) {
    return { ease: Math.max(1.3, input.ease - 0.15), intervalDays: Math.max(1, Math.round(input.intervalDays * 0.8)) };
  }

  if (input.rating === 2) {
    return { ease: input.ease, intervalDays: Math.max(1, Math.round(input.intervalDays * input.ease)) };
  }

  return {
    ease: input.ease + 0.05,
    intervalDays: Math.max(1, Math.round(input.intervalDays * (input.ease + 0.15))),
  };
}

export function addDaysIso(fromIso: string, days: number): string {
  const date = new Date(fromIso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}
