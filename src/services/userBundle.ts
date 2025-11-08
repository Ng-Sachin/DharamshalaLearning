import { GoalService, ReflectionService, AttendanceService, LeaveService, EnhancedPairProgrammingService, MenteeReviewService } from './dataServices';
import { queryCache, CACHE_TTL } from '../utils/cache';
import { DailyGoal, DailyReflection, Attendance } from '../types';

export interface UserBundle {
  recentGoals: DailyGoal[];
  reflections: DailyReflection[];
  attendance: Attendance[];
  leaves: any[];
  pairProgrammingSessions: any[];
  latestReview: any | null;
  reviewHistory: any[];
}

/**
 * Aggregates hot-path queries for a user into a single cached call.
 * Cache key: bundle:user:<id>:v1 (adjust version when shape changes)
 */
export async function getUserBundle(userId: string): Promise<UserBundle> {
  return queryCache.get<UserBundle>(
    `bundle:user:${userId}:v1`,
    async () => {
      const [recentGoals, reflections, attendance, leaves, sessions, latestReview] = await Promise.all([
        GoalService.getGoalsByStudent(userId, 10),
        ReflectionService.getReflectionsByStudent(userId),
        AttendanceService.getStudentAttendance(userId),
        LeaveService.getStudentLeaves(userId),
        EnhancedPairProgrammingService.getSessionsByUser(userId, 'mentee').catch(() => []),
        MenteeReviewService.getLatestReview(userId).catch(() => null)
      ]);

      const reviewHistory = latestReview ? await MenteeReviewService.getReviewsByStudent(userId) : [];

      return {
        recentGoals,
        reflections,
        attendance,
        leaves,
        pairProgrammingSessions: sessions,
        latestReview,
        reviewHistory
      };
    },
    CACHE_TTL.SHORT
  );
}

// Simple invalidators that can be called after writes
export function invalidateUserBundle(userId: string) {
  queryCache.invalidate(`bundle:user:${userId}:v1`);
}
