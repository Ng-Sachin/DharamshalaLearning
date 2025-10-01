// User role types
export type UserRole = 'student' | 'mentor' | 'admin';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mentor_id?: string; // Only for students
  skills?: string[];
  created_at: Date;
  updated_at: Date;
}

// Phase interface
export interface Phase {
  id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  order: number;
  created_at: Date;
}

// Topic interface
export interface Topic {
  id: string;
  phase_id: string;
  name: string;
  order: number;
  created_at: Date;
}

// Daily goals interface
export interface DailyGoal {
  id: string;
  student_id: string;
  phase_id: string;
  topic_id: string;
  goal_text: string;
  target_percentage: number;
  status: 'pending' | 'reviewed' | 'approved';
  created_at: Date;
  reviewed_at?: Date;
  reviewed_by?: string;
}

// Daily reflections interface
export interface DailyReflection {
  id: string;
  student_id: string;
  goal_id: string;
  reflection_text: string;
  achieved_percentage: number;
  status: 'pending' | 'reviewed' | 'approved';
  mentor_notes?: string;
  created_at: Date;
  reviewed_at?: Date;
  reviewed_by?: string;
}

// Pair programming request interface
export interface PairProgrammingRequest {
  id: string;
  student_id: string;
  mentor_id?: string;
  topic: string;
  description?: string;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  feedback?: string;
  created_at: Date;
  assigned_at?: Date;
  completed_at?: Date;
}

// Attendance interface
export interface Attendance {
  id: string;
  student_id: string;
  date: Date;
  goal_reviewed: boolean;
  reflection_reviewed: boolean;
  present_status: 'present' | 'absent' | 'on_leave';
  created_at: Date;
  updated_at: Date;
}

// Mentor notes interface
export interface MentorNote {
  id: string;
  mentor_id: string;
  student_id: string;
  skills: string[];
  performance_notes: string;
  rating?: number; // 1-5 scale
  created_at: Date;
  updated_at: Date;
}

// Leave request interface
export interface LeaveRequest {
  id: string;
  student_id: string;
  start_date: Date;
  end_date: Date;
  reason: string;
  status: 'approved' | 'pending'; // Auto-approved for now
  created_at: Date;
}

// Progress tracking interface
export interface StudentProgress {
  student_id: string;
  phase_id: string;
  topic_id: string;
  start_date: Date;
  end_date?: Date;
  expected_end_date: Date;
  completion_percentage: number;
  is_on_track: boolean;
}

// Dashboard stats interfaces
export interface StudentStats {
  total_goals: number;
  goals_achieved: number;
  average_achievement_percentage: number;
  attendance_percentage: number;
  leaves_taken: number;
  leaves_remaining: number;
  pair_programming_sessions: number;
}

export interface MentorStats {
  total_mentees: number;
  pending_reviews: number;
  pair_programming_requests: number;
  average_mentee_performance: number;
}

export interface AdminStats {
  total_students: number;
  total_mentors: number;
  campus_attendance_rate: number;
  average_goal_achievement: number;
  total_pair_programming_sessions: number;
  students_on_track: number;
  students_behind: number;
}

// Form interfaces
export interface GoalFormData {
  phase_id: string;
  topic_id: string;
  goal_text: string;
  target_percentage: number;
}

export interface ReflectionFormData {
  reflection_text: string;
  achieved_percentage: number;
}

export interface PairProgrammingFormData {
  topic: string;
  description?: string;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Navigation and routing
export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  roles: UserRole[];
}