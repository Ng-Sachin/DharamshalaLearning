import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { User, MentorAvailability } from '../types';
import { queryCache } from '../utils/cache';
// Lightweight performance instrumentation for Firestore reads
const firestorePerf = {
  totalReads: 0,
  ops: [] as Array<{ type: 'getDoc' | 'getDocs'; collection: string; count: number; ms: number }>,
  log(op: { type: 'getDoc' | 'getDocs'; collection: string; count: number; ms: number }) {
    this.totalReads += op.count;
    this.ops.push(op);
    if (process.env.NODE_ENV === 'development') {
      console.log(`📘[FS] ${op.collection} ${op.type} count=${op.count} ms=${op.ms.toFixed(1)}`);
    }
  },
  summary() {
    const byCollection: Record<string, number> = {};
    for (const op of this.ops) {
      byCollection[op.collection] = (byCollection[op.collection] || 0) + op.count;
    }
    console.log('📊 Firestore Read Summary:', { totalReads: this.totalReads, byCollection });
  },
  reset() {
    this.totalReads = 0;
    this.ops = [];
  }
};

// Utility function to convert Firestore Timestamps to JavaScript Dates
function convertTimestampsToDates(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Timestamp) {
    return obj.toDate();
  }

  if (Array.isArray(obj)) {
    return obj.map(convertTimestampsToDates);
  }

  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    converted[key] = convertTimestampsToDates(value);
  }
  return converted;
}

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  PHASES: 'phases',
  TOPICS: 'topics',
  DAILY_GOALS: 'daily_goals',
  DAILY_REFLECTIONS: 'daily_reflections',
  PAIR_PROGRAMMING_REQUESTS: 'pair_programming_requests',
  PAIR_PROGRAMMING_SESSIONS: 'pair_programming_sessions',
  PAIR_PROGRAMMING_GOALS: 'pair_programming_goals',
  MENTOR_FEEDBACK: 'mentor_feedback',
  MENTEE_FEEDBACK: 'mentee_feedback',
  SESSION_COMPLETIONS: 'session_completions',
  LEAVE_REQUESTS: 'leave_requests',
  LEAVE_IMPACTS: 'leave_impacts',
  NOTIFICATIONS: 'notifications',
  REMINDER_SETTINGS: 'reminder_settings',
  ATTENDANCE: 'attendance',
  MENTOR_NOTES: 'mentor_notes',
  STUDENT_PROGRESS: 'student_progress',
  MENTEE_REVIEWS: 'mentee_reviews',
  MENTEE_REVIEW_CATEGORIES: 'mentee_review_categories',
  MENTOR_AVAILABILITY: 'mentor_availability',
  CAMPUS_SCHEDULES: 'campus_schedules',
  HOUSE_STATS: 'house_stats'
};

// Generic CRUD operations
export class FirestoreService {
  // Compound query support
  static async getWhereCompound<T>(
    collectionName: string,
    conditions: Array<{ field: string; operator: any; value: any }>,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'desc'
  ): Promise<T[]> {
    const start = performance.now();
    try {
      let queryConstraints: any[] = conditions.map(cond => where(cond.field, cond.operator, cond.value));
      if (orderByField) {
        queryConstraints.push(orderBy(orderByField, orderDirection));
      }
      const q = query(collection(db, collectionName), ...queryConstraints);
      const querySnapshot = await getDocs(q);
      firestorePerf.log({ type: 'getDocs', collection: collectionName, count: querySnapshot.size, ms: performance.now() - start });
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestampsToDates(doc.data())
      })) as T[];
    } catch (error) {
      console.error(`Error in compound query for ${collectionName}:`, error);
      throw error;
    }
  }
  // Create document
  static async create<T>(collectionName: string, data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Create document with specific ID
  static async createWithId<T>(collectionName: string, id: string, data: Omit<T, 'id'>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, {
        ...data,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
    } catch (error) {
      console.error(`Error creating document with ID in ${collectionName}:`, error);
      throw error;
    }
  }

  // Get document by ID
  static async getById<T>(collectionName: string, id: string): Promise<T | null> {
    const start = performance.now();
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      firestorePerf.log({ type: 'getDoc', collection: collectionName, count: 1, ms: performance.now() - start });
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...convertTimestampsToDates(docSnap.data()) } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Get all documents from collection
  static async getAll<T>(
    collectionName: string,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'desc',
    limitCount?: number
  ): Promise<T[]> {
    const start = performance.now();
    try {
      let q = collection(db, collectionName);
      let queryConstraints: any[] = [];

      if (orderByField) {
        queryConstraints.push(orderBy(orderByField, orderDirection));
      }

      if (limitCount) {
        queryConstraints.push(limit(limitCount));
      }

      const queryRef = queryConstraints.length > 0 ? query(q, ...queryConstraints) : q;
      const querySnapshot = await getDocs(queryRef);
      firestorePerf.log({ type: 'getDocs', collection: collectionName, count: querySnapshot.size, ms: performance.now() - start });
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestampsToDates(doc.data())
      })) as T[];
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // Get documents with where clause
  static async getWhere<T>(
    collectionName: string,
    field: string,
    operator: any,
    value: any,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'desc'
  ): Promise<T[]> {
    const start = performance.now();
    try {
      let queryConstraints: any[] = [where(field, operator, value)];

      if (orderByField) {
        queryConstraints.push(orderBy(orderByField, orderDirection));
      }

      const q = query(collection(db, collectionName), ...queryConstraints);
      const querySnapshot = await getDocs(q);
      firestorePerf.log({ type: 'getDocs', collection: collectionName, count: querySnapshot.size, ms: performance.now() - start });
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestampsToDates(doc.data())
      })) as T[];
    } catch (error) {
      console.error(`Error querying documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // Update document
  static async update<T>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, 'id'>>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updated_at: Timestamp.now()
      });
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete document
  static async delete(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Subscribe to document changes
  static subscribeToDocument<T>(
    collectionName: string,
    id: string,
    callback: (data: T | null) => void
  ): Unsubscribe {
    const docRef = doc(db, collectionName, id);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as T);
      } else {
        callback(null);
      }
    });
  }

  // Subscribe to collection changes
  static subscribeToCollection<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    whereField?: string,
    whereOperator?: any,
    whereValue?: any
  ): Unsubscribe {
    let q = collection(db, collectionName);
    
    if (whereField && whereOperator && whereValue) {
      q = query(collection(db, collectionName), where(whereField, whereOperator, whereValue)) as any;
    }

    return onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      callback(data);
    });
  }

  // Update multiple documents matching conditions
  static async updateWhere<T extends { id: string }>(
    collectionName: string,
    conditions: Array<{ field: string; operator: any; value: any }>,
    updates: Partial<T>
  ): Promise<void> {
    try {
      const documents = await this.getWhereCompound<T>(collectionName, conditions);
      
      const updatePromises = documents.map(doc => 
        this.update<T>(collectionName, doc.id, updates)
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error(`Error updating documents in ${collectionName}:`, error);
      throw error;
    }
  }

  // Delete multiple documents matching conditions
  static async deleteWhere(
    collectionName: string,
    conditions: Array<{ field: string; operator: any; value: any }>
  ): Promise<void> {
    try {
      const documents = await this.getWhereCompound<any>(collectionName, conditions);
      
      const deletePromises = documents.map(doc => 
        deleteDoc(doc(db, collectionName, doc.id))
      );
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error(`Error deleting documents from ${collectionName}:`, error);
      throw error;
    }
  }
}
export class UserService extends FirestoreService {
  static async createUser(userData: Omit<User, 'id'>): Promise<string> {
    const result = await this.create<User>(COLLECTIONS.USERS, userData);
    // Invalidate user-related caches
    queryCache.invalidatePattern('users');
    return result;
  }

  static async createUserWithId(id: string, userData: Omit<User, 'id'>): Promise<void> {
    await this.createWithId<User>(COLLECTIONS.USERS, id, userData);
    // Invalidate user-related caches
    queryCache.invalidatePattern('users');
  }

  static async getUserById(id: string): Promise<User | null> {
    // Cache individual user docs to avoid repeated reads in the same session
    return queryCache.get<User | null>(
      `users:id:${id}`,
      async () => this.getById<User>(COLLECTIONS.USERS, id),
      5 * 60 * 1000 // 5 minutes
    );
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getWhere<User>(COLLECTIONS.USERS, 'email', '==', email);
    return users.length > 0 ? users[0] : null;
  }

  static async getAdminUsers(): Promise<User[]> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('isAdmin', '==', true));
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push(convertTimestampsToDates({
        id: doc.id,
        ...doc.data()
      }) as User);
    });
    
    return users;
  }

  static async getStudentsByMentor(mentorId: string): Promise<User[]> {
    return queryCache.get<User[]>(
      `users:mentor:${mentorId}`,
      async () => {
        const q = query(
          collection(db, COLLECTIONS.USERS),
          where('mentor_id', '==', mentorId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...convertTimestampsToDates(doc.data())
        })) as User[];
      },
      5 * 60 * 1000
    );
  }

  // For student-mentors - same implementation as getStudentsByMentor
  static async getStudentsByStudentMentor(mentorId: string): Promise<User[]> {
    return this.getStudentsByMentor(mentorId);
  }

  static async getStudentsWithoutMentor(): Promise<User[]> {
    return this.getWhere<User>(COLLECTIONS.USERS, 'mentor_id', '==', null);
  }

  static async updateUser(id: string, userData: Partial<User>): Promise<void> {
    await this.update<User>(COLLECTIONS.USERS, id, userData);
    // Invalidate user-related caches
    queryCache.invalidatePattern('users');
  }

  static async assignMentorToStudent(studentId: string, mentorId: string): Promise<void> {
    return this.updateUser(studentId, { mentor_id: mentorId });
  }

  // Fetch mentees assigned to a specific mentor
  static async getAssignedMentees(mentorId: string): Promise<string[]> {
    try {
      const mentees = await this.getWhere<User>(COLLECTIONS.USERS, 'mentor_id', '==', mentorId);
      return mentees.map(mentee => mentee.id);
    } catch (error) {
      console.error('Error fetching assigned mentees:', error);
      throw error;
    }
  }

  static async getUsersByHouse(house: string): Promise<User[]> {
    try {
      return await queryCache.get<User[]>(
        `users:house:${house}`,
        async () => this.getWhere<User>(COLLECTIONS.USERS, 'house', '==', house),
        5 * 60 * 1000
      );
    } catch (error) {
      console.error('Error fetching users by house:', error);
      throw error;
    }
  }

  static async getUsersByCampus(campus: string): Promise<User[]> {
    try {
      return await queryCache.get<User[]>(
        `users:campus:${campus}`,
        async () => this.getWhere<User>(COLLECTIONS.USERS, 'campus', '==', campus),
        5 * 60 * 1000
      );
    } catch (error) {
      console.error('Error fetching users by campus:', error);
      throw error;
    }
  }

  // Mentor Availability Methods
  static async getMentorAvailability(mentorId: string): Promise<MentorAvailability[]> {
    try {
      return await this.getWhere<MentorAvailability>(COLLECTIONS.MENTOR_AVAILABILITY, 'mentor_id', '==', mentorId);
    } catch (error) {
      console.error('Error fetching mentor availability:', error);
      throw error;
    }
  }

  static async saveMentorAvailability(availability: Omit<MentorAvailability, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      // Check if availability slot already exists
      const existing = await this.getWhereCompound<MentorAvailability>(
        COLLECTIONS.MENTOR_AVAILABILITY,
        [
          { field: 'mentor_id', operator: '==', value: availability.mentor_id },
          { field: 'day_of_week', operator: '==', value: availability.day_of_week },
          { field: 'start_time', operator: '==', value: availability.start_time }
        ]
      );

      if (existing.length > 0) {
        // Update existing
        await this.update<MentorAvailability>(COLLECTIONS.MENTOR_AVAILABILITY, existing[0].id, {
          ...availability,
          updated_at: new Date()
        });
        return existing[0].id;
      } else {
        // Create new
        return await this.create<MentorAvailability>(COLLECTIONS.MENTOR_AVAILABILITY, availability);
      }
    } catch (error) {
      console.error('Error saving mentor availability:', error);
      throw error;
    }
  }

  static async saveBulkMentorAvailability(availabilitySlots: Omit<MentorAvailability, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    try {
      const promises = availabilitySlots.map(slot => this.saveMentorAvailability(slot));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error saving bulk mentor availability:', error);
      throw error;
    }
  }

  static async deleteMentorAvailability(mentorId: string, dayOfWeek: string, startTime: string): Promise<void> {
    try {
      const existing = await this.getWhereCompound<MentorAvailability>(
        COLLECTIONS.MENTOR_AVAILABILITY,
        [
          { field: 'mentor_id', operator: '==', value: mentorId },
          { field: 'day_of_week', operator: '==', value: dayOfWeek },
          { field: 'start_time', operator: '==', value: startTime }
        ]
      );

      if (existing.length > 0) {
        await this.delete(COLLECTIONS.MENTOR_AVAILABILITY, existing[0].id);
      }
    } catch (error) {
      console.error('Error deleting mentor availability:', error);
      throw error;
    }
  }
}