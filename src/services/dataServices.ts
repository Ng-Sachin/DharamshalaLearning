import { FirestoreService, COLLECTIONS, UserService } from './firestore';
import { PairProgrammingScheduler } from './pairProgrammingScheduler';
import { RollingQueueService } from './rollingQueueService';
import { queryCache, CACHE_TTL } from '../utils/cache';
import {
  Phase,
  Topic,
  DailyGoal,
  DailyReflection,
  PairProgrammingRequest,
  Attendance,
  MentorNote,
  LeaveRequest,
  MentorChangeRequest,
  MentorWithCapacity,
  User,
  MenteeReview,
  MentorReview,
  PairProgrammingSession,
  PairProgrammingGoal,
  MentorFeedback,
  MenteeFeedback,
  SessionCompletion,
  LeaveImpact,
  Notification,
  ReminderSettings,
  PairProgrammingStats,
} from '../types';

// Phase Service
export class PhaseService extends FirestoreService {
  static async createPhase(phaseData: Omit<Phase, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      return await this.create<Phase>(COLLECTIONS.PHASES, phaseData);
    } catch (error) {
      console.error('Error creating phase:', error);
      throw error;
    }
  }

  static async getAllPhases(): Promise<Phase[]> {
    try {
      const { queryCache, CACHE_TTL } = await import('../utils/cache');
      
      return await queryCache.get(
        'all-phases',
        async () => {
          // Get all phases without ordering (since data is small)
          const phases = await this.getAll<Phase>(COLLECTIONS.PHASES);

          // Sort by order client-side
          return phases.sort((a, b) => a.order - b.order);
        },
        CACHE_TTL.LONG // Cache for 15 minutes - phases change rarely
      );
    } catch (error) {
      console.error('Error fetching all phases:', error);
      throw error;
    }
  }

  static async getPhaseById(id: string): Promise<Phase | null> {
    try {
      return await this.getById<Phase>(COLLECTIONS.PHASES, id);
    } catch (error) {
      console.error('Error fetching phase by ID:', error);
      throw error;
    }
  }

  static async updatePhase(id: string, phaseData: Partial<Phase>): Promise<void> {
    try {
      return await this.update<Phase>(COLLECTIONS.PHASES, id, phaseData);
    } catch (error) {
      console.error('Error updating phase:', error);
      throw error;
    }
  }

  static async deletePhase(id: string): Promise<void> {
    try {
      return await this.delete(COLLECTIONS.PHASES, id);
    } catch (error) {
      console.error('Error deleting phase:', error);
      throw error;
    }
  }
}

// Topic Service
export class TopicService extends FirestoreService {
  static async createTopic(topicData: Omit<Topic, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      return await this.create<Topic>(COLLECTIONS.TOPICS, topicData);
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  }

  static async getTopicsByPhase(phaseId: string): Promise<Topic[]> {
    try {
      const { queryCache, CACHE_TTL } = await import('../utils/cache');
      
      return await queryCache.get(
        `topics-phase-${phaseId}`,
        async () => {
          // Get all topics for the phase (uses single-field index on phase_id)
          const topics = await this.getWhere<Topic>(COLLECTIONS.TOPICS, 'phase_id', '==', phaseId);

          // Sort by order client-side
          return topics.sort((a, b) => a.order - b.order);
        },
        CACHE_TTL.LONG // Cache for 15 minutes - topics change rarely
      );
    } catch (error) {
      console.error('Error fetching topics by phase:', error);
      throw error;
    }
  }

  static async getTopicById(id: string): Promise<Topic | null> {
    try {
      return await this.getById<Topic>(COLLECTIONS.TOPICS, id);
    } catch (error) {
      console.error('Error fetching topic by ID:', error);
      throw error;
    }
  }

  static async updateTopic(id: string, topicData: Partial<Topic>): Promise<void> {
    try {
      return await this.update<Topic>(COLLECTIONS.TOPICS, id, topicData);
    } catch (error) {
      console.error('Error updating topic:', error);
      throw error;
    }
  }

  static async deleteTopic(id: string): Promise<void> {
    try {
      return await this.delete(COLLECTIONS.TOPICS, id);
    } catch (error) {
      console.error('Error deleting topic:', error);
      throw error;
    }
  }
}

// Daily Goal Service
export class GoalService extends FirestoreService {
  static async getAllGoals(limit = 50, startAfter?: any): Promise<DailyGoal[]> {
    try {
      return await this.getAll<DailyGoal>(COLLECTIONS.DAILY_GOALS, 'created_at', 'desc', limit);
    } catch (error) {
      console.error('Error fetching all goals:', error);
      throw error;
    }
  }

  static async createGoal(goalData: Omit<DailyGoal, 'id'>): Promise<string> {
    try {
      const id = await this.create<DailyGoal>(COLLECTIONS.DAILY_GOALS, goalData);
      // Invalidate per-student goals cache
      queryCache.invalidate(`goals:student:${(goalData as any).student_id}`);
      return id;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  static async getGoalsByStudent(studentId: string, limit?: number): Promise<DailyGoal[]> {
    try {
      return await queryCache.get<DailyGoal[]>(
        `goals:student:${studentId}`,
        async () => {
          const goals = await this.getWhere<DailyGoal>(
            COLLECTIONS.DAILY_GOALS,
            'student_id',
            '==',
            studentId
          );
          const sorted = goals.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
          return limit ? sorted.slice(0, limit) : sorted;
        },
        CACHE_TTL.SHORT
      );
    } catch (error) {
      console.error('Error fetching goals by student:', error);
      throw error;
    }
  }

  static async getTodaysGoal(studentId: string): Promise<DailyGoal | null> {
    try {
      // Get start and end of today in UTC
      const now = new Date();
      const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));

      // Firestore Timestamp
      const { Timestamp } = await import('firebase/firestore');
      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);

      // Get all goals for the student (uses single-field index)
      const allGoals = await this.getGoalsByStudent(studentId);

      // Filter for today's goals client-side
      const todaysGoals = allGoals.filter(goal => {
        // goal.created_at is actually a Firestore Timestamp at runtime
        const goalTimestamp = goal.created_at as any;
        const goalTime = goalTimestamp.toMillis ? goalTimestamp.toMillis() : goalTimestamp.getTime();
        const startTime = startTimestamp.toMillis();
        const endTime = endTimestamp.toMillis();
        return goalTime >= startTime && goalTime < endTime;
      });

      return todaysGoals.length > 0 ? todaysGoals[0] : null;
    } catch (error) {
      console.error('Error fetching today\'s goal:', error);
      throw error;
    }
  }

  static async getPendingGoalsForMentor(mentorId: string): Promise<DailyGoal[]> {
    try {
      // This would need a compound query or client-side filtering
      // For now, we'll get all pending goals and filter client-side
      const pendingGoals = await this.getWhere<DailyGoal>(
        COLLECTIONS.DAILY_GOALS,
        'status',
        '==',
        'pending'
      );

      // Filter by mentor's students (would need student data)
      return pendingGoals;
    } catch (error) {
      console.error('Error fetching pending goals for mentor:', error);
      throw error;
    }
  }

  static async updateGoal(id: string, goalData: Partial<DailyGoal>): Promise<void> {
    try {
      return await this.update<DailyGoal>(COLLECTIONS.DAILY_GOALS, id, goalData);
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  }

  /**
   * Review a goal (approve or mark as reviewed)
   * 
   * Permissions:
   * - Admin: Can review any goal
   * - Academic Associate: Can review goals from assigned students
   * - Super Mentor / Mentor: Can review goals from assigned mentees
   * - Students: Cannot review goals (including their own)
   */
  static async reviewGoal(
    id: string,
    reviewerId: string,
    status: 'approved' | 'reviewed',
    mentorComment?: string
  ): Promise<void> {
    try {
      const { canReviewGoal } = await import('./permissions');
      const { UserService } = await import('./firestore');

      // Get the goal and reviewer user
      const goal = await this.getById<DailyGoal>(COLLECTIONS.DAILY_GOALS, id);
      if (!goal) {
        throw new Error('Goal not found');
      }

      const reviewer = await UserService.getUserById(reviewerId);
      if (!reviewer) {
        throw new Error('Reviewer not found');
      }

      console.log('🔍 Checking goal review permissions:', {
        reviewerId: reviewer.id,
        reviewerName: reviewer.name,
        reviewerRole: reviewer.role,
        isAdmin: reviewer.isAdmin,
        campus: reviewer.campus,
        goalId: goal.id,
        studentId: goal.student_id
      });

      // Check permissions
      const hasPermission = await canReviewGoal(reviewer, goal);
      if (!hasPermission) {
        console.error('❌ Permission denied for goal review:', {
          reviewerId: reviewer.id,
          reviewerRole: reviewer.role,
          goalStudentId: goal.student_id
        });
        throw new Error('You do not have permission to review this goal');
      }

      console.log('✅ Permission granted for goal review');

      return await this.updateGoal(id, {
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        ...(mentorComment ? { mentor_comment: mentorComment } : {})
      });
    } catch (error) {
      console.error('Error reviewing goal:', error);
      throw error;
    }
  }

  static async getGoalsByTopicAndStudent(topicId: string, studentId: string): Promise<DailyGoal[]> {
    try {
      // Get all goals for the student, then filter by topic client-side
      const studentGoals = await this.getGoalsByStudent(studentId);
      return studentGoals.filter(goal => goal.topic_id === topicId);
    } catch (error) {
      console.error('Error fetching goals by topic and student:', error);
      throw error;
    }
  }
}

// Daily Reflection Service
export class ReflectionService extends FirestoreService {
  static async getAllReflections(limit = 50, startAfter?: any): Promise<DailyReflection[]> {
    try {
      return await this.getAll<DailyReflection>(COLLECTIONS.DAILY_REFLECTIONS, 'created_at', 'desc', limit);
    } catch (error) {
      console.error('Error fetching all reflections:', error);
      throw error;
    }
  }

  static async createReflection(reflectionData: Omit<DailyReflection, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const id = await this.create<DailyReflection>(COLLECTIONS.DAILY_REFLECTIONS, reflectionData as any);
      queryCache.invalidate(`reflections:student:${(reflectionData as any).student_id}`);
      return id;
    } catch (error) {
      console.error('Error creating reflection:', error);
      throw error;
    }
  }

  static async getReflectionsByStudent(studentId: string): Promise<DailyReflection[]> {
    try {
      return await queryCache.get<DailyReflection[]>(
        `reflections:student:${studentId}`,
        async () => {
          const reflections = await this.getWhere<DailyReflection>(
            COLLECTIONS.DAILY_REFLECTIONS,
            'student_id',
            '==',
            studentId
          );
          return reflections.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        },
        CACHE_TTL.SHORT
      );
    } catch (error) {
      console.error('Error fetching reflections by student:', error);
      throw error;
    }
  }

  static async getReflectionByGoal(goalId: string): Promise<DailyReflection | null> {
    try {
      const reflections = await this.getWhere<DailyReflection>(
        COLLECTIONS.DAILY_REFLECTIONS,
        'goal_id',
        '==',
        goalId
      );
      return reflections.length > 0 ? reflections[0] : null;
    } catch (error) {
      console.error('Error fetching reflection by goal:', error);
      throw error;
    }
  }

  static async getPendingReflectionsForMentor(mentorId: string): Promise<DailyReflection[]> {
    try {
      return await this.getWhere<DailyReflection>(
        COLLECTIONS.DAILY_REFLECTIONS,
        'status',
        '==',
        'pending'
      );
    } catch (error) {
      console.error('Error fetching pending reflections for mentor:', error);
      throw error;
    }
  }

  static async updateReflection(id: string, reflectionData: Partial<DailyReflection>): Promise<void> {
    try {
      return await this.update<DailyReflection>(COLLECTIONS.DAILY_REFLECTIONS, id, reflectionData);
    } catch (error) {
      console.error('Error updating reflection:', error);
      throw error;
    }
  }

  /**
   * Review a reflection (approve or mark as reviewed with notes)
   * 
   * Permissions:
   * - Admin: Can review any reflection
   * - Academic Associate: Can review reflections from assigned students
   * - Super Mentor / Mentor: Can review reflections from assigned mentees
   * - Students: Cannot review reflections (including their own)
   */
  static async reviewReflection(
    id: string,
    reviewerId: string,
    status: 'approved' | 'reviewed',
    mentorNotes?: string,
    mentorAssessment?: 'needs_improvement' | 'on_track' | 'exceeds_expectations'
  ): Promise<void> {
    try {
      const { canReviewReflection } = await import('./permissions');
      const { UserService } = await import('./firestore');

      // Get the reflection and reviewer user
      const reflection = await this.getById<DailyReflection>(COLLECTIONS.DAILY_REFLECTIONS, id);
      if (!reflection) {
        throw new Error('Reflection not found');
      }

      const reviewer = await UserService.getUserById(reviewerId);
      if (!reviewer) {
        throw new Error('Reviewer not found');
      }

      console.log('🔍 Checking reflection review permissions:', {
        reviewerId: reviewer.id,
        reviewerName: reviewer.name,
        reviewerRole: reviewer.role,
        isAdmin: reviewer.isAdmin,
        campus: reviewer.campus,
        reflectionId: reflection.id,
        studentId: reflection.student_id
      });

      // Check permissions
      const hasPermission = await canReviewReflection(reviewer, reflection);
      if (!hasPermission) {
        console.error('❌ Permission denied for reflection review:', {
          reviewerId: reviewer.id,
          reviewerRole: reviewer.role,
          reflectionStudentId: reflection.student_id
        });
        throw new Error('You do not have permission to review this reflection');
      }

      console.log('✅ Permission granted for reflection review');

      const updateData: Partial<DailyReflection> = {
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        feedback_given_at: new Date()
      };

      // Only add mentor_notes if it is not undefined or null (Firestore doesn't allow undefined)
      if (typeof mentorNotes !== 'undefined' && mentorNotes !== null) {
        updateData.mentor_notes = mentorNotes;
      }

      if (mentorAssessment) {
        updateData.mentor_assessment = mentorAssessment;
      }

      return await this.updateReflection(id, updateData);
    } catch (error) {
      console.error('Error reviewing reflection:', error);
      throw error;
    }
  }

  static async markReflectionAsRead(id: string): Promise<void> {
    try {
      return await this.updateReflection(id, {
        is_read_by_student: true
      });
    } catch (error) {
      console.error('Error marking reflection as read:', error);
      throw error;
    }
  }
}

// Pair Programming Service
export class PairProgrammingService extends FirestoreService {
  static async createRequest(requestData: Omit<PairProgrammingRequest, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      return await this.create<PairProgrammingRequest>(COLLECTIONS.PAIR_PROGRAMMING_REQUESTS, requestData);
    } catch (error) {
      console.error('Error creating pair programming request:', error);
      throw error;
    }
  }

  static async getRequestsByStudent(studentId: string): Promise<PairProgrammingRequest[]> {
    try {
      // Get without ordering to avoid composite index requirement
      const requests = await this.getWhere<PairProgrammingRequest>(
        COLLECTIONS.PAIR_PROGRAMMING_REQUESTS,
        'student_id',
        '==',
        studentId
      );
      // Sort by created_at desc client-side
      return requests.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    } catch (error) {
      console.error('Error fetching requests by student:', error);
      throw error;
    }
  }

  static async getPendingRequests(): Promise<PairProgrammingRequest[]> {
    try {
      return await this.getWhere<PairProgrammingRequest>(
        COLLECTIONS.PAIR_PROGRAMMING_REQUESTS,
        'status',
        '==',
        'pending'
      );
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      throw error;
    }
  }

  static async getRequestsByMentor(mentorId: string): Promise<PairProgrammingRequest[]> {
    try {
      return await this.getWhere<PairProgrammingRequest>(
        COLLECTIONS.PAIR_PROGRAMMING_REQUESTS,
        'mentor_id',
        '==',
        mentorId
      );
    } catch (error) {
      console.error('Error fetching requests by mentor:', error);
      throw error;
    }
  }

  static async assignMentor(requestId: string, mentorId: string): Promise<void> {
    try {
      return await this.update<PairProgrammingRequest>(COLLECTIONS.PAIR_PROGRAMMING_REQUESTS, requestId, {
        mentor_id: mentorId,
        status: 'assigned',
        assigned_at: new Date()
      });
    } catch (error) {
      console.error('Error assigning mentor:', error);
      throw error;
    }
  }

  static async completeSession(requestId: string, feedback: string): Promise<void> {
    try {
      return await this.update<PairProgrammingRequest>(COLLECTIONS.PAIR_PROGRAMMING_REQUESTS, requestId, {
        status: 'completed',
        feedback,
        completed_at: new Date()
      });
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  }

  static async cancelRequest(requestId: string): Promise<void> {
    try {
      return await this.update<PairProgrammingRequest>(COLLECTIONS.PAIR_PROGRAMMING_REQUESTS, requestId, {
        status: 'cancelled'
      });
    } catch (error) {
      console.error('Error cancelling request:', error);
      throw error;
    }
  }
}

// Attendance Service
export class AttendanceService extends FirestoreService {
  static async markAttendance(attendanceData: Omit<Attendance, 'id'>): Promise<string> {
    try {
      // Check if attendance already exists for this student and date
      const existingAttendance = await this.getStudentAttendanceByDate(
        attendanceData.student_id,
        attendanceData.date
      );

      if (existingAttendance) {
        // Update existing attendance
        await this.update<Attendance>(COLLECTIONS.ATTENDANCE, existingAttendance.id, attendanceData);
        queryCache.invalidate(`attendance:student:${attendanceData.student_id}`);
        return existingAttendance.id;
      } else {
        // Create new attendance record
        const id = await this.create<Attendance>(COLLECTIONS.ATTENDANCE, attendanceData);
        queryCache.invalidate(`attendance:student:${attendanceData.student_id}`);
        return id;
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

  static async getStudentAttendanceByDate(
    studentId: string,
    date: Date
  ): Promise<Attendance | null> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Reuse cached list to avoid additional read
      const attendance = await this.getStudentAttendance(studentId);

      return attendance.find(record => {
        const recordDate = record.date instanceof Date ? record.date : new Date(record.date);
        return recordDate >= startOfDay && recordDate <= endOfDay;
      }) || null;
    } catch (error) {
      console.error('Error fetching student attendance by date:', error);
      throw error;
    }
  }

  static async getStudentAttendance(
    studentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Attendance[]> {
    try {
      return await queryCache.get<Attendance[]>(
        `attendance:student:${studentId}`,
        async () => {
          const attendanceRecords = await this.getWhere<Attendance>(
            COLLECTIONS.ATTENDANCE,
            'student_id',
            '==',
            studentId
          );
          return attendanceRecords.sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : new Date(a.date);
            const dateB = b.date instanceof Date ? b.date : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          });
        },
        CACHE_TTL.SHORT
      );
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      throw error;
    }
  }

  static async updateAttendanceStatus(
    studentId: string,
    date: Date,
    goalReviewed: boolean,
    reflectionReviewed: boolean
  ): Promise<void> {
    try {
      const attendance = await this.getStudentAttendanceByDate(studentId, date);
      
      if (attendance) {
        const presentStatus = (goalReviewed && reflectionReviewed) ? 'present' : 'absent';
        await this.update<Attendance>(COLLECTIONS.ATTENDANCE, attendance.id, {
          goal_reviewed: goalReviewed,
          reflection_reviewed: reflectionReviewed,
          present_status: presentStatus
        });
        queryCache.invalidate(`attendance:student:${studentId}`);
      } else {
        // Create new attendance record
        const presentStatus = (goalReviewed && reflectionReviewed) ? 'present' : 'absent';
        await this.markAttendance({
          student_id: studentId,
          date,
          goal_reviewed: goalReviewed,
          reflection_reviewed: reflectionReviewed,
          present_status: presentStatus,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating attendance status:', error);
      throw error;
    }
  }
}

// Leave Request Service
export class LeaveService extends FirestoreService {
  static async createLeaveRequest(leaveData: Omit<LeaveRequest, 'id'>): Promise<string> {
    try {
      return await this.create<LeaveRequest>(COLLECTIONS.LEAVE_REQUESTS, {
        ...leaveData,
        status: 'approved' // Auto-approve for now
      });
    } catch (error) {
      console.error('Error creating leave request:', error);
      throw error;
    }
  }

  static async getStudentLeaves(studentId: string): Promise<LeaveRequest[]> {
    try {
      // Remove ordering to avoid index requirement, sort client-side if needed
      const leaveRecords = await this.getWhere<LeaveRequest>(
        COLLECTIONS.LEAVE_REQUESTS,
        'student_id',
        '==',
        studentId
      );

      // Sort by start_date descending client-side
      return leaveRecords.sort((a, b) => {
        const dateA = a.start_date instanceof Date ? a.start_date : new Date(a.start_date);
        const dateB = b.start_date instanceof Date ? b.start_date : new Date(b.start_date);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error fetching student leaves:', error);
      throw error;
    }
  }

  static async getLeavesByDateRange(startDate: Date, endDate: Date): Promise<LeaveRequest[]> {
    try {
      // This would need a compound query or client-side filtering
      return await this.getAll<LeaveRequest>(COLLECTIONS.LEAVE_REQUESTS, 'start_date', 'desc');
    } catch (error) {
      console.error('Error fetching leaves by date range:', error);
      throw error;
    }
  }
}

// Mentor Notes Service
export class MentorNotesService extends FirestoreService {
  static async createNote(noteData: Omit<MentorNote, 'id'>): Promise<string> {
    try {
      return await this.create<MentorNote>(COLLECTIONS.MENTOR_NOTES, noteData);
    } catch (error) {
      console.error('Error creating mentor note:', error);
      throw error;
    }
  }

  static async getNotesByStudent(studentId: string): Promise<MentorNote[]> {
    try {
      return await this.getWhere<MentorNote>(
        COLLECTIONS.MENTOR_NOTES,
        'student_id',
        '==',
        studentId,
        'created_at',
        'desc'
      );
    } catch (error) {
      console.error('Error fetching notes by student:', error);
      throw error;
    }
  }

  static async getNotesByMentor(mentorId: string): Promise<MentorNote[]> {
    try {
      return await this.getWhere<MentorNote>(
        COLLECTIONS.MENTOR_NOTES,
        'mentor_id',
        '==',
        mentorId,
        'created_at',
        'desc'
      );
    } catch (error) {
      console.error('Error fetching notes by mentor:', error);
      throw error;
    }
  }

  static async updateNote(id: string, noteData: Partial<MentorNote>): Promise<void> {
    try {
      return await this.update<MentorNote>(COLLECTIONS.MENTOR_NOTES, id, noteData);
    } catch (error) {
      console.error('Error updating mentor note:', error);
      throw error;
    }
  }
}

// Admin Service
export class AdminService extends FirestoreService {
  // Simple in-memory cache (can be replaced with localStorage for persistence)
  static campusCache: {
    [campusId: string]: {
      students: User[];
      goals: DailyGoal[];
      reflections: DailyReflection[];
      lastFetched: number;
    }
  } = {};

  /**
   * Fetch and cache all campus data for admin dashboard/mentor tab
   * @param campusId - campus to fetch data for
   * @param forceRefresh - bypass cache and fetch fresh data
   */
  static async getCampusData(campusId: string, forceRefresh = false): Promise<{
    students: User[];
    goals: DailyGoal[];
    reflections: DailyReflection[];
    lastFetched: number;
  }> {
    try {
      const now = Date.now();
      const cache = this.campusCache[campusId];
      // Cache expires after 5 minutes
      if (!forceRefresh && cache && cache.lastFetched && now - cache.lastFetched < 5 * 60 * 1000) {
        return cache;
      }

      // If caller requests a force refresh, invalidate the global all-users cache so we fetch fresh data
      if (forceRefresh) {
        try {
          queryCache.invalidate('all-users');
        } catch (err) {
          console.warn('Failed to invalidate all-users cache:', err);
        }
      }

      // Fetch all users for campus (include everyone in the campus so they are searchable/viewable)
      // Show all users regardless of their status (active/inactive/dropout/etc.)
      const allUsers = await this.getAllUsers();
      const students = allUsers.filter(u => u.campus === campusId);

      // Fetch all goals for campus students
      const studentIds = students.map(s => s.id);
      const goals = (await GoalService.getAllGoals()).filter(g => studentIds.includes(g.student_id));

      // Fetch all reflections for campus students
      const reflections = (await ReflectionService.getAllReflections()).filter(r => studentIds.includes(r.student_id));

      // Cache results
      this.campusCache[campusId] = {
        students,
        goals,
        reflections,
        lastFetched: now,
      };

      return this.campusCache[campusId];
    } catch (error) {
      console.error('Error fetching campus data:', error);
      throw error;
    }
  }

  static invalidateCampusCache(campusId: string) {
    delete this.campusCache[campusId];
  }
  // Get all users with optional filtering
  static async getAllUsers(): Promise<any[]> {
    try {
      const { queryCache, CACHE_TTL } = await import('../utils/cache');
      
      return await queryCache.get(
        'all-users',
        async () => {
          return await this.getAll<any>(COLLECTIONS.USERS, 'created_at', 'desc');
        },
        CACHE_TTL.MEDIUM // Cache for 5 minutes
      );
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  // Update user admin status
  static async updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<void> {
    try {
      await this.update<any>(COLLECTIONS.USERS, userId, { 
        isAdmin,
        updated_at: new Date()
      });
      
      // Invalidate user caches
      const { queryCache } = await import('../utils/cache');
      queryCache.invalidate('all-users');
      queryCache.invalidate('all-mentors-with-capacity');
    } catch (error) {
      console.error('Error updating user admin status:', error);
      throw error;
    }
  }

  // Update user status
  static async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'dropout' | 'placed' | 'on_leave'): Promise<void> {
    try {
      return await this.update<any>(COLLECTIONS.USERS, userId, { 
        status,
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Update user role
  static async updateUserRole(userId: string, role: 'admin' | 'academic_associate' | 'super_mentor' | 'mentor' | 'student'): Promise<void> {
    try {
      return await this.update<any>(COLLECTIONS.USERS, userId, { 
        role,
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Delete user (soft delete by setting status to 'inactive')
  static async deleteUser(userId: string): Promise<void> {
    try {
      return await this.update<any>(COLLECTIONS.USERS, userId, { 
        status: 'inactive',
        deleted_at: new Date(),
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Permanently delete user (use with caution)
  static async permanentlyDeleteUser(userId: string): Promise<void> {
    try {
      return await this.delete(COLLECTIONS.USERS, userId);
    } catch (error) {
      console.error('Error permanently deleting user:', error);
      throw error;
    }
  }

  // Assign mentor to student
  static async assignMentor(studentId: string, mentorId: string): Promise<void> {
    try {
      // First, assign the mentor to the student
      await this.update<any>(COLLECTIONS.USERS, studentId, { 
        mentor_id: mentorId,
        updated_at: new Date()
      });

      // Then, ensure the mentor is marked as a mentor
      const { UserService } = await import('./firestore');
      const mentor = await UserService.getUserById(mentorId);
      if (mentor && !mentor.isMentor) {
        await UserService.updateUser(mentorId, {
          isMentor: true,
          updated_at: new Date()
        });
      }
      
      // Invalidate mentor caches
      const { queryCache } = await import('../utils/cache');
      queryCache.invalidate('all-users');
      queryCache.invalidate('all-mentors-with-capacity');
    } catch (error) {
      console.error('Error assigning mentor:', error);
      throw error;
    }
  }

  // Get students without mentors
  static async getStudentsWithoutMentor(): Promise<any[]> {
    try {
      const allUsers = await this.getAllUsers();
      return allUsers.filter(user => !user.mentor_id && !user.isAdmin);
    } catch (error) {
      console.error('Error getting students without mentor:', error);
      throw error;
    }
  }

  // Get potential mentors (students who can mentor others)
  static async getPotentialMentors(): Promise<any[]> {
    try {
      const allUsers = await this.getAllUsers();
      // Return all non-admin users who could potentially be mentors
      return allUsers.filter(user => !user.isAdmin);
    } catch (error) {
      console.error('Error getting potential mentors:', error);
      throw error;
    }
  }

  // Get students by mentor
  static async getStudentsByMentor(mentorId: string): Promise<any[]> {
    try {
      return await this.getWhere<any>(COLLECTIONS.USERS, 'mentor_id', '==', mentorId);
    } catch (error) {
      console.error('Error getting students by mentor:', error);
      throw error;
    }
  }

  // Get student's current phase (based on latest goal)
  static async getStudentCurrentPhase(studentId: string): Promise<string | null> {
    try {
      const goals = await GoalService.getGoalsByStudent(studentId, 1);
      return goals.length > 0 ? goals[0].phase_id : null;
    } catch (error) {
      console.error('Error getting student current phase:', error);
      throw error;
    }
  }

  // Get suggested mentors for a student based on phase progression
  static async getSuggestedMentors(studentId: string): Promise<any[]> {
    try {
      // Get student's current phase
      const studentPhaseId = await this.getStudentCurrentPhase(studentId);
      
      if (!studentPhaseId) {
        // If no phase, return all potential mentors
        return this.getPotentialMentors();
      }

      // Get all phases to determine phase order
      const phases = await PhaseService.getAllPhases();
      const studentPhase = phases.find(p => p.id === studentPhaseId);
      
      if (!studentPhase) {
        return this.getPotentialMentors();
      }

      // Get all potential mentors
      const allPotentialMentors = await this.getPotentialMentors();
      
      // Get current phase for each mentor and filter
      const mentorsWithPhases = await Promise.all(
        allPotentialMentors.map(async (mentor) => {
          const mentorPhaseId = await this.getStudentCurrentPhase(mentor.id);
          const mentorPhase = mentorPhaseId ? phases.find(p => p.id === mentorPhaseId) : null;
          
          return {
            ...mentor,
            currentPhaseId: mentorPhaseId,
            currentPhaseOrder: mentorPhase?.order || 0,
            currentPhaseName: mentorPhase?.name || 'Not Started'
          };
        })
      );

      // Filter mentors who are on the same phase or higher (higher order)
      const suggestedMentors = mentorsWithPhases.filter(
        mentor => mentor.currentPhaseOrder >= studentPhase.order
      );

      // Sort by phase order (descending) - more advanced mentors first
      return suggestedMentors.sort((a, b) => b.currentPhaseOrder - a.currentPhaseOrder);
    } catch (error) {
      console.error('Error getting suggested mentors:', error);
      return this.getPotentialMentors();
    }
  }

  // Get student's current topic and phase information
  static async getStudentCurrentTopicAndPhase(studentId: string): Promise<{ topic: string; phase: string; topicId: string; phaseId: string } | null> {
    try {
      // Get student's latest goal to determine current topic and phase
      const goals = await GoalService.getGoalsByStudent(studentId, 1);
      if (goals.length === 0) return null;

      const latestGoal = goals[0];
      const topic = await TopicService.getTopicById(latestGoal.topic_id);
      const phase = await PhaseService.getPhaseById(latestGoal.phase_id);

      if (!topic || !phase) return null;

      return {
        topic: topic.name,
        phase: phase.name,
        topicId: topic.id,
        phaseId: phase.id
      };
    } catch (error) {
      console.error('Error getting student current topic and phase:', error);
      return null;
    }
  }
}

// Mentorship Service
export class MentorshipService extends FirestoreService {
  private static MENTOR_REQUESTS_COLLECTION = 'mentor_requests';

  /**
   * Get mentor capacity information
   */
  static async getMentorCapacity(mentorId: string): Promise<MentorWithCapacity | null> {
    try {
      const { UserService } = await import('./firestore');
      
      const mentor = await UserService.getUserById(mentorId);
      if (!mentor) return null;

      // Get all students assigned to this mentor
      const mentees = await UserService.getStudentsByMentor(mentorId);
      
      // Determine max mentees: super mentors = unlimited (999), regular = max_mentees or default 2
      const maxMentees = mentor.isSuperMentor 
        ? 999 
        : (mentor.max_mentees || 2);
      
      const currentMentees = mentees.length;
      const availableSlots = mentor.isSuperMentor ? 999 : Math.max(0, maxMentees - currentMentees);

      return {
        mentor,
        current_mentees: currentMentees,
        max_mentees: maxMentees,
        available_slots: availableSlots,
        mentee_names: mentees.map(m => m.name)
      };
    } catch (error) {
      console.error('Error getting mentor capacity:', error);
      return null;
    }
  }

  /**
   * Get all mentors with capacity information (paginated)
   * @param limit - Number of mentors to fetch per page (default: 20)
   * @param startAfterDoc - Firestore document snapshot to start after (for pagination)
   * @returns Object with mentors array, hasMore flag, and lastDoc for next page
   */
  static async getMentorsWithCapacityPaginated(
    limit: number = 20,
    startAfterDoc?: any
  ): Promise<{
    mentors: MentorWithCapacity[];
    hasMore: boolean;
    lastDoc: any;
  }> {
    try {
      console.log(`🔍 MentorshipService: Loading paginated mentors (limit: ${limit})...`);
      const { UserService } = await import('./firestore');
      const { db } = await import('./firebase');
      const { collection, query, orderBy, limit: firestoreLimit, startAfter, getDocs } = await import('firebase/firestore');
      
      // Build paginated query for users collection
      let userQuery = query(
        collection(db, 'users'),
        orderBy('name', 'asc'),
        firestoreLimit(limit + 1) // Fetch one extra to check if there are more
      );
      
      // If startAfterDoc is provided, continue from that point
      if (startAfterDoc) {
        userQuery = query(
          collection(db, 'users'),
          orderBy('name', 'asc'),
          startAfter(startAfterDoc),
          firestoreLimit(limit + 1)
        );
      }
      
      const querySnapshot = await getDocs(userQuery);
      const docs = querySnapshot.docs;
      
      // Check if there are more results
      const hasMore = docs.length > limit;
      const userDocs = hasMore ? docs.slice(0, limit) : docs;
      const lastDoc = userDocs.length > 0 ? userDocs[userDocs.length - 1] : null;
      
      console.log(`📋 MentorshipService: Fetched ${userDocs.length} users, hasMore: ${hasMore}`);
      
      // Convert docs to User objects
      const users = userDocs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      // Get capacity for each user in parallel (more efficient than sequential)
      const mentorsWithCapacity = await Promise.all(
        users.map(async (user) => {
          try {
            // Get all students assigned to this user as mentor
            const mentees = await UserService.getStudentsByMentor(user.id);
            
            // Determine max mentees: super mentors = unlimited (999), regular = max_mentees or default 2
            const maxMentees = user.isSuperMentor 
              ? 999 
              : (user.max_mentees || 2);
            const currentMentees = mentees.length;
            const availableSlots = user.isSuperMentor ? 999 : Math.max(0, maxMentees - currentMentees);
            
            return {
              mentor: user,
              current_mentees: currentMentees,
              max_mentees: maxMentees,
              available_slots: availableSlots,
              mentee_names: mentees.map(m => m.name)
            };
          } catch (userError) {
            console.warn(`⚠️ MentorshipService: Error processing user ${user.id}:`, userError);
            // Return basic info if capacity check fails
            return {
              mentor: user,
              current_mentees: 0,
              max_mentees: user.isSuperMentor ? 999 : (user.max_mentees || 2),
              available_slots: user.isSuperMentor ? 999 : (user.max_mentees || 2),
              mentee_names: []
            };
          }
        })
      );
      
      console.log(`✅ MentorshipService: Processed ${mentorsWithCapacity.length} mentors with capacity`);
      
      return {
        mentors: mentorsWithCapacity,
        hasMore,
        lastDoc
      };
    } catch (error) {
      console.error('❌ MentorshipService: Error getting paginated mentors:', error);
      throw error;
    }
  }

  /**
   * Get all mentors with capacity information (backward compatible - loads all)
   * @deprecated Use getMentorsWithCapacityPaginated for better performance
   */
  static async getAllMentorsWithCapacity(): Promise<MentorWithCapacity[]> {
    try {
      console.log('🔍 MentorshipService: Loading all mentors with capacity...');
      const { queryCache, CACHE_TTL } = await import('../utils/cache');
      const { UserService } = await import('./firestore');
      
      // Use cache to avoid repeated expensive queries
      return await queryCache.get(
        'all-mentors-with-capacity',
        async () => {
          // Get all users (anyone can be a mentor)
          console.log('📋 MentorshipService: Fetching all users...');
          const allUsers = await UserService['getAll']<User>('users');
          console.log(`✅ MentorshipService: Found ${allUsers.length} users`);

          // Get capacity for each user in parallel (more efficient than sequential)
          const mentorsWithCapacity = await Promise.all(
            allUsers.map(async (user) => {
              try {
                // All users are considered as mentors
                // Get all students assigned to this user as mentor
                const mentees = await UserService.getStudentsByMentor(user.id);
                
                // Determine max mentees: super mentors = unlimited (999), regular = max_mentees or default 2
                const maxMentees = user.isSuperMentor 
                  ? 999 
                  : (user.max_mentees || 2);
                const currentMentees = mentees.length;
                const availableSlots = user.isSuperMentor ? 999 : Math.max(0, maxMentees - currentMentees);
                
                return {
                  mentor: user,
                  current_mentees: currentMentees,
                  max_mentees: maxMentees,
                  available_slots: availableSlots,
                  mentee_names: mentees.map(m => m.name)
                };
              } catch (userError) {
                console.warn(`⚠️ MentorshipService: Error processing user ${user.id}:`, userError);
                // Return basic info if capacity check fails
                return {
                  mentor: user,
                  current_mentees: 0,
                  max_mentees: user.isSuperMentor ? 999 : (user.max_mentees || 2),
                  available_slots: user.isSuperMentor ? 999 : (user.max_mentees || 2),
                  mentee_names: []
                };
              }
            })
          );

          console.log(`✅ MentorshipService: Processed ${mentorsWithCapacity.length} mentors with capacity`);
          return mentorsWithCapacity;
        },
        CACHE_TTL.MEDIUM // Cache for 5 minutes
      );
    } catch (error) {
      console.error('❌ MentorshipService: Error getting mentors with capacity:', error);
      throw error; // Re-throw to let caller handle the error
    }
  }

  /**
   * Get available mentors (with open slots)
   */
  static async getAvailableMentors(): Promise<MentorWithCapacity[]> {
    try {
      const allMentors = await this.getAllMentorsWithCapacity();
      return allMentors.filter(m => m.available_slots > 0);
    } catch (error) {
      console.error('Error getting available mentors:', error);
      return [];
    }
  }

  /**
   * Request a mentor change
   */
  static async requestMentorChange(
    studentId: string,
    requestedMentorId: string,
    currentMentorId?: string,
    reason?: string
  ): Promise<string> {
    try {
      console.log('🔧 MentorshipService.requestMentorChange called with:', {
        studentId,
        requestedMentorId,
        currentMentorId,
        reason: reason?.substring(0, 50) + '...'
      });
      
      const { UserService } = await import('./firestore');
      
      // Get student and mentor info for denormalization
      console.log('📥 Fetching student info...');
      const student = await UserService.getUserById(studentId);
      console.log('📥 Fetching requested mentor info...');
      const requestedMentor = await UserService.getUserById(requestedMentorId);
      console.log('📥 Fetching current mentor info...');
      const currentMentor = currentMentorId ? await UserService.getUserById(currentMentorId) : null;

      if (!student || !requestedMentor) {
        const error = `Student or requested mentor not found - student: ${!!student}, requestedMentor: ${!!requestedMentor}`;
        console.error('❌', error);
        throw new Error(error);
      }

      console.log('✅ All user data fetched successfully');

      // Build request data, excluding undefined values (Firebase doesn't allow undefined)
      const requestData: any = {
        student_id: studentId,
        student_name: student.name,
        student_email: student.email,
        requested_mentor_id: requestedMentorId,
        requested_mentor_name: requestedMentor.name,
        status: 'pending',
        created_at: new Date()
      };

      // Only add optional fields if they have values
      if (currentMentorId) {
        requestData.current_mentor_id = currentMentorId;
      }
      if (currentMentor?.name) {
        requestData.current_mentor_name = currentMentor.name;
      }
      if (reason) {
        requestData.reason = reason;
      }

      console.log('💾 Creating mentor request document...', requestData);
      const requestId = await this.create<MentorChangeRequest>(
        this.MENTOR_REQUESTS_COLLECTION,
        requestData
      );
      console.log('✅ Request document created with ID:', requestId);

      // Update student's pending_mentor_id
      console.log('🔄 Updating student pending_mentor_id...');
      await UserService.updateUser(studentId, {
        pending_mentor_id: requestedMentorId
      });
      console.log('✅ Student updated successfully');

      console.log('🎉 Mentor change request completed successfully');
      return requestId;
    } catch (error) {
      console.error('❌ MentorshipService.requestMentorChange error:', error);
      throw error;
    }
  }

  /**
   * Get pending mentor change requests
   */
  static async getPendingMentorRequests(): Promise<MentorChangeRequest[]> {
    try {
      return await this.getWhere<MentorChangeRequest>(
        this.MENTOR_REQUESTS_COLLECTION,
        'status',
        '==',
        'pending'
      );
    } catch (error) {
      console.error('Error getting pending requests:', error);
      return [];
    }
  }

  /**
   * Get mentor change requests for a specific student
   */
  static async getStudentMentorRequests(studentId: string): Promise<MentorChangeRequest[]> {
    try {
      return await this.getWhere<MentorChangeRequest>(
        this.MENTOR_REQUESTS_COLLECTION,
        'student_id',
        '==',
        studentId
      );
    } catch (error) {
      console.error('Error getting student requests:', error);
      return [];
    }
  }

  /**
   * Approve a mentor change request
   * 
   * Permissions:
   * - Admin: Can approve any mentor change request (global scope)
   * - Academic Associate: Can approve requests for students on their campus (campus-wide scope)
   * - Super Mentor: Can approve requests for their assigned mentees
   * - Regular Mentor: Cannot approve (must be academic associate or higher)
   * - Students: Cannot approve
   * 
   * @param requestId - The ID of the mentor change request
   * @param adminId - The ID of the user approving the request
   * @param adminRole - The role of the approver (admin, academic_associate, or super_mentor)
   * @param adminNotes - Optional notes from the approver
   */
  static async approveMentorRequest(
    requestId: string,
    adminId: string,
    adminRole: 'admin' | 'super_mentor' | 'academic_associate',
    adminNotes?: string
  ): Promise<void> {
    try {
      const { UserService } = await import('./firestore');

      // Get the request
      const request = await this.getById<MentorChangeRequest>(
        this.MENTOR_REQUESTS_COLLECTION,
        requestId
      );

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Request is not pending');
      }

      // Check mentor capacity
      const mentorCapacity = await this.getMentorCapacity(request.requested_mentor_id);
      if (!mentorCapacity || mentorCapacity.available_slots <= 0) {
        throw new Error('Mentor has no available slots');
      }

      // Enforce role-based approval rules
      if (adminRole === 'super_mentor') {
        const assignedMentees = await UserService.getAssignedMentees(adminId);
        if (!assignedMentees.includes(request.student_id)) {
          throw new Error('Super mentor can only approve requests for their assigned mentees');
        }
      } else if (adminRole === 'academic_associate') {
        const admin = await UserService.getUserById(adminId);
        const student = await UserService.getUserById(request.student_id);
        if (!admin?.campus || !student?.campus || admin.campus !== student.campus) {
          throw new Error('Academic associate can only approve requests for students on their campus');
        }
      } else if (adminRole !== 'admin') {
        // Fallback guard if an unexpected role reaches here
        throw new Error('Only academic associate or higher can approve mentor change requests');
      }

      // Update the request (conditionally include admin_notes to avoid undefined)
      const updateData: any = {
        status: 'approved',
        reviewed_at: new Date(),
        reviewed_by: adminId
      };
      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      await this.update<MentorChangeRequest>(
        this.MENTOR_REQUESTS_COLLECTION,
        requestId,
        updateData
      );

      // Update student's mentor assignment
      await UserService.updateUser(request.student_id, {
        mentor_id: request.requested_mentor_id,
        pending_mentor_id: ''  // Clear with empty string (Firebase accepts this)
      });

    } catch (error) {
      console.error('Error approving mentor request:', error);
      throw error;
    }
  }

  /**
   * Reject a mentor change request
   * 
   * Permissions:
   * - Admin: Can reject any mentor change request (global scope)
   * - Academic Associate: Can reject requests for students on their campus (campus-wide scope)
   * - Super Mentor: Can reject requests for their assigned mentees
   * - Regular Mentor: Cannot reject (must be academic associate or higher)
   * - Students: Cannot reject
   * 
   * @param requestId - The ID of the mentor change request
   * @param adminId - The ID of the user rejecting the request
   * @param adminRole - The role of the rejector (admin, academic_associate, or super_mentor)
   * @param adminNotes - Optional notes from the rejector
   */
  static async rejectMentorRequest(
    requestId: string,
    adminId: string,
    adminRole: 'admin' | 'super_mentor' | 'academic_associate',
    adminNotes?: string
  ): Promise<void> {
    try {
      const { UserService } = await import('./firestore');
      
      // Get the request
      const request = await this.getById<MentorChangeRequest>(
        this.MENTOR_REQUESTS_COLLECTION,
        requestId
      );

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Request is not pending');
      }

      // Enforce role-based rejection rules (same as approval)
      if (adminRole === 'super_mentor') {
        const assignedMentees = await UserService.getAssignedMentees(adminId);
        if (!assignedMentees.includes(request.student_id)) {
          throw new Error('Super mentor can only reject requests for their assigned mentees');
        }
      } else if (adminRole === 'academic_associate') {
        // Academic associates can reject for any student on their campus
        const admin = await UserService.getUserById(adminId);
        const student = await UserService.getUserById(request.student_id);
        if (!admin?.campus || !student?.campus || admin.campus !== student.campus) {
          throw new Error('Academic associate can only reject requests for students on their campus');
        }
      } else if (adminRole !== 'admin') {
        throw new Error('Only academic associate or higher can reject mentor change requests');
      }

      // Update the request (conditionally include admin_notes to avoid undefined)
      const updateData: any = {
        status: 'rejected',
        reviewed_at: new Date(),
        reviewed_by: adminId
      };
      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      await this.update<MentorChangeRequest>(
        this.MENTOR_REQUESTS_COLLECTION,
        requestId,
        updateData
      );

      // Clear student's pending_mentor_id
      await UserService.updateUser(request.student_id, {
        pending_mentor_id: ''  // Clear with empty string (Firebase accepts this)
      });

    } catch (error) {
      console.error('Error rejecting mentor request:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending mentor change request (student-initiated)
   */
  static async cancelMentorRequest(requestId: string, studentId: string): Promise<void> {
    try {
      const { UserService } = await import('./firestore');
      
      const request = await this.getById<MentorChangeRequest>(
        this.MENTOR_REQUESTS_COLLECTION,
        requestId
      );

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.student_id !== studentId) {
        throw new Error('Unauthorized');
      }

      if (request.status !== 'pending') {
        throw new Error('Only pending requests can be cancelled');
      }

      // Delete the request
      await this.delete(this.MENTOR_REQUESTS_COLLECTION, requestId);

      // Clear student's pending_mentor_id
      await UserService.updateUser(studentId, {
        pending_mentor_id: undefined
      });

    } catch (error) {
      console.error('Error cancelling mentor request:', error);
      throw error;
    }
  }
}

// Phase Timeline Service
export interface PhaseTimelineData {
  id: string;
  phaseId: string;
  phaseName: string;
  expectedDays: number | null;
  isStandalone: boolean;
  updatedAt: Date;
  updatedBy: string;
}

export class PhaseTimelineService extends FirestoreService {
  static async getAllPhaseTimelines(): Promise<PhaseTimelineData[]> {
    return queryCache.get(
      'phase_timelines:all',
      async () => {
        try {
          const timelines = await this.getAll<PhaseTimelineData>('phase_timelines');
          return timelines.sort((a, b) => {
            // Sort by phase order if available, otherwise by name
            const aOrder = a.phaseName.match(/Phase (\d+)/)?.[1];
            const bOrder = b.phaseName.match(/Phase (\d+)/)?.[1];
            if (aOrder && bOrder) {
              return parseInt(aOrder) - parseInt(bOrder);
            }
            return a.phaseName.localeCompare(b.phaseName);
          });
        } catch (error) {
          console.error('Error fetching phase timelines:', error);
          throw error;
        }
      },
      CACHE_TTL.LONG
    );
  }

  static async getPhaseTimelineByPhaseId(phaseId: string): Promise<PhaseTimelineData | null> {
    try {
      const timelines = await this.getWhere<PhaseTimelineData>('phase_timelines', 'phaseId', '==', phaseId);
      return timelines[0] || null;
    } catch (error) {
      console.error('Error fetching phase timeline by phase ID:', error);
      throw error;
    }
  }

  static async savePhaseTimelines(timelines: Omit<PhaseTimelineData, 'id' | 'updatedAt'>[], userId: string): Promise<void> {
    try {
      // Delete existing timelines
      const existingTimelines = await this.getAll<PhaseTimelineData>('phase_timelines');
      for (const timeline of existingTimelines) {
        await this.delete('phase_timelines', timeline.id);
      }

      // Add new timelines
      for (const timeline of timelines) {
        await this.create<PhaseTimelineData>('phase_timelines', {
          ...timeline,
          updatedAt: new Date(),
          updatedBy: userId
        });
      }
    } catch (error) {
      console.error('Error saving phase timelines:', error);
      throw error;
    }
  }

  static async updatePhaseTimeline(phaseId: string, data: Partial<Pick<PhaseTimelineData, 'expectedDays' | 'isStandalone'>>, userId: string): Promise<void> {
    try {
      const existing = await this.getPhaseTimelineByPhaseId(phaseId);
      if (existing) {
        await this.update('phase_timelines', existing.id, {
          ...data,
          updatedAt: new Date(),
          updatedBy: userId
        });
      } else {
        // Create new timeline entry
        const phase = await PhaseService.getPhaseById(phaseId);
        if (phase) {
          await this.create<PhaseTimelineData>('phase_timelines', {
            phaseId,
            phaseName: phase.name,
            expectedDays: data.expectedDays || null,
            isStandalone: data.isStandalone || false,
            updatedAt: new Date(),
            updatedBy: userId
          });
        }
      }
      // Invalidate phase timeline caches
      queryCache.invalidatePattern('phase_timelines');
    } catch (error) {
      console.error('Error updating phase timeline:', error);
      throw error;
    }
  }
}

// Mentee Review Service
export class MenteeReviewService extends FirestoreService {
  static async createReview(reviewData: Omit<MenteeReview, 'id' | 'created_at' | 'updated_at'>): Promise<MenteeReview> {
    try {
      console.log('💾 [MenteeReviewService] Creating review with data:', reviewData);
      
      // Use the base create method which handles timestamps automatically
      const docId = await this.create<MenteeReview>(COLLECTIONS.MENTEE_REVIEWS, reviewData);
      console.log('💾 [MenteeReviewService] Review created with ID:', docId);
      
      // Retrieve the created document to return the full object with converted timestamps
      const createdReview = await this.getById<MenteeReview>(COLLECTIONS.MENTEE_REVIEWS, docId);
      if (!createdReview) {
        throw new Error('Failed to retrieve created review');
      }
      
      return createdReview;
    } catch (error) {
      console.error('Error creating mentee review:', error);
      throw error;
    }
  }

  static async getReviewsByStudent(studentId: string): Promise<MenteeReview[]> {
    try {
      return await this.getWhere<MenteeReview>(
        COLLECTIONS.MENTEE_REVIEWS,
        'student_id',
        '==',
        studentId
      );
    } catch (error) {
      console.error('Error fetching mentee reviews by student:', error);
      throw error;
    }
  }

  static async getReviewsByMentor(mentorId: string): Promise<MenteeReview[]> {
    try {
      return await this.getWhere<MenteeReview>(
        COLLECTIONS.MENTEE_REVIEWS,
        'mentor_id',
        '==',
        mentorId
      );
    } catch (error) {
      console.error('Error fetching mentee reviews by mentor:', error);
      throw error;
    }
  }

  static async getLatestReview(studentId: string): Promise<MenteeReview | null> {
    try {
      console.log('🔍 [MenteeReviewService] Fetching reviews for student:', studentId);
      const reviews = await this.getWhere<MenteeReview>(
        COLLECTIONS.MENTEE_REVIEWS,
        'student_id',
        '==',
        studentId
      );
      console.log('🔍 [MenteeReviewService] Found reviews:', reviews.length, reviews);
      
      if (reviews.length === 0) return null;
      
      // Sort by created_at descending and return the latest
      const sortedReviews = reviews.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      console.log('🔍 [MenteeReviewService] Latest review:', sortedReviews[0]);
      return sortedReviews[0];
    } catch (error) {
      console.error('Error fetching latest mentee review:', error);
      throw error;
    }
  }

  static async getWeeklyReviews(weekStart: Date): Promise<MenteeReview[]> {
    try {
      // Get reviews from the current week
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      return await this.getWhereCompound<MenteeReview>(
        COLLECTIONS.MENTEE_REVIEWS,
        [
          { field: 'week_start', operator: '>=', value: weekStart },
          { field: 'week_start', operator: '<', value: weekEnd }
        ],
        'created_at',
        'desc'
      );
    } catch (error) {
      console.error('Error fetching weekly mentee reviews:', error);
      throw error;
    }
  }

  /**
   * Check if a review has already been submitted for a specific week
   * Prevents duplicate weekly submissions
   * 
   * @param studentId - Student being reviewed
   * @param mentorId - Mentor submitting the review
   * @param weekStart - Monday of the week (use getCurrentWeekStart())
   * @returns boolean - true if review already exists for this week
   */
  static async hasSubmittedThisWeek(
    studentId: string,
    mentorId: string,
    weekStart: Date
  ): Promise<boolean> {
    try {
      console.log('🔍 [MenteeReviewService] Checking for existing review:', {
        studentId,
        mentorId,
        weekStart: weekStart.toISOString()
      });

      const reviews = await this.getWhereCompound<MenteeReview>(
        COLLECTIONS.MENTEE_REVIEWS,
        [
          { field: 'student_id', operator: '==', value: studentId },
          { field: 'mentor_id', operator: '==', value: mentorId },
          { field: 'week_start', operator: '==', value: weekStart }
        ]
      );

      console.log('🔍 [MenteeReviewService] Found existing reviews:', reviews.length);
      return reviews.length > 0;
    } catch (error) {
      console.error('Error checking for existing mentee review:', error);
      throw error;
    }
  }
}

// Mentor Review Service (Students review Mentors)
export class MentorReviewService extends FirestoreService {
  static async createReview(reviewData: Omit<MentorReview, 'id' | 'created_at' | 'updated_at'>): Promise<MentorReview> {
    try {
      console.log('💾 [MentorReviewService] Creating review with data:', reviewData);
      
      const docId = await this.create<MentorReview>(COLLECTIONS.MENTOR_REVIEWS, reviewData);
      console.log('💾 [MentorReviewService] Review created with ID:', docId);
      
      const createdReview = await this.getById<MentorReview>(COLLECTIONS.MENTOR_REVIEWS, docId);
      if (!createdReview) {
        throw new Error('Failed to retrieve created review');
      }
      
      return createdReview;
    } catch (error) {
      console.error('Error creating mentor review:', error);
      throw error;
    }
  }

  static async getReviewsByMentor(mentorId: string): Promise<MentorReview[]> {
    try {
      return await this.getWhere<MentorReview>(
        COLLECTIONS.MENTOR_REVIEWS,
        'mentor_id',
        '==',
        mentorId
      );
    } catch (error) {
      console.error('Error fetching mentor reviews by mentor:', error);
      throw error;
    }
  }

  static async getReviewsByStudent(studentId: string): Promise<MentorReview[]> {
    try {
      return await this.getWhere<MentorReview>(
        COLLECTIONS.MENTOR_REVIEWS,
        'student_id',
        '==',
        studentId
      );
    } catch (error) {
      console.error('Error fetching mentor reviews by student:', error);
      throw error;
    }
  }

  static async getLatestReview(mentorId: string, studentId?: string): Promise<MentorReview | null> {
    try {
      let reviews: MentorReview[];
      
      if (studentId) {
        // Get reviews for specific mentor-student pair
        reviews = await this.getWhereCompound<MentorReview>(
          COLLECTIONS.MENTOR_REVIEWS,
          [
            { field: 'mentor_id', operator: '==', value: mentorId },
            { field: 'student_id', operator: '==', value: studentId }
          ]
        );
      } else {
        // Get all reviews for mentor
        reviews = await this.getReviewsByMentor(mentorId);
      }
      
      if (reviews.length === 0) return null;
      
      const sortedReviews = reviews.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      return sortedReviews[0];
    } catch (error) {
      console.error('Error fetching latest mentor review:', error);
      throw error;
    }
  }

  static async getWeeklyReviews(weekStart: Date): Promise<MentorReview[]> {
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      return await this.getWhereCompound<MentorReview>(
        COLLECTIONS.MENTOR_REVIEWS,
        [
          { field: 'week_start', operator: '>=', value: weekStart },
          { field: 'week_start', operator: '<', value: weekEnd }
        ],
        'created_at',
        'desc'
      );
    } catch (error) {
      console.error('Error fetching weekly mentor reviews:', error);
      throw error;
    }
  }

  /**
   * Check if a student has already submitted a review for their mentor this week
   * Prevents duplicate weekly submissions
   * 
   * @param mentorId - Mentor being reviewed
   * @param studentId - Student submitting the review
   * @param weekStart - Monday of the week (use getCurrentWeekStart())
   * @returns boolean - true if review already exists for this week
   */
  static async hasSubmittedThisWeek(
    mentorId: string,
    studentId: string,
    weekStart: Date
  ): Promise<boolean> {
    try {
      console.log('🔍 [MentorReviewService] Checking for existing review:', {
        mentorId,
        studentId,
        weekStart: weekStart.toISOString()
      });

      const reviews = await this.getWhereCompound<MentorReview>(
        COLLECTIONS.MENTOR_REVIEWS,
        [
          { field: 'mentor_id', operator: '==', value: mentorId },
          { field: 'student_id', operator: '==', value: studentId },
          { field: 'week_start', operator: '==', value: weekStart }
        ]
      );

      console.log('🔍 [MentorReviewService] Found existing reviews:', reviews.length);
      return reviews.length > 0;
    } catch (error) {
      console.error('Error checking for existing mentor review:', error);
      throw error;
    }
  }

  // Get all reviews across campus for admin table view
  static async getAllReviewsByCampus(campus: string): Promise<MentorReview[]> {
    try {
      // Get all mentor reviews, then filter by campus client-side
      const { UserService } = await import('./firestore');
      const allReviews = await this.getAll<MentorReview>(COLLECTIONS.MENTOR_REVIEWS);
      
      // Load all mentors to check campus
      const mentorIdSet = new Set(allReviews.map(r => r.mentor_id));
      const mentorIds = Array.from(mentorIdSet);
      const mentors = await Promise.all(mentorIds.map(id => UserService.getUserById(id)));
      const mentorCampusMap = new Map(mentors.map(m => [m?.id, m?.campus]));
      
      // Filter reviews for mentors on this campus
      return allReviews.filter(review => mentorCampusMap.get(review.mentor_id) === campus);
    } catch (error) {
      console.error('Error fetching mentor reviews by campus:', error);
      throw error;
    }
  }
}

// ===== ENHANCED PAIR PROGRAMMING SYSTEM SERVICES =====

// Enhanced Pair Programming Service
export class EnhancedPairProgrammingService extends FirestoreService {

  // Session Management
  static async createSession(sessionData: Omit<PairProgrammingSession, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      return await this.create<PairProgrammingSession>(COLLECTIONS.PAIR_PROGRAMMING_SESSIONS, sessionData);
    } catch (error) {
      console.error('Error creating pair programming session:', error);
      throw error;
    }
  }

  static async getSessionById(sessionId: string): Promise<PairProgrammingSession | null> {
    try {
      return await this.getById<PairProgrammingSession>(COLLECTIONS.PAIR_PROGRAMMING_SESSIONS, sessionId);
    } catch (error) {
      console.error('Error fetching session by ID:', error);
      throw error;
    }
  }

  static async updateSession(sessionId: string, updates: Partial<PairProgrammingSession>): Promise<void> {
    try {
      await this.update<PairProgrammingSession>(COLLECTIONS.PAIR_PROGRAMMING_SESSIONS, sessionId, {
        ...updates,
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  static async getSessionsByUser(userId: string, userRole: 'mentee' | 'mentor' | 'all' = 'all'): Promise<PairProgrammingSession[]> {
    try {
      // Temporarily use separate queries to avoid compound index issues
      const studentSessions = await this.getWhere<PairProgrammingSession>(
        COLLECTIONS.PAIR_PROGRAMMING_SESSIONS,
        'student_id',
        '==',
        userId
      );
      const mentorSessions = await this.getWhere<PairProgrammingSession>(
        COLLECTIONS.PAIR_PROGRAMMING_SESSIONS,
        'mentor_id',
        '==',
        userId
      );

      let allSessions = [...studentSessions, ...mentorSessions];

      // Filter by role if specified
      if (userRole === 'mentee') {
        allSessions = allSessions.filter(session => session.student_id === userId);
      } else if (userRole === 'mentor') {
        allSessions = allSessions.filter(session => session.mentor_id === userId);
      }

      return allSessions.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('Error fetching sessions by user:', error);
      throw error;
    }
  }

  static async getPendingSessions(): Promise<PairProgrammingSession[]> {
    try {
      return await this.getWhere<PairProgrammingSession>(
        COLLECTIONS.PAIR_PROGRAMMING_SESSIONS,
        'status',
        'in',
        ['pending', 'assigned']
      );
    } catch (error) {
      console.error('Error fetching pending sessions:', error);
      throw error;
    }
  }

  static async getOpenRequests(): Promise<PairProgrammingSession[]> {
    try {
      return await this.getWhere<PairProgrammingSession>(
        COLLECTIONS.PAIR_PROGRAMMING_SESSIONS,
        'mentor_id',
        '==',
        null
      );
    } catch (error) {
      console.error('Error fetching open requests:', error);
      throw error;
    }
  }

  static async assignMentorToSession(sessionId: string, mentorId: string): Promise<void> {
    try {
      // Get session to extract needed info (student_id, campus)
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Get the AA (mentor) user to get campus
      const mentorUser = await UserService.getUserById(mentorId);
      if (!mentorUser) {
        throw new Error(`Mentor ${mentorId} not found`);
      }

      // Update session with mentor assignment
      await this.updateSession(sessionId, {
        mentor_id: mentorId,
        status: 'assigned',
        assigned_at: new Date()
      });

      // Create queue entry for this session
      // This hooks the rolling queue system to activate when session is assigned
      try {
        await RollingQueueService.createQueueEntry(
          sessionId,
          session.student_id,
          mentorId,
          mentorUser.campus || 'default',
          'medium' // default priority
        );
        console.log(`[Queue] Created queue entry for session ${sessionId}, mentor ${mentorId}`);
      } catch (queueError) {
        // Log queue creation error but don't fail the mentor assignment
        console.error('[Queue] Error creating queue entry:', queueError);
      }
    } catch (error) {
      console.error('Error assigning mentor to session:', error);
      throw error;
    }
  }

  static async startSession(sessionId: string): Promise<void> {
    try {
      await this.updateSession(sessionId, {
        status: 'in_progress',
        started_at: new Date()
      });
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  static async completeSession(sessionId: string): Promise<void> {
    try {
      // Get session to know which AA (mentor) to advance queue for
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Update session status to completed
      await this.updateSession(sessionId, {
        status: 'completed',
        completed_at: new Date()
      });

      // Advance the queue for this AA (marks current complete, moves next to in_progress)
      // This hooks the rolling queue system to process the next entry when session completes
      if (session.mentor_id) {
        try {
          await RollingQueueService.advanceQueue(sessionId);
          console.log(`[Queue] Advanced queue for session ${sessionId}, mentor ${session.mentor_id}`);
        } catch (queueError) {
          // Log queue advancement error but don't fail session completion
          console.error('[Queue] Error advancing queue:', queueError);
        }
      }
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  }

  static async cancelSession(sessionId: string, reason?: string, skipRequeue: boolean = false): Promise<void> {
    try {
      // Get session to find queue entry if it exists
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Update session status to cancelled
      await this.updateSession(sessionId, {
        status: 'cancelled',
        cancelled_at: new Date(),
        cancel_reason: reason
      });

      // Auto-requeue cancelled sessions by default (unless skipRequeue is true)
      // This ensures students don't lose their place when sessions are cancelled
      if (session.mentor_id && !skipRequeue) {
        try {
          // Find and remove the old queue entry for this session
          const aaQueues = await RollingQueueService.getQueueForAA(session.mentor_id);
          const queueEntry = aaQueues.find((entry: any) => entry.session_id === sessionId);
          
          if (queueEntry) {
            await RollingQueueService.removeFromQueue(queueEntry.id);
            console.log(`[Queue] Removed cancelled session ${sessionId} from queue for auto-requeue`);
          }

          // Auto-requeue: Get campus and requeue at top with preserved priority
          const mentorUser = await UserService.getUserById(session.mentor_id);
          const campus = mentorUser?.campus || 'default';
          const priority = session.priority || 'medium';

          await RollingQueueService.requeueSession(
            sessionId,
            session.student_id,
            session.mentor_id,
            campus,
            { priority, toTop: true }
          );

          // Update session back to assigned state for requeue visibility
          await this.updateSession(sessionId, {
            status: 'assigned',
            assigned_at: new Date(),
            cancel_reason: reason, // Keep reason for audit trail
            updated_at: new Date(),
          });

          console.log(`[Queue] Auto-requeued cancelled session ${sessionId} with priority ${priority}`);
        } catch (queueError) {
          // Log queue error but don't fail session cancellation
          console.error('[Queue] Error auto-requeuing cancelled session:', queueError);
        }
      } else if (session.mentor_id && skipRequeue) {
        // Explicit removal without requeue
        try {
          const aaQueues = await RollingQueueService.getQueueForAA(session.mentor_id);
          const queueEntry = aaQueues.find((entry: any) => entry.session_id === sessionId);
          
          if (queueEntry) {
            await RollingQueueService.removeFromQueue(queueEntry.id);
            console.log(`[Queue] Removed cancelled session ${sessionId} from queue (no requeue)`);
          }
        } catch (queueError) {
          console.error('[Queue] Error removing from queue:', queueError);
        }
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error;
    }
  }

  /**
   * Cancel a session with custom priority and position options.
   * By default, cancelSession auto-requeues. Use this method to override priority or position.
   * If the original session has no mentor_id, the session will be cancelled only.
   */
  static async cancelAndRequeueSession(
    sessionId: string,
    reason?: string,
    options: { priority?: 'low' | 'medium' | 'high' | 'urgent'; toTop?: boolean } = {}
  ): Promise<void> {
    // Fetch the session first to retain details needed for requeue
    const session = await this.getSessionById(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Perform cancellation without auto-requeue (skipRequeue=true)
    await this.cancelSession(sessionId, reason, true);

    // If there's an assigned mentor (AA), requeue with custom options
    if (session.mentor_id) {
      try {
        // Determine campus from mentor profile
        const mentorUser = await UserService.getUserById(session.mentor_id);
        const campus = mentorUser?.campus || 'default';

        await RollingQueueService.requeueSession(
          sessionId,
          session.student_id,
          session.mentor_id,
          campus,
          { priority: options.priority ?? session.priority ?? 'medium', toTop: options.toTop ?? true }
        );

        // Reflect that the session is back to assigned state for visibility
        await this.updateSession(sessionId, {
          status: 'assigned',
          assigned_at: new Date(),
          cancel_reason: reason,
          updated_at: new Date(),
        });

        console.log(`[Queue] Requeued cancelled session ${sessionId} with custom options:`, options);
      } catch (queueError) {
        console.error('[Queue] Error requeuing session after cancellation:', queueError);
      }
    }
  }

  // Goals Management
  static async setUserGoal(goalData: Omit<PairProgrammingGoal, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      // First, deactivate any existing active goal for this user
      await this.updateWhere<PairProgrammingGoal>(
        COLLECTIONS.PAIR_PROGRAMMING_GOALS,
        [{ field: 'user_id', operator: '==', value: goalData.user_id }],
        { is_active: false }
      );

      return await this.create<PairProgrammingGoal>(COLLECTIONS.PAIR_PROGRAMMING_GOALS, {
        ...goalData,
        is_active: true
      });
    } catch (error) {
      console.error('Error setting user goal:', error);
      throw error;
    }
  }

  static async getUserGoal(userId: string): Promise<PairProgrammingGoal | null> {
    try {
      const goals = await this.getWhere<PairProgrammingGoal>(
        COLLECTIONS.PAIR_PROGRAMMING_GOALS,
        'user_id',
        '==',
        userId
      );
      return goals.find(goal => goal.is_active) || null;
    } catch (error) {
      console.error('Error fetching user goal:', error);
      throw error;
    }
  }

  // Feedback Management
  static async submitMentorFeedback(feedbackData: Omit<MentorFeedback, 'id'>): Promise<string> {
    try {
      const feedbackId = await this.create<MentorFeedback>(COLLECTIONS.MENTOR_FEEDBACK, {
        ...feedbackData,
        submitted_at: new Date()
      });

      // Check if both feedbacks are submitted to complete the session
      await this.checkAndCompleteSession(feedbackData.session_id);

      return feedbackId;
    } catch (error) {
      console.error('Error submitting mentor feedback:', error);
      throw error;
    }
  }

  static async submitMenteeFeedback(feedbackData: Omit<MenteeFeedback, 'id'>): Promise<string> {
    try {
      const feedbackId = await this.create<MenteeFeedback>(COLLECTIONS.MENTEE_FEEDBACK, {
        ...feedbackData,
        submitted_at: new Date()
      });

      // Check if both feedbacks are submitted to complete the session
      await this.checkAndCompleteSession(feedbackData.session_id);

      return feedbackId;
    } catch (error) {
      console.error('Error submitting mentee feedback:', error);
      throw error;
    }
  }

  static async getSessionFeedback(sessionId: string): Promise<{
    mentorFeedback?: MentorFeedback;
    menteeFeedback?: MenteeFeedback;
  }> {
    try {
      const [mentorFeedback] = await this.getWhere<MentorFeedback>(
        COLLECTIONS.MENTOR_FEEDBACK,
        'session_id',
        '==',
        sessionId
      );

      const [menteeFeedback] = await this.getWhere<MenteeFeedback>(
        COLLECTIONS.MENTEE_FEEDBACK,
        'session_id',
        '==',
        sessionId
      );

      return { mentorFeedback, menteeFeedback };
    } catch (error) {
      console.error('Error fetching session feedback:', error);
      throw error;
    }
  }

  private static async checkAndCompleteSession(sessionId: string): Promise<void> {
    try {
      const { mentorFeedback, menteeFeedback } = await this.getSessionFeedback(sessionId);

      if (mentorFeedback && menteeFeedback) {
        // Both feedbacks submitted, mark session as completed
        await this.create<SessionCompletion>(COLLECTIONS.SESSION_COMPLETIONS, {
          session_id: sessionId,
          mentor_feedback_id: mentorFeedback.id,
          mentee_feedback_id: menteeFeedback.id,
          is_completed: true,
          completed_at: new Date()
        });

        await this.completeSession(sessionId);
      }
    } catch (error) {
      console.error('Error checking session completion:', error);
      throw error;
    }
  }

  // Analytics and Statistics
  static async getUserStats(userId: string, userRole: 'mentee' | 'mentor'): Promise<PairProgrammingStats> {
    try {
      const sessions = await this.getSessionsByUser(userId, userRole);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const sessionsThisWeek = sessions.filter(s => new Date(s.created_at) >= weekAgo);

      return {
        total_sessions_all_time: sessions.length,
        sessions_last_7_days: sessionsThisWeek.length,
        sessions_this_week: sessionsThisWeek.length,
        expected_sessions_this_week: 0, // Will be calculated based on goals
        pending_sessions: sessions.filter(s => ['pending', 'assigned'].includes(s.status)).length,
        overdue_sessions: 0, // Will be calculated based on scheduling
        mentees_with_overdue_sessions: 0,
        average_sessions_per_mentee: userRole === 'mentor' ? 0 : sessions.length,
        average_sessions_per_mentor: userRole === 'mentee' ? 0 : sessions.length
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  // Auto-sorting for pending sessions
  static async getSortedPendingSessions(): Promise<PairProgrammingSession[]> {
    try {
      const pendingSessions = await this.getPendingSessions();

      // Sort by priority and days since last session
      return pendingSessions.sort((a, b) => {
        // First sort by priority
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by days since creation (oldest first)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    } catch (error) {
      console.error('Error fetching sorted pending sessions:', error);
      throw error;
    }
  }

  // Create a new session request
  static async createSessionRequest(requestData: Omit<PairProgrammingRequest, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const sessionData: Omit<PairProgrammingSession, 'id'> = {
        student_id: requestData.student_id,
        mentor_id: undefined,
        topic: requestData.topic,
        description: requestData.description,
        status: 'pending',
        session_type: 'open_request',
        priority: requestData.priority,
        scheduled_date: undefined,
        scheduled_time: undefined,
        duration_minutes: requestData.duration_minutes,
        meeting_link: undefined,
        created_at: new Date(),
        assigned_at: undefined,
        started_at: undefined,
        completed_at: undefined,
        cancelled_at: undefined,
        cancel_reason: undefined,
        updated_at: new Date()
      };

      // Remove undefined fields before saving to Firestore
      const cleanSessionData = Object.fromEntries(
        Object.entries(sessionData).filter(([_, value]) => value !== undefined)
      );

      const sessionId = await this.create<PairProgrammingSession>(COLLECTIONS.PAIR_PROGRAMMING_SESSIONS, cleanSessionData as Omit<PairProgrammingSession, 'id'>);

      // Try to auto-schedule the session
      try {
        const student = await UserService.getUserById(requestData.student_id);
        if (student?.campus) {
          const autoScheduled = await PairProgrammingScheduler.autoScheduleSession(
            sessionId,
            student.campus,
            requestData.priority
          );

          if (autoScheduled) {
            console.log(`Session ${sessionId} auto-scheduled successfully`);
          } else {
            console.log(`Session ${sessionId} could not be auto-scheduled, remains pending`);
          }
        }
      } catch (scheduleError) {
        console.error('Error during auto-scheduling:', scheduleError);
        // Continue without failing the session creation
      }

      return sessionId;
    } catch (error) {
      console.error('Error creating session request:', error);
      throw error;
    }
  }
}

// Enhanced Leave Service
export class EnhancedLeaveService extends FirestoreService {

  static async createLeaveRequest(leaveData: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const leaveId = await this.create<LeaveRequest>(COLLECTIONS.LEAVE_REQUESTS, {
        ...leaveData,
        status: leaveData.status || 'pending'
      });

      // Handle session reassignment if needed
      if (leaveData.status === 'approved') {
        const fullLeaveData = await this.getById<LeaveRequest>(COLLECTIONS.LEAVE_REQUESTS, leaveId);
        if (fullLeaveData) {
          await this.handleLeaveImpact(leaveId, fullLeaveData);
        }
      }

      return leaveId;
    } catch (error) {
      console.error('Error creating leave request:', error);
      throw error;
    }
  }

  static async getLeaveById(leaveId: string): Promise<LeaveRequest | null> {
    try {
      return await this.getById<LeaveRequest>(COLLECTIONS.LEAVE_REQUESTS, leaveId);
    } catch (error) {
      console.error('Error fetching leave by ID:', error);
      throw error;
    }
  }

  static async getUserLeaves(userId: string): Promise<LeaveRequest[]> {
    try {
      return await this.getWhere<LeaveRequest>(
        COLLECTIONS.LEAVE_REQUESTS,
        'user_id',
        '==',
        userId
      );
    } catch (error) {
      console.error('Error fetching user leaves:', error);
      throw error;
    }
  }

  static async getActiveLeaves(): Promise<LeaveRequest[]> {
    try {
      const now = new Date();
      return await this.getWhereCompound<LeaveRequest>(
        COLLECTIONS.LEAVE_REQUESTS,
        [
          { field: 'status', operator: '==', value: 'approved' },
          { field: 'start_date', operator: '<=', value: now },
          { field: 'end_date', operator: '>=', value: now }
        ]
      );
    } catch (error) {
      console.error('Error fetching active leaves:', error);
      throw error;
    }
  }

  static async updateLeaveStatus(leaveId: string, status: LeaveRequest['status'], approvedBy?: string): Promise<void> {
    try {
      const updates: Partial<LeaveRequest> = {
        status,
        updated_at: new Date()
      };

      if (approvedBy) {
        updates.approved_by = approvedBy;
        updates.approved_at = new Date();
      }

      await this.update<LeaveRequest>(COLLECTIONS.LEAVE_REQUESTS, leaveId, updates);

      // Handle session reassignment if approved
      if (status === 'approved') {
        const leave = await this.getLeaveById(leaveId);
        if (leave) {
          await this.handleLeaveImpact(leaveId, leave);
        }
      }
    } catch (error) {
      console.error('Error updating leave status:', error);
      throw error;
    }
  }

  private static async handleLeaveImpact(leaveId: string, leave: LeaveRequest): Promise<void> {
    try {
      // Find overlapping sessions
      const overlappingSessions = await this.getOverlappingSessions(leave);

      if (overlappingSessions.length > 0) {
        // Create leave impact record
        await this.create<LeaveImpact>(COLLECTIONS.LEAVE_IMPACTS, {
          leave_id: leaveId,
          affected_sessions: overlappingSessions.map(s => s.id),
          reassignment_status: 'pending'
        });

        // TODO: Implement session reassignment logic
        // This would involve finding available mentors and reassigning sessions
      }
    } catch (error) {
      console.error('Error handling leave impact:', error);
      throw error;
    }
  }

  private static async getOverlappingSessions(leave: LeaveRequest): Promise<PairProgrammingSession[]> {
    try {
      // Get sessions that overlap with the leave period
      const sessions = await FirestoreService.getWhereCompound<PairProgrammingSession>(
        COLLECTIONS.PAIR_PROGRAMMING_SESSIONS,
        [
          { field: 'mentor_id', operator: '==', value: leave.user_id },
          { field: 'status', operator: 'in', value: ['scheduled', 'assigned'] },
          { field: 'scheduled_date', operator: '>=', value: leave.start_date },
          { field: 'scheduled_date', operator: '<=', value: leave.end_date }
        ]
      );

      return sessions;
    } catch (error) {
      console.error('Error finding overlapping sessions:', error);
      throw error;
    }
  }

  static async getLeavesToday(): Promise<{ mentors_on_leave: number; mentees_on_leave: number; leave_details: LeaveRequest[] }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch all approved leave requests and filter client-side to avoid compound query
      const allApprovedLeaves = await this.getWhere<LeaveRequest>(
        COLLECTIONS.LEAVE_REQUESTS,
        'status',
        '==',
        'approved'
      );

      // Filter client-side for date range
      const activeLeaves = allApprovedLeaves.filter(leave => {
        const startDate = leave.start_date instanceof Date ? leave.start_date : new Date(leave.start_date);
        const endDate = leave.end_date instanceof Date ? leave.end_date : new Date(leave.end_date);
        return startDate <= tomorrow && endDate >= today;
      });

      const mentorsOnLeave = activeLeaves.filter(leave => {
        // TODO: Check if user is a mentor
        return true; // Placeholder
      }).length;

      const menteesOnLeave = activeLeaves.filter(leave => {
        // TODO: Check if user is a mentee
        return true; // Placeholder
      }).length;

      return {
        mentors_on_leave: mentorsOnLeave,
        mentees_on_leave: menteesOnLeave,
        leave_details: activeLeaves
      };
    } catch (error) {
      console.error('Error fetching leaves today:', error);
      throw error;
    }
  }
}

// Enhanced Notification Service
export class EnhancedNotificationService extends FirestoreService {

  static async createNotification(notificationData: Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'is_read'>): Promise<string> {
    try {
      return await this.create<Notification>(COLLECTIONS.NOTIFICATIONS, {
        ...notificationData,
        is_read: false
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    try {
      let conditions: Array<{ field: string; operator: any; value: any }> = [
        { field: 'user_id', operator: '==', value: userId }
      ];

      if (unreadOnly) {
        conditions.push({ field: 'is_read', operator: '==', value: false });
      }

      return await this.getWhereCompound<Notification>(
        COLLECTIONS.NOTIFICATIONS,
        conditions,
        'created_at',
        'desc'
      );
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.update<Notification>(COLLECTIONS.NOTIFICATIONS, notificationId, {
        is_read: true,
        read_at: new Date()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async getReminderSettings(userId: string): Promise<ReminderSettings | null> {
    try {
      const [settings] = await this.getWhere<ReminderSettings>(
        COLLECTIONS.REMINDER_SETTINGS,
        'user_id',
        '==',
        userId
      );
      return settings || null;
    } catch (error) {
      console.error('Error fetching reminder settings:', error);
      throw error;
    }
  }

  static async updateReminderSettings(settings: Omit<ReminderSettings, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      // Delete existing settings
      await this.deleteWhere(
        COLLECTIONS.REMINDER_SETTINGS,
        [{ field: 'user_id', operator: '==', value: settings.user_id }]
      );

      return await this.create<ReminderSettings>(COLLECTIONS.REMINDER_SETTINGS, settings);
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      throw error;
    }
  }

  // Auto-generate notifications
  static async generateSessionReminders(): Promise<void> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const upcomingSessions = await FirestoreService.getWhere<PairProgrammingSession>(
        COLLECTIONS.PAIR_PROGRAMMING_SESSIONS,
        'scheduled_date',
        '==',
        tomorrow
      );

      for (const session of upcomingSessions) {
        // Notify mentor
        if (session.mentor_id) {
          await this.createNotification({
            user_id: session.mentor_id,
            type: 'session_reminder',
            title: 'Upcoming Pair Programming Session',
            message: `You have a pair programming session tomorrow at ${session.scheduled_time} with ${session.student_id}`,
            related_session_id: session.id
          });
        }

        // Notify mentee
        await this.createNotification({
          user_id: session.student_id,
          type: 'session_reminder',
          title: 'Upcoming Pair Programming Session',
          message: `You have a pair programming session tomorrow at ${session.scheduled_time}`,
          related_session_id: session.id
        });
      }
    } catch (error) {
      console.error('Error generating session reminders:', error);
      throw error;
    }
  }

  static async generateWelcomeBackNotifications(): Promise<void> {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Find leaves that ended yesterday
      const endedLeaves = await FirestoreService.getWhere<LeaveRequest>(
        COLLECTIONS.LEAVE_REQUESTS,
        'end_date',
        '==',
        yesterday
      );

      for (const leave of endedLeaves) {
        await this.createNotification({
          user_id: leave.user_id,
          type: 'welcome_back',
          title: 'Welcome Back!',
          message: 'Your leave period has ended. Welcome back to the campus!',
          related_leave_id: leave.id
        });
      }
    } catch (error) {
      console.error('Error generating welcome back notifications:', error);
      throw error;
    }
  }
}
