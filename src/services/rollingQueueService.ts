import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { AcademicAssociateService } from './academicAssociateService';

/**
 * Rolling Queue Entry - Lightweight metadata for queue management
 * Links to existing PairProgrammingSession via session_id
 */
export interface RollingQueueEntry {
  id: string;
  academic_associate_id: string;
  student_id: string;
  session_id: string;
  position: number; // 1-based index in queue
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  campus: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  added_at: Date;
  started_at?: Date;
  completed_at?: Date;
  cancelled_at?: Date;
  notes?: string;
  updated_at: Date;
}

/**
 * Queue Statistics
 */
export interface QueueStats {
  academic_associate_id: string;
  aa_name?: string;
  total_waiting: number;
  total_in_progress: number;
  total_completed: number;
  queue_length: number;
  avg_wait_time_minutes?: number;
  current_session?: RollingQueueEntry;
}

export class RollingQueueService {
  private static COLLECTION = 'rolling_queues';

  /**
   * Create a new queue entry for a session
   * Used when session is assigned to an AA mentor
   */
  static async createQueueEntry(
    sessionId: string,
    studentId: string,
    academicAssociateId: string,
    campus: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<string> {
    try {
      // Get current max position for this AA
      const maxPosition = await this.getMaxPositionForAA(academicAssociateId);
      const newPosition = maxPosition + 1;

      const entry: Omit<RollingQueueEntry, 'id'> = {
        academic_associate_id: academicAssociateId,
        student_id: studentId,
        session_id: sessionId,
        position: newPosition,
        status: 'waiting',
        campus,
        priority,
        added_at: new Date(),
        updated_at: new Date(),
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...entry,
        added_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

      console.log('✅ [RollingQueueService] Created queue entry:', {
        id: docRef.id,
        aa: academicAssociateId,
        student: studentId,
        position: newPosition,
      });

      return docRef.id;
    } catch (error) {
      console.error('❌ [RollingQueueService] Error creating queue entry:', error);
      throw error;
    }
  }

  /**
   * Get entire queue for an Academic Associate
   * Ordered by position (ascending)
   */
  static async getQueueForAA(academicAssociateId: string): Promise<RollingQueueEntry[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('academic_associate_id', '==', academicAssociateId),
        orderBy('position', 'asc')
      );

      const snapshot = await getDocs(q);
      const entries: RollingQueueEntry[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as any;
        entries.push({
          id: doc.id,
          academic_associate_id: data.academic_associate_id,
          student_id: data.student_id,
          session_id: data.session_id,
          position: data.position,
          status: data.status,
          campus: data.campus,
          priority: data.priority,
          added_at: data.added_at?.toDate() || new Date(),
          started_at: data.started_at?.toDate(),
          completed_at: data.completed_at?.toDate(),
          cancelled_at: data.cancelled_at?.toDate(),
          notes: data.notes,
          updated_at: data.updated_at?.toDate() || new Date(),
        });
      });

      console.log(
        `✅ [RollingQueueService] Retrieved queue for AA ${academicAssociateId}: ${entries.length} entries`
      );
      return entries;
    } catch (error) {
      console.error('❌ [RollingQueueService] Error fetching queue:', error);
      throw error;
    }
  }

  /**
   * Get next entry in queue (first 'waiting' entry)
   */
  static async getNextInQueue(academicAssociateId: string): Promise<RollingQueueEntry | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('academic_associate_id', '==', academicAssociateId),
        where('status', '==', 'waiting'),
        orderBy('position', 'asc')
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log(`⚠️ [RollingQueueService] No waiting entries for AA: ${academicAssociateId}`);
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data() as any;

      const entry: RollingQueueEntry = {
        id: doc.id,
        academic_associate_id: data.academic_associate_id,
        student_id: data.student_id,
        session_id: data.session_id,
        position: data.position,
        status: data.status,
        campus: data.campus,
        priority: data.priority,
        added_at: data.added_at?.toDate() || new Date(),
        started_at: data.started_at?.toDate(),
        completed_at: data.completed_at?.toDate(),
        cancelled_at: data.cancelled_at?.toDate(),
        notes: data.notes,
        updated_at: data.updated_at?.toDate() || new Date(),
      };

      console.log(
        `✅ [RollingQueueService] Next in queue for AA ${academicAssociateId}: Position ${entry.position}`
      );
      return entry;
    } catch (error) {
      console.error('❌ [RollingQueueService] Error fetching next entry:', error);
      throw error;
    }
  }

  /**
   * Get entry currently in progress (if any)
   */
  static async getCurrentEntryForAA(
    academicAssociateId: string
  ): Promise<RollingQueueEntry | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('academic_associate_id', '==', academicAssociateId),
        where('status', '==', 'in_progress'),
        orderBy('position', 'asc')
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data() as any;

      return {
        id: doc.id,
        academic_associate_id: data.academic_associate_id,
        student_id: data.student_id,
        session_id: data.session_id,
        position: data.position,
        status: data.status,
        campus: data.campus,
        priority: data.priority,
        added_at: data.added_at?.toDate() || new Date(),
        started_at: data.started_at?.toDate(),
        completed_at: data.completed_at?.toDate(),
        cancelled_at: data.cancelled_at?.toDate(),
        notes: data.notes,
        updated_at: data.updated_at?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('❌ [RollingQueueService] Error fetching current entry:', error);
      throw error;
    }
  }

  /**
   * Advance queue: Mark session complete, move next to in_progress
   * Called when mentor marks a session as completed
   */
  static async advanceQueue(completedSessionId: string): Promise<void> {
    try {
      // Find the completed entry
      const q = query(
        collection(db, this.COLLECTION),
        where('session_id', '==', completedSessionId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.warn(
          `⚠️ [RollingQueueService] No queue entry found for session: ${completedSessionId}`
        );
        return;
      }

      const completedDoc = snapshot.docs[0];
      const completedEntry = completedDoc.data() as any;
      const aaId = completedEntry.academic_associate_id;
      const currentPosition = completedEntry.position;

      // Use batch write for atomic operations
      const batch = writeBatch(db);

      // 1. Mark current entry as completed
      batch.update(completedDoc.ref, {
        status: 'completed',
        completed_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

      // 2. Get next entry (position = currentPosition + 1)
      const nextQ = query(
        collection(db, this.COLLECTION),
        where('academic_associate_id', '==', aaId),
        where('position', '==', currentPosition + 1)
      );

      const nextSnapshot = await getDocs(nextQ);

      if (!nextSnapshot.empty) {
        const nextDoc = nextSnapshot.docs[0];
        batch.update(nextDoc.ref, {
          status: 'in_progress',
          started_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        });

        console.log(
          `✅ [RollingQueueService] Advanced queue for AA ${aaId}: Position ${currentPosition} completed, Position ${currentPosition + 1} started`
        );
      } else {
        console.log(
          `ℹ️ [RollingQueueService] No next entry in queue for AA ${aaId} after position ${currentPosition}`
        );
      }

      await batch.commit();
    } catch (error) {
      console.error('❌ [RollingQueueService] Error advancing queue:', error);
      throw error;
    }
  }

  /**
   * Remove entry from queue and reorder remaining entries
   */
  static async removeFromQueue(queueEntryId: string): Promise<void> {
    try {
      // Fetch by document ID directly
      const entryRef = doc(db, this.COLLECTION, queueEntryId);
      const entrySnapshot = await getDoc(entryRef);

      if (!entrySnapshot.exists()) {
        throw new Error(`Queue entry not found: ${queueEntryId}`);
      }

      const removedEntry = entrySnapshot.data() as any;
      const aaId = removedEntry.academic_associate_id;
      const removedPosition = removedEntry.position;

      const batch = writeBatch(db);

      // 1. Delete the entry
      batch.delete(entryRef);

      // 2. Reorder entries after the removed one
      const entriesAfter = await getDocs(
        query(
          collection(db, this.COLLECTION),
          where('academic_associate_id', '==', aaId),
          where('position', '>', removedPosition)
        )
      );

      entriesAfter.forEach(docSnapshot => {
        const currentPosition = docSnapshot.data().position;
        batch.update(docSnapshot.ref, {
          position: currentPosition - 1,
          updated_at: Timestamp.now(),
        });
      });

      await batch.commit();

      console.log(
        `✅ [RollingQueueService] Removed entry from queue and reordered ${entriesAfter.size} remaining entries`
      );
    } catch (error) {
      console.error('❌ [RollingQueueService] Error removing from queue:', error);
      throw error;
    }
  }

  /**
   * Reorder queue entry to new position
   * Admin operation to move entry up/down in queue
   */
  static async reorderQueue(queueEntryId: string, newPosition: number): Promise<void> {
    try {
      // Get the entry being moved
      const entryRef = doc(db, this.COLLECTION, queueEntryId);
      const entrySnapshot = await getDoc(entryRef);

      if (!entrySnapshot.exists()) {
        throw new Error(`Queue entry not found: ${queueEntryId}`);
      }

      const entry = entrySnapshot.data() as any;
      const aaId = entry.academic_associate_id;
      const oldPosition = entry.position;

      // Get all entries for this AA
      const allQ = query(
        collection(db, this.COLLECTION),
        where('academic_associate_id', '==', aaId),
        orderBy('position', 'asc')
      );
      const allSnapshot = await getDocs(allQ);

      if (newPosition < 1 || newPosition > allSnapshot.size) {
        throw new Error(`Invalid position: ${newPosition}. Queue size: ${allSnapshot.size}`);
      }

      const batch = writeBatch(db);

      // Reorder entries
      if (oldPosition < newPosition) {
        // Moving down - decrement positions between old and new
        allSnapshot.forEach(docSnapshot => {
          const pos = docSnapshot.data().position;
          if (pos > oldPosition && pos <= newPosition) {
            batch.update(docSnapshot.ref, {
              position: pos - 1,
              updated_at: Timestamp.now(),
            });
          }
        });
      } else if (oldPosition > newPosition) {
        // Moving up - increment positions between new and old
        allSnapshot.forEach(docSnapshot => {
          const pos = docSnapshot.data().position;
          if (pos >= newPosition && pos < oldPosition) {
            batch.update(docSnapshot.ref, {
              position: pos + 1,
              updated_at: Timestamp.now(),
            });
          }
        });
      }

      // Update the moved entry
      batch.update(entryRef, {
        position: newPosition,
        updated_at: Timestamp.now(),
      });

      await batch.commit();

      console.log(
        `✅ [RollingQueueService] Reordered entry ${queueEntryId} from position ${oldPosition} to ${newPosition}`
      );
    } catch (error) {
      console.error('❌ [RollingQueueService] Error reordering queue:', error);
      throw error;
    }
  }

  /**
   * Requeue a session for an AA. Optionally insert at the top of the waiting list (right after any in_progress entry).
   * If toTop is false, appends to the end of the queue.
   */
  static async requeueSession(
    sessionId: string,
    studentId: string,
    academicAssociateId: string,
    campus: string,
    options: { priority?: 'low' | 'medium' | 'high' | 'urgent'; toTop?: boolean } = {}
  ): Promise<string> {
    try {
      const priority = options.priority ?? 'medium';
      const toTop = options.toTop ?? true;

      if (!toTop) {
        // Simple append to end of queue
        return await this.createQueueEntry(sessionId, studentId, academicAssociateId, campus, priority);
      }

      // Determine insertion point: right after any current in_progress
      const current = await this.getCurrentEntryForAA(academicAssociateId);
      const insertPosition = current ? current.position + 1 : 1;

      // Shift entries at or after the insert position down by one to make room
      const batch = writeBatch(db);

      const entriesQ = query(
        collection(db, this.COLLECTION),
        where('academic_associate_id', '==', academicAssociateId),
        orderBy('position', 'asc')
      );
      const snapshot = await getDocs(entriesQ);

      snapshot.forEach(docSnapshot => {
        const pos = (docSnapshot.data() as any).position;
        if (pos >= insertPosition) {
          batch.update(docSnapshot.ref, {
            position: pos + 1,
            updated_at: Timestamp.now(),
          });
        }
      });

      // Prepare new entry doc with auto ID
      const newRef = doc(collection(db, this.COLLECTION));
      batch.set(newRef, {
        academic_associate_id: academicAssociateId,
        student_id: studentId,
        session_id: sessionId,
        position: insertPosition,
        status: 'waiting',
        campus,
        priority,
        added_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      });

      await batch.commit();

      console.log(
        `✅ [RollingQueueService] Requeued session ${sessionId} for AA ${academicAssociateId} at position ${insertPosition}`
      );

      return newRef.id;
    } catch (error) {
      console.error('❌ [RollingQueueService] Error requeuing session:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics for an AA
   */
  static async getQueueStats(academicAssociateId: string): Promise<QueueStats> {
    try {
      const entries = await this.getQueueForAA(academicAssociateId);

      const waiting = entries.filter(e => e.status === 'waiting').length;
      const inProgress = entries.filter(e => e.status === 'in_progress').length;
      const completed = entries.filter(e => e.status === 'completed').length;
      const current = entries.find(e => e.status === 'in_progress');

      // Calculate average wait time (in minutes)
      const waitingEntries = entries.filter(e => e.status === 'waiting');
      let avgWaitTime: number | undefined;

      if (waitingEntries.length > 0) {
        const totalWaitMs = waitingEntries.reduce((sum, e) => {
          return sum + (new Date().getTime() - e.added_at.getTime());
        }, 0);
        avgWaitTime = Math.round(totalWaitMs / waitingEntries.length / 60000); // Convert to minutes
      }

      const stats: QueueStats = {
        academic_associate_id: academicAssociateId,
        total_waiting: waiting,
        total_in_progress: inProgress,
        total_completed: completed,
        queue_length: entries.length,
        avg_wait_time_minutes: avgWaitTime,
        current_session: current,
      };

      console.log(
        `✅ [RollingQueueService] Queue stats for AA ${academicAssociateId}:`,
        stats
      );
      return stats;
    } catch (error) {
      console.error('❌ [RollingQueueService] Error fetching queue stats:', error);
      throw error;
    }
  }

  /**
   * Get queue status for all AAs in a campus
   */
  static async getQueueStatusByCampus(campus: string): Promise<QueueStats[]> {
    try {
      // Get all AA assignments for campus
      const assignments = await AcademicAssociateService.getAssignments({ campus });
      const aaIdSet = new Set(assignments.map(a => a.academic_associate_id));
      const aaIds = Array.from(aaIdSet);

      // Get stats for each AA
      const stats = await Promise.all(aaIds.map(aaId => this.getQueueStats(aaId)));

      console.log(
        `✅ [RollingQueueService] Retrieved queue status for ${stats.length} AAs in campus: ${campus}`
      );
      return stats;
    } catch (error) {
      console.error('❌ [RollingQueueService] Error fetching queue status by campus:', error);
      throw error;
    }
  }

  /**
   * Helper: Get max position for an AA (for assigning new position)
   */
  private static async getMaxPositionForAA(academicAssociateId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('academic_associate_id', '==', academicAssociateId),
        orderBy('position', 'desc')
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return 0; // No entries yet, new one will be position 1
      }

      return snapshot.docs[0].data().position;
    } catch (error) {
      console.error('❌ [RollingQueueService] Error getting max position:', error);
      throw error;
    }
  }

  /**
   * Helper: Get entry by ID (for verification/debugging)
   */
  static async getQueueEntryById(entryId: string): Promise<RollingQueueEntry | null> {
    try {
      const entryRef = doc(db, this.COLLECTION, entryId);
      const entrySnap = await getDoc(entryRef);

      if (!entrySnap.exists()) {
        return null;
      }

      const data = entrySnap.data() as any;

      return {
        id: entrySnap.id,
        academic_associate_id: data.academic_associate_id,
        student_id: data.student_id,
        session_id: data.session_id,
        position: data.position,
        status: data.status,
        campus: data.campus,
        priority: data.priority,
        added_at: data.added_at?.toDate() || new Date(),
        started_at: data.started_at?.toDate(),
        completed_at: data.completed_at?.toDate(),
        cancelled_at: data.cancelled_at?.toDate(),
        notes: data.notes,
        updated_at: data.updated_at?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('❌ [RollingQueueService] Error fetching entry:', error);
      throw error;
    }
  }

  /**
   * Helper: Clear all completed entries for an AA (cleanup)
   */
  static async clearCompletedForAA(academicAssociateId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('academic_associate_id', '==', academicAssociateId),
        where('status', '==', 'completed')
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.forEach(docSnapshot => {
        batch.delete(docSnapshot.ref);
      });

      await batch.commit();

      console.log(
        `✅ [RollingQueueService] Cleared ${snapshot.size} completed entries for AA ${academicAssociateId}`
      );
      return snapshot.size;
    } catch (error) {
      console.error('❌ [RollingQueueService] Error clearing completed entries:', error);
      throw error;
    }
  }
}
