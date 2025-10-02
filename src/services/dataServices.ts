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
    return this.getAll<Phase>(COLLECTIONS.PHASES, 'order', 'asc');
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
    return this.getWhere<Topic>(COLLECTIONS.TOPICS, 'phase_id', '==', phaseId, 'order', 'asc');
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
    return this.getWhere<DailyGoal>(
      COLLECTIONS.DAILY_GOALS,
      'student_id',
      '==',
      studentId,
      'created_at',
      'desc'
    );
  }

  static async getTodaysGoal(studentId: string): Promise<DailyGoal | null> {
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
      const goalTimestamp = Timestamp.fromDate(goal.created_at);
      return goalTimestamp >= startTimestamp && goalTimestamp < endTimestamp;
    });

    return todaysGoals.length > 0 ? todaysGoals[0] : null;
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
  static async createReflection(reflectionData: Omit<DailyReflection, 'id'>): Promise<string> {
    return this.create<DailyReflection>(COLLECTIONS.DAILY_REFLECTIONS, reflectionData);
  }

  static async getReflectionsByStudent(studentId: string): Promise<DailyReflection[]> {
    return this.getWhere<DailyReflection>(
      COLLECTIONS.DAILY_REFLECTIONS,
      'student_id',
      '==',
      studentId,
      'created_at',
      'desc'
    );
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
    mentorNotes?: string
  ): Promise<void> {
    return this.updateReflection(id, {
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
      mentor_notes: mentorNotes
    });
  }
}

// Pair Programming Service
export class PairProgrammingService extends FirestoreService {
  static async createRequest(requestData: Omit<PairProgrammingRequest, 'id'>): Promise<string> {
    return this.create<PairProgrammingRequest>(COLLECTIONS.PAIR_PROGRAMMING_REQUESTS, requestData);
  }

  static async getRequestsByStudent(studentId: string): Promise<PairProgrammingRequest[]> {
    return this.getWhere<PairProgrammingRequest>(
      COLLECTIONS.PAIR_PROGRAMMING_REQUESTS,
      'student_id',
      '==',
      studentId,
      'created_at',
      'desc'
    );
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