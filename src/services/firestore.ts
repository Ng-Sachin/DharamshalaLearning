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
import { User } from '../types';

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
  ATTENDANCE: 'attendance',
  MENTOR_NOTES: 'mentor_notes',
  LEAVE_REQUESTS: 'leave_requests',
  STUDENT_PROGRESS: 'student_progress'
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
    try {
      let queryConstraints: any[] = conditions.map(cond => where(cond.field, cond.operator, cond.value));
      if (orderByField) {
        queryConstraints.push(orderBy(orderByField, orderDirection));
      }
      const q = query(collection(db, collectionName), ...queryConstraints);
      const querySnapshot = await getDocs(q);
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
  static async create<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string> {
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
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
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
    try {
      let queryConstraints: any[] = [where(field, operator, value)];

      if (orderByField) {
        queryConstraints.push(orderBy(orderByField, orderDirection));
      }

      const q = query(collection(db, collectionName), ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
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
}

// User-specific operations
export class UserService extends FirestoreService {
  static async createUser(userData: Omit<User, 'id'>): Promise<string> {
    return this.create<User>(COLLECTIONS.USERS, userData);
  }

  static async createUserWithId(id: string, userData: Omit<User, 'id'>): Promise<void> {
    return this.createWithId<User>(COLLECTIONS.USERS, id, userData);
  }

  static async getUserById(id: string): Promise<User | null> {
    return this.getById<User>(COLLECTIONS.USERS, id);
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
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('mentor_id', '==', mentorId),
      where('mentor_id', '==', mentorId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestampsToDates(doc.data())
    })) as User[];
  }

  // For student-mentors - same implementation as getStudentsByMentor
  static async getStudentsByStudentMentor(mentorId: string): Promise<User[]> {
    return this.getStudentsByMentor(mentorId);
  }

  static async getStudentsWithoutMentor(): Promise<User[]> {
    return this.getWhere<User>(COLLECTIONS.USERS, 'mentor_id', '==', null);
  }

  static async updateUser(id: string, userData: Partial<User>): Promise<void> {
    return this.update<User>(COLLECTIONS.USERS, id, userData);
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
}