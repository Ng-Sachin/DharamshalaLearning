// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;    // Only used for admin-specific features
  isMentor?: boolean;   // Whether the user is a mentor
  isSuperMentor?: boolean;  // Can have unlimited mentees (no 2-mentee limit)
  mentor_id?: string;   // ID of assigned mentor if student
  pending_mentor_id?: string;  // Requested mentor awaiting admin approval
  max_mentees?: number;  // Override default limit (default: 2, super mentors: unlimited)
  skills?: string[];
  house?: 'Bageshree' | 'Malhar' | 'Bhairav';  // User's assigned house
  campus?: 'Dantewada' | 'Dharamshala' | 'Eternal' | 'Jashpur' | 'Kishanganj' | 'Pune' | 'Raigarh' | 'Sarjapura' | 'Bageshree' | 'Malhar' | 'Bhairav';  // User's campus or house
  current_phase_id?: string;  // Current phase the user is on
  current_phase_name?: string;  // Denormalized phase name for display
  status?: 'active' | 'inactive' | 'dropout' | 'placed' | 'on_leave';  // User's current status
  leave_from?: Date;  // Start date of leave period
  leave_to?: Date;    // End date of leave period
  deleted_at?: Date;  // Soft delete timestamp
  created_at: Date;
  updated_at: Date;
  role?: 'admin' | 'super_mentor' | 'mentor';  // Role of the user
}

// Phase interface
export interface Phase {
  id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  order: number;
  isSenior?: boolean; // optional flag to mark mentor/senior phases
  created_at: Date;
}

// Topic interface
export interface Topic {
  id: string;
  phase_id: string;
  name: string;
  order: number;
  maxTime?: number;
  keyTags?: string[];
  deliverable?: string;
  icon?: string;
  technologies?: string[];
  description?: string;
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
  mentor_comment?: string;
  created_at: Date;
  reviewed_at?: Date;
  reviewed_by?: string;
}

// Daily reflections interface
export interface DailyReflection {
  id: string;
  student_id: string;
  goal_id: string;
  phase_id: string;
  topic_id: string;
  reflection_answers: {
    workedWell: string;      // What worked well for you today? What were you able to achieve?
    howAchieved: string;     // How did you achieve this, and who supported you?
    keyLearning: string;     // What was your special learning from today's task?
    challenges: string;      // What challenges did you face, and what would you need to make it better?
  };
  achieved_percentage: number;
  status: 'pending' | 'reviewed' | 'approved';
  mentor_notes?: string;
  mentor_assessment?: 'needs_improvement' | 'on_track' | 'exceeds_expectations';
  is_read_by_student?: boolean;
  created_at: Date;
  reviewed_at?: Date;
  reviewed_by?: string;
  feedback_given_at?: Date;
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
  adminOnly?: boolean;
}

// Admin reporting interfaces
export interface PhaseProgress {
  phase_id: string;
  phase_name: string;
  goals_count: number;
  reflections_count: number;
  average_achievement: number;
  duration_days: number;
  topics_covered: number;
  total_topics: number;
  status: 'completed' | 'in_progress' | 'not_started';
  start_date: Date;
  end_date?: Date;
}

export interface StudentReport {
  student_id: string;
  student_name: string;
  student_email: string;
  mentor_id?: string;
  mentor_name?: string;
  current_phase_id?: string;
  current_phase_name?: string;
  
  // Aggregated stats
  total_goals: number;
  total_reflections: number;
  reflection_submission_rate: number; // percentage
  average_achievement: number;
  mentor_feedback_rate: number;
  
  // Phase-wise breakdown
  phase_progress: PhaseProgress[];
  
  // Recent activity
  recent_goals: DailyGoal[];
  recent_reflections: DailyReflection[];
  
  // Insights
  strengths: string[];
  improvement_areas: string[];
  recurring_challenges: string[];
  
  // Additional metrics
  attendance_rate: number;
  pair_programming_sessions: number;
  leaves_taken: number;
  
  generated_at: Date;
}

// Mentor dashboard interfaces
export interface MenteeOverview {
  student: User;
  pending_goals: number;
  pending_reflections: number;
  latest_goal?: DailyGoal;
  latest_reflection?: DailyReflection;
  average_achievement: number;
  current_phase?: string;
  current_topic?: string;
}

// Mentor change request interface
export interface MentorChangeRequest {
  id: string;
  student_id: string;
  student_name?: string; // Denormalized for easy display
  student_email?: string;
  requested_mentor_id: string;
  requested_mentor_name?: string; // Denormalized for easy display
  current_mentor_id?: string; // Can be null if no current mentor
  current_mentor_name?: string; // Denormalized for easy display
  status: 'pending' | 'approved' | 'rejected';
  reason?: string; // Optional reason from student
  admin_notes?: string; // Optional notes from admin
  created_at: Date;
  reviewed_at?: Date;
  reviewed_by?: string; // Admin user ID who reviewed
}

// Helper type for mentor capacity display
export interface MentorWithCapacity {
  mentor: User;
  current_mentees: number;
  max_mentees: number;
  available_slots: number;
  mentee_names: string[];
}