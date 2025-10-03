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
  StudentProgress
} from '../types';
import { Timestamp } from 'firebase/firestore';

// Phase Service
export class PhaseService extends FirestoreService {
  static async createPhase(phaseData: Omit<Phase, 'id'>): Promise<string> {
    return this.create<Phase>(COLLECTIONS.PHASES, phaseData);
  }

  static async getAllPhases(): Promise<Phase[]> {
    // Get all phases without ordering (since data is small)
    const phases = await this.getAll<Phase>(COLLECTIONS.PHASES);

    // Sort by order client-side
    return phases.sort((a, b) => a.order - b.order);
  }

  static async getPhaseById(id: string): Promise<Phase | null> {
    return this.getById<Phase>(COLLECTIONS.PHASES, id);
  }

  static async updatePhase(id: string, phaseData: Partial<Phase>): Promise<void> {
    return this.update<Phase>(COLLECTIONS.PHASES, id, phaseData);
  }

  static async deletePhase(id: string): Promise<void> {
    return this.delete(COLLECTIONS.PHASES, id);
  }
}

// Topic Service
export class TopicService extends FirestoreService {
  static async createTopic(topicData: Omit<Topic, 'id'>): Promise<string> {
    return this.create<Topic>(COLLECTIONS.TOPICS, topicData);
  }

  static async getTopicsByPhase(phaseId: string): Promise<Topic[]> {
    // Get all topics for the phase (uses single-field index on phase_id)
    const topics = await this.getWhere<Topic>(COLLECTIONS.TOPICS, 'phase_id', '==', phaseId);

    // Sort by order client-side
    return topics.sort((a, b) => a.order - b.order);
  }

  static async getTopicById(id: string): Promise<Topic | null> {
    return this.getById<Topic>(COLLECTIONS.TOPICS, id);
  }

  static async updateTopic(id: string, topicData: Partial<Topic>): Promise<void> {
    return this.update<Topic>(COLLECTIONS.TOPICS, id, topicData);
  }

  static async deleteTopic(id: string): Promise<void> {
    return this.delete(COLLECTIONS.TOPICS, id);
  }
}

// Daily Goal Service
export class GoalService extends FirestoreService {
  static async createGoal(goalData: Omit<DailyGoal, 'id'>): Promise<string> {
    return this.create<DailyGoal>(COLLECTIONS.DAILY_GOALS, goalData);
  }

  static async getGoalsByStudent(studentId: string, limit?: number): Promise<DailyGoal[]> {
    console.log('🔍 [GoalService] getGoalsByStudent - studentId:', studentId);
    // Get goals without ordering to avoid composite index requirement
    const goals = await this.getWhere<DailyGoal>(
      COLLECTIONS.DAILY_GOALS,
      'student_id',
      '==',
      studentId
    );
    console.log('🔍 [GoalService] Raw goals from Firestore:', goals.length, 'goals');
    goals.forEach((goal, index) => {
      console.log(`  Goal ${index + 1}:`, {
        id: goal.id,
        created_at: goal.created_at,
        created_at_type: typeof goal.created_at,
        goal_text: goal.goal_text?.substring(0, 50) + '...'
      });
    });

    // Sort by created_at desc client-side
    const sorted = goals.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    console.log('🔍 [GoalService] Sorted goals:', sorted.length);
    return sorted;
  }

  static async getTodaysGoal(studentId: string): Promise<DailyGoal | null> {
    console.log('📅 [GoalService] getTodaysGoal - studentId:', studentId);
    // Get start and end of today in UTC
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));

    console.log('📅 [GoalService] Date range:', {
      now: now.toISOString(),
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    // Firestore Timestamp
    const { Timestamp } = await import('firebase/firestore');
    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    // Get all goals for the student (uses single-field index)
    const allGoals = await this.getGoalsByStudent(studentId);
    console.log('📅 [GoalService] Total goals for student:', allGoals.length);

    // Filter for today's goals client-side
    const todaysGoals = allGoals.filter(goal => {
      // goal.created_at is actually a Firestore Timestamp at runtime
      const goalTimestamp = goal.created_at as any;
      const goalTime = goalTimestamp.toMillis ? goalTimestamp.toMillis() : goalTimestamp.getTime();
      const startTime = startTimestamp.toMillis();
      const endTime = endTimestamp.toMillis();
      const isToday = goalTime >= startTime && goalTime < endTime;
      
      console.log('📅 [GoalService] Checking goal:', {
        goalId: goal.id,
        goalTime: new Date(goalTime).toISOString(),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        isToday,
        goalText: goal.goal_text?.substring(0, 30)
      });
      
      return isToday;
    });
    
    console.log('📅 [GoalService] Today\'s goals found:', todaysGoals.length);
    const result = todaysGoals.length > 0 ? todaysGoals[0] : null;
    console.log('📅 [GoalService] Returning today\'s goal:', result ? { id: result.id, text: result.goal_text?.substring(0, 50) } : 'null');

    return result;
  }
// Add compound query support to FirestoreService

  static async getPendingGoalsForMentor(mentorId: string): Promise<DailyGoal[]> {
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
  }

  static async updateGoal(id: string, goalData: Partial<DailyGoal>): Promise<void> {
    return this.update<DailyGoal>(COLLECTIONS.DAILY_GOALS, id, goalData);
  }

  static async reviewGoal(
    id: string,
    reviewerId: string,
    status: 'approved' | 'reviewed'
  ): Promise<void> {
    return this.updateGoal(id, {
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date()
    });
  }
}

// Daily Reflection Service
export class ReflectionService extends FirestoreService {
  static async createReflection(reflectionData: Omit<DailyReflection, 'id' | 'created_at'>): Promise<string> {
    return this.create<DailyReflection>(COLLECTIONS.DAILY_REFLECTIONS, reflectionData as any);
  }

  static async getReflectionsByStudent(studentId: string): Promise<DailyReflection[]> {
    // Get without ordering to avoid composite index requirement
    const reflections = await this.getWhere<DailyReflection>(
      COLLECTIONS.DAILY_REFLECTIONS,
      'student_id',
      '==',
      studentId
    );
    // Sort by created_at desc client-side
    return reflections.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  static async getReflectionByGoal(goalId: string): Promise<DailyReflection | null> {
    const reflections = await this.getWhere<DailyReflection>(
      COLLECTIONS.DAILY_REFLECTIONS,
      'goal_id',
      '==',
      goalId
    );
    return reflections.length > 0 ? reflections[0] : null;
  }

  static async getPendingReflectionsForMentor(mentorId: string): Promise<DailyReflection[]> {
    return this.getWhere<DailyReflection>(
      COLLECTIONS.DAILY_REFLECTIONS,
      'status',
      '==',
      'pending'
    );
  }

  static async updateReflection(id: string, reflectionData: Partial<DailyReflection>): Promise<void> {
    return this.update<DailyReflection>(COLLECTIONS.DAILY_REFLECTIONS, id, reflectionData);
  }

  static async reviewReflection(
    id: string,
    reviewerId: string,
    status: 'approved' | 'reviewed',
    mentorNotes?: string,
    mentorAssessment?: 'needs_improvement' | 'on_track' | 'exceeds_expectations'
  ): Promise<void> {
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
    
    return this.updateReflection(id, updateData);
  }

  static async markReflectionAsRead(id: string): Promise<void> {
    return this.updateReflection(id, {
      is_read_by_student: true
    });
  }
}

// Pair Programming Service
export class PairProgrammingService extends FirestoreService {
  static async createRequest(requestData: Omit<PairProgrammingRequest, 'id'>): Promise<string> {
    return this.create<PairProgrammingRequest>(COLLECTIONS.PAIR_PROGRAMMING_REQUESTS, requestData);
  }

  static async getRequestsByStudent(studentId: string): Promise<PairProgrammingRequest[]> {
    // Get without ordering to avoid composite index requirement
    const requests = await this.getWhere<PairProgrammingRequest>(
      COLLECTIONS.PAIR_PROGRAMMING_REQUESTS,
      'student_id',
      '==',
      studentId
    );
    // Sort by created_at desc client-side
    return requests.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  static async getPendingRequests(): Promise<PairProgrammingRequest[]> {
    return this.getWhere<PairProgrammingRequest>(
      COLLECTIONS.PAIR_PROGRAMMING_REQUESTS,
      'status',
      '==',
      'pending'
    );
  }

  static async getRequestsByMentor(mentorId: string): Promise<PairProgrammingRequest[]> {
    return this.getWhere<PairProgrammingRequest>(
      COLLECTIONS.PAIR_PROGRAMMING_REQUESTS,
      'mentor_id',
      '==',
      mentorId
    );
  }

  static async assignMentor(requestId: string, mentorId: string): Promise<void> {
    return this.update<PairProgrammingRequest>(COLLECTIONS.PAIR_PROGRAMMING_REQUESTS, requestId, {
      mentor_id: mentorId,
      status: 'assigned',
      assigned_at: new Date()
    });
  }

  static async completeSession(requestId: string, feedback: string): Promise<void> {
    return this.update<PairProgrammingRequest>(COLLECTIONS.PAIR_PROGRAMMING_REQUESTS, requestId, {
      status: 'completed',
      feedback,
      completed_at: new Date()
    });
  }

  static async cancelRequest(requestId: string): Promise<void> {
    return this.update<PairProgrammingRequest>(COLLECTIONS.PAIR_PROGRAMMING_REQUESTS, requestId, {
      status: 'cancelled'
    });
  }
}

// Attendance Service
export class AttendanceService extends FirestoreService {
  static async markAttendance(attendanceData: Omit<Attendance, 'id'>): Promise<string> {
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
      return this.create<Attendance>(COLLECTIONS.ATTENDANCE, attendanceData);
    }
  }

  static async getStudentAttendanceByDate(
    studentId: string,
    date: Date
  ): Promise<Attendance | null> {
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
  }

  static async getStudentAttendance(
    studentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Attendance[]> {
    return this.getWhere<Attendance>(
      COLLECTIONS.ATTENDANCE,
      'student_id',
      '==',
      studentId,
      'date',
      'desc'
    );
  }

  static async updateAttendanceStatus(
    studentId: string,
    date: Date,
    goalReviewed: boolean,
    reflectionReviewed: boolean
  ): Promise<void> {
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
  }
}

// Leave Request Service
export class LeaveService extends FirestoreService {
  static async createLeaveRequest(leaveData: Omit<LeaveRequest, 'id'>): Promise<string> {
    return this.create<LeaveRequest>(COLLECTIONS.LEAVE_REQUESTS, {
      ...leaveData,
      status: 'approved' // Auto-approve for now
    });
  }

  static async getStudentLeaves(studentId: string): Promise<LeaveRequest[]> {
    return this.getWhere<LeaveRequest>(
      COLLECTIONS.LEAVE_REQUESTS,
      'student_id',
      '==',
      studentId,
      'start_date',
      'desc'
    );
  }

  static async getLeavesByDateRange(startDate: Date, endDate: Date): Promise<LeaveRequest[]> {
    // This would need a compound query or client-side filtering
    return this.getAll<LeaveRequest>(COLLECTIONS.LEAVE_REQUESTS, 'start_date', 'desc');
  }
}

// Mentor Notes Service
export class MentorNotesService extends FirestoreService {
  static async createNote(noteData: Omit<MentorNote, 'id'>): Promise<string> {
    return this.create<MentorNote>(COLLECTIONS.MENTOR_NOTES, noteData);
  }

  static async getNotesByStudent(studentId: string): Promise<MentorNote[]> {
    return this.getWhere<MentorNote>(
      COLLECTIONS.MENTOR_NOTES,
      'student_id',
      '==',
      studentId,
      'created_at',
      'desc'
    );
  }

  static async getNotesByMentor(mentorId: string): Promise<MentorNote[]> {
    return this.getWhere<MentorNote>(
      COLLECTIONS.MENTOR_NOTES,
      'mentor_id',
      '==',
      mentorId,
      'created_at',
      'desc'
    );
  }

  static async updateNote(id: string, noteData: Partial<MentorNote>): Promise<void> {
    return this.update<MentorNote>(COLLECTIONS.MENTOR_NOTES, id, noteData);
  }
}