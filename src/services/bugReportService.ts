import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface BugReport {
  id?: string;
  description: string;
  consoleLogs?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  reviewed: boolean;
  submittedAt: Date;
}

class BugReportService {
  private collectionName = 'bug_reports';

  /**
   * Submit a new bug report
   */
  async submitReport(
    description: string,
    consoleLogs: string,
    userId?: string,
    userName?: string,
    userEmail?: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, this.collectionName), {
        description,
        consoleLogs: consoleLogs || '',
        userId: userId || 'anonymous',
        userName: userName || 'Anonymous User',
        userEmail: userEmail || '',
        reviewed: false,
        submittedAt: Timestamp.now()
      });
      console.log('Bug report submitted successfully');
    } catch (error) {
      console.error('Error submitting bug report:', error);
      throw new Error('Failed to submit bug report');
    }
  }

  /**
   * Get all bug reports (for admin)
   */
  async getAllReports(): Promise<BugReport[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('submittedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate() || new Date()
      } as BugReport));
    } catch (error) {
      console.error('Error fetching bug reports:', error);
      throw new Error('Failed to fetch bug reports');
    }
  }

  /**
   * Mark a report as reviewed
   */
  async markAsReviewed(reportId: string): Promise<void> {
    try {
      const reportRef = doc(db, this.collectionName, reportId);
      await updateDoc(reportRef, {
        reviewed: true
      });
      console.log('Report marked as reviewed');
    } catch (error) {
      console.error('Error marking report as reviewed:', error);
      throw new Error('Failed to update report status');
    }
  }

  /**
   * Get unreviewed reports count
   */
  async getUnreviewedCount(): Promise<number> {
    try {
      const reports = await this.getAllReports();
      return reports.filter(r => !r.reviewed).length;
    } catch (error) {
      console.error('Error getting unreviewed count:', error);
      return 0;
    }
  }
}

export const bugReportService = new BugReportService();
