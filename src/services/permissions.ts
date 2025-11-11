import { User, DailyGoal, DailyReflection, MentorChangeRequest } from '../types';
import { UserService } from './firestore';

/**
 * Centralized permission checks for role-based access control
 * 
 * Role hierarchy:
 * - Admin: Full access to all resources
 * - Academic Associate: Campus-wide access (all students on their campus)
 * - Super Mentor: Assigned mentees only
 * - Mentor: Assigned mentees only (regular mentor)
 * - Student: Own resources only
 */

/**
 * Check if a user can review (approve/comment on) a specific goal
 * @param user The user attempting to review
 * @param goal The goal being reviewed
 * @returns true if user has permission, false otherwise
 */
export async function canReviewGoal(user: User, goal: DailyGoal): Promise<boolean> {
  // Prevent self-review
  if (user.id === goal.student_id) {
    return false;
  }

  // Admin can review anything
  if (user.isAdmin || user.role === 'admin') {
    console.log('✅ Admin permission granted for goal review');
    return true;
  }

  // Academic Associate can review goals from their entire campus
  if (user.role === 'academic_associate' && user.campus) {
    const student = await UserService.getUserById(goal.student_id);
    const hasPermission = !!student && student.campus === user.campus;
    console.log('🏫 Academic Associate check:', {
      userCampus: user.campus,
      studentCampus: student?.campus,
      hasPermission
    });
    return hasPermission;
  }

  // Super Mentor / Mentor can review goals from their assigned mentees
  if (user.isSuperMentor || user.role === 'super_mentor' || user.role === 'mentor') {
    const assignedMentees = await UserService.getAssignedMentees(user.id);
    return assignedMentees.includes(goal.student_id);
  }

  // Students and users without elevated roles cannot review
  return false;
}

/**
 * Check if a user can review (approve/comment on) a specific reflection
 * @param user The user attempting to review
 * @param reflection The reflection being reviewed
 * @returns true if user has permission, false otherwise
 */
export async function canReviewReflection(user: User, reflection: DailyReflection): Promise<boolean> {
  // Prevent self-review
  if (user.id === reflection.student_id) {
    return false;
  }

  // Admin can review anything
  if (user.isAdmin || user.role === 'admin') {
    console.log('✅ Admin permission granted for reflection review');
    return true;
  }

  // Academic Associate can review reflections from their entire campus
  if (user.role === 'academic_associate' && user.campus) {
    const student = await UserService.getUserById(reflection.student_id);
    const hasPermission = !!student && student.campus === user.campus;
    console.log('🏫 Academic Associate check (reflection):', {
      userCampus: user.campus,
      studentCampus: student?.campus,
      hasPermission
    });
    return hasPermission;
  }

  // Super Mentor / Mentor can review reflections from their assigned mentees
  if (user.isSuperMentor || user.role === 'super_mentor' || user.role === 'mentor') {
    const assignedMentees = await UserService.getAssignedMentees(user.id);
    return assignedMentees.includes(reflection.student_id);
  }

  // Students and users without elevated roles cannot review
  return false;
}

/**
 * Check if a user can approve/reject a mentor change request
 * @param user The user attempting to approve/reject
 * @param request The mentor change request
 * @returns true if user has permission, false otherwise
 */
export async function canApproveMentorChange(user: User, request: MentorChangeRequest): Promise<boolean> {
  // Admin can approve anything
  if (user.isAdmin) {
    return true;
  }

  // Super Mentor can approve requests for their assigned mentees
  if (user.isSuperMentor || user.role === 'super_mentor') {
    const assignedMentees = await UserService.getAssignedMentees(user.id);
    return assignedMentees.includes(request.student_id);
  }

  // Academic Associate can approve requests for their entire campus
  if (user.role === 'academic_associate' && user.campus) {
    const student = await UserService.getUserById(request.student_id);
    return !!student && student.campus === user.campus;
  }

  return false;
}

/**
 * Get user role for display/logging purposes
 * @param user The user
 * @returns Normalized role string
 */
export function getUserRole(user: User): string {
  if (user.isAdmin) return 'admin';
  if (user.role === 'academic_associate') return 'academic_associate';
  if (user.isSuperMentor || user.role === 'super_mentor') return 'super_mentor';
  if (user.role === 'mentor') return 'mentor';
  return 'student';
}
