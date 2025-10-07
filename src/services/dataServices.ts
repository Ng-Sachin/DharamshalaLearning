import { FirestoreService, COLLECTIONS } from './firestore';
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
  User
} from '../types';

// Phase Service
export class PhaseService extends FirestoreService {
  static async createPhase(phaseData: Omit<Phase, 'id'>): Promise<string> {
    try {
      return await this.create<Phase>(COLLECTIONS.PHASES, phaseData);
    } catch (error) {
      console.error('Error creating phase:', error);
      throw error;
    }
  }

  static async getAllPhases(): Promise<Phase[]> {
    try {
      // Get all phases without ordering (since data is small)
      const phases = await this.getAll<Phase>(COLLECTIONS.PHASES);

      // Sort by order client-side
      return phases.sort((a, b) => a.order - b.order);
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
  static async createTopic(topicData: Omit<Topic, 'id'>): Promise<string> {
    try {
      return await this.create<Topic>(COLLECTIONS.TOPICS, topicData);
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  }

  static async getTopicsByPhase(phaseId: string): Promise<Topic[]> {
    try {
      // Get all topics for the phase (uses single-field index on phase_id)
      const topics = await this.getWhere<Topic>(COLLECTIONS.TOPICS, 'phase_id', '==', phaseId);

      // Sort by order client-side
      return topics.sort((a, b) => a.order - b.order);
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
      return await this.create<DailyGoal>(COLLECTIONS.DAILY_GOALS, goalData);
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  static async getGoalsByStudent(studentId: string, limit?: number): Promise<DailyGoal[]> {
    try {
      // Get goals without ordering to avoid composite index requirement
      const goals = await this.getWhere<DailyGoal>(
        COLLECTIONS.DAILY_GOALS,
        'student_id',
        '==',
        studentId
      );

      // Sort by created_at desc client-side
      const sorted = goals.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      return limit ? sorted.slice(0, limit) : sorted;
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

  static async reviewGoal(
    id: string,
    reviewerId: string,
    status: 'approved' | 'reviewed',
    mentorComment?: string
  ): Promise<void> {
    try {
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

  static async createReflection(reflectionData: Omit<DailyReflection, 'id' | 'created_at'>): Promise<string> {
    try {
      return await this.create<DailyReflection>(COLLECTIONS.DAILY_REFLECTIONS, reflectionData as any);
    } catch (error) {
      console.error('Error creating reflection:', error);
      throw error;
    }
  }

  static async getReflectionsByStudent(studentId: string): Promise<DailyReflection[]> {
    try {
      // Get without ordering to avoid composite index requirement
      const reflections = await this.getWhere<DailyReflection>(
        COLLECTIONS.DAILY_REFLECTIONS,
        'student_id',
        '==',
        studentId
      );
      // Sort by created_at desc client-side
      return reflections.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
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

  static async reviewReflection(
    id: string,
    reviewerId: string,
    status: 'approved' | 'reviewed',
    mentorNotes?: string,
    mentorAssessment?: 'needs_improvement' | 'on_track' | 'exceeds_expectations'
  ): Promise<void> {
    try {
      const updateData: Partial<DailyReflection> = {
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        feedback_given_at: new Date(),
        mentor_notes: mentorNotes
      };

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
  static async createRequest(requestData: Omit<PairProgrammingRequest, 'id'>): Promise<string> {
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
        return existingAttendance.id;
      } else {
        // Create new attendance record
        return await this.create<Attendance>(COLLECTIONS.ATTENDANCE, attendanceData);
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

      const attendance = await this.getWhere<Attendance>(
        COLLECTIONS.ATTENDANCE,
        'student_id',
        '==',
        studentId
      );

      // Filter by date range (client-side)
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
      return await this.getWhere<Attendance>(
        COLLECTIONS.ATTENDANCE,
        'student_id',
        '==',
        studentId,
        'date',
        'desc'
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
      return await this.getWhere<LeaveRequest>(
        COLLECTIONS.LEAVE_REQUESTS,
        'student_id',
        '==',
        studentId,
        'start_date',
        'desc'
      );
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

      // Fetch all students for campus
      const allUsers = await this.getAllUsers();
      const students = allUsers.filter(u => u.campus === campusId && !u.isAdmin);

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
      return await this.getAll<any>(COLLECTIONS.USERS, 'created_at', 'desc');
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  // Update user admin status
  static async updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<void> {
    try {
      return await this.update<any>(COLLECTIONS.USERS, userId, { 
        isAdmin,
        updated_at: new Date()
      });
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
   * Get all mentors with capacity information
   */
  static async getAllMentorsWithCapacity(): Promise<MentorWithCapacity[]> {
    try {
      const { UserService } = await import('./firestore');
      
      // Get all users (anyone can be a mentor)
      const allUsers = await UserService['getAll']<User>('users');

      // Get capacity for each user
      const mentorsWithCapacity: MentorWithCapacity[] = [];
      
      for (const user of allUsers) {
        // All users are considered as mentors
        // Get all students assigned to this user as mentor
        const mentees = await UserService.getStudentsByMentor(user.id);
        
        // Determine max mentees: super mentors = unlimited (999), regular = max_mentees or default 2
        const maxMentees = user.isSuperMentor 
          ? 999 
          : (user.max_mentees || 2);
        const currentMentees = mentees.length;
        const availableSlots = user.isSuperMentor ? 999 : Math.max(0, maxMentees - currentMentees);
        
        mentorsWithCapacity.push({
          mentor: user,
          current_mentees: currentMentees,
          max_mentees: maxMentees,
          available_slots: availableSlots,
          mentee_names: mentees.map(m => m.name)
        });
      }

      return mentorsWithCapacity;
    } catch (error) {
      console.error('❌ MentorshipService: Error getting mentors with capacity:', error);
      return [];
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
   */
  static async approveMentorRequest(
    requestId: string,
    adminId: string,
    adminRole: 'admin' | 'super_mentor',
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
   */
  static async rejectMentorRequest(
    requestId: string,
    adminId: string,
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
