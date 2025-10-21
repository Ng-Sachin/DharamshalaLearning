# Phase 3 Quick Start Guide

## TL;DR - Start Here

**Goal**: Build admin UI to assign students to Academic Associates  
**Time**: 2-3 hours  
**Files to Create**: 1 new service file + modify 1 admin component  
**Outcome**: Persistent AA-student mappings in Firestore ready for Phase 4 queue  

---

## Step-by-Step Walkthrough

### STEP 1: Add Data Types (15 minutes)

**File**: `src/types/index.ts`

**Add at the end:**

```typescript
// Academic Associate Types
export interface AcademicAssociateAssignment {
  id: string;
  academic_associate_id: string;
  student_ids: string[];
  campus: string;
  house?: string;
  phase?: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  notes?: string;
}

export interface StudentAAMapping {
  student_id: string;
  academic_associate_id: string;
  campus: string;
  house?: string;
  phase?: string;
  assigned_at: Date;
  assigned_by: string;
}
```

---

### STEP 2: Create AcademicAssociateService (45 minutes)

**File**: `src/services/academicAssociateService.ts` (NEW)

```typescript
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { AcademicAssociateAssignment, StudentAAMapping } from '../types';
import { UserService } from './firestore';

export class AcademicAssociateService {
  private static COLLECTION = 'academic_associate_assignments';

  // Create new assignment
  static async createAssignment(
    academicAssociateId: string,
    studentIds: string[],
    campus: string,
    createdBy: string,
    house?: string,
    phase?: string,
    notes?: string
  ): Promise<string> {
    try {
      const assignment = {
        academic_associate_id: academicAssociateId,
        student_ids: studentIds,
        campus,
        house,
        phase,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
        created_by: createdBy,
        notes,
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), assignment);
      console.log('✅ [AcademicAssociateService] Created assignment:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ [AcademicAssociateService] Error creating assignment:', error);
      throw error;
    }
  }

  // Get all assignments (with optional filters)
  static async getAssignments(filters?: {
    campus?: string;
    house?: string;
    phase?: string;
  }): Promise<AcademicAssociateAssignment[]> {
    try {
      let q: any = collection(db, this.COLLECTION);
      const constraints = [];

      if (filters?.campus) {
        constraints.push(where('campus', '==', filters.campus));
      }
      if (filters?.house) {
        constraints.push(where('house', '==', filters.house));
      }
      if (filters?.phase) {
        constraints.push(where('phase', '==', filters.phase));
      }

      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }

      const snapshot = await getDocs(q);
      const assignments: AcademicAssociateAssignment[] = [];

      snapshot.forEach(doc => {
        assignments.push({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate() || new Date(),
          updated_at: doc.data().updated_at?.toDate() || new Date(),
        } as AcademicAssociateAssignment);
      });

      console.log(`✅ [AcademicAssociateService] Retrieved ${assignments.length} assignments`);
      return assignments;
    } catch (error) {
      console.error('❌ [AcademicAssociateService] Error fetching assignments:', error);
      throw error;
    }
  }

  // Get students assigned to an AA
  static async getAssignedStudents(academicAssociateId: string): Promise<StudentAAMapping[]> {
    try {
      const assignments = await this.getAssignments();
      const aaAssignment = assignments.find(a => a.academic_associate_id === academicAssociateId);

      if (!aaAssignment) {
        return [];
      }

      const mappings: StudentAAMapping[] = aaAssignment.student_ids.map(studentId => ({
        student_id: studentId,
        academic_associate_id: academicAssociateId,
        campus: aaAssignment.campus,
        house: aaAssignment.house,
        phase: aaAssignment.phase,
        assigned_at: aaAssignment.created_at,
        assigned_by: aaAssignment.created_by,
      }));

      return mappings;
    } catch (error) {
      console.error('❌ [AcademicAssociateService] Error fetching assigned students:', error);
      throw error;
    }
  }

  // Get AA for a student (if assigned)
  static async getStudentAcademicAssociate(studentId: string): Promise<AcademicAssociateAssignment | null> {
    try {
      const assignments = await this.getAssignments();
      const assignment = assignments.find(a => a.student_ids.includes(studentId));
      return assignment || null;
    } catch (error) {
      console.error('❌ [AcademicAssociateService] Error fetching student AA:', error);
      throw error;
    }
  }

  // Add student to assignment
  static async addStudentToAssignment(studentId: string, academicAssociateId: string): Promise<void> {
    try {
      const assignments = await this.getAssignments();
      const assignment = assignments.find(a => a.academic_associate_id === academicAssociateId);

      if (!assignment) {
        throw new Error(`Assignment not found for AA: ${academicAssociateId}`);
      }

      if (assignment.student_ids.includes(studentId)) {
        throw new Error(`Student ${studentId} already assigned to this AA`);
      }

      const updatedStudentIds = [...assignment.student_ids, studentId];
      await updateDoc(doc(db, this.COLLECTION, assignment.id), {
        student_ids: updatedStudentIds,
        updated_at: Timestamp.now(),
      });

      console.log(`✅ [AcademicAssociateService] Added student ${studentId} to AA ${academicAssociateId}`);
    } catch (error) {
      console.error('❌ [AcademicAssociateService] Error adding student:', error);
      throw error;
    }
  }

  // Remove student from assignment
  static async removeStudentFromAssignment(studentId: string, academicAssociateId: string): Promise<void> {
    try {
      const assignments = await this.getAssignments();
      const assignment = assignments.find(a => a.academic_associate_id === academicAssociateId);

      if (!assignment) {
        throw new Error(`Assignment not found for AA: ${academicAssociateId}`);
      }

      const updatedStudentIds = assignment.student_ids.filter(id => id !== studentId);
      await updateDoc(doc(db, this.COLLECTION, assignment.id), {
        student_ids: updatedStudentIds,
        updated_at: Timestamp.now(),
      });

      console.log(`✅ [AcademicAssociateService] Removed student ${studentId} from AA ${academicAssociateId}`);
    } catch (error) {
      console.error('❌ [AcademicAssociateService] Error removing student:', error);
      throw error;
    }
  }

  // Update assignment
  static async updateAssignment(
    id: string,
    updates: Partial<Omit<AcademicAssociateAssignment, 'id' | 'created_at' | 'created_by'>>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, id), {
        ...updates,
        updated_at: Timestamp.now(),
      });
      console.log('✅ [AcademicAssociateService] Updated assignment:', id);
    } catch (error) {
      console.error('❌ [AcademicAssociateService] Error updating assignment:', error);
      throw error;
    }
  }

  // Delete assignment
  static async deleteAssignment(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, id));
      console.log('✅ [AcademicAssociateService] Deleted assignment:', id);
    } catch (error) {
      console.error('❌ [AcademicAssociateService] Error deleting assignment:', error);
      throw error;
    }
  }
}
```

---

### STEP 3: Update CampusScheduleAdmin (60 minutes)

**File**: `src/components/Admin/CampusScheduleAdmin.tsx`

Add new state and handlers:

```tsx
// Add to component state
const [showAAForm, setShowAAForm] = useState(false);
const [aaAssignments, setAAAssignments] = useState<AcademicAssociateAssignment[]>([]);
const [loadingAA, setLoadingAA] = useState(true);

// Load assignments on mount
useEffect(() => {
  loadAAAssignments();
}, [campusId]);

const loadAAAssignments = async () => {
  try {
    setLoadingAA(true);
    const assignments = await AcademicAssociateService.getAssignments({
      campus: campusId,
    });
    setAAAssignments(assignments);
  } catch (error) {
    console.error('Error loading AA assignments:', error);
  } finally {
    setLoadingAA(false);
  }
};

// Handler to save new assignment
const handleSaveAAAssignment = async (
  academicAssociateId: string,
  studentIds: string[],
  house?: string,
  phase?: string,
  notes?: string
) => {
  try {
    await AcademicAssociateService.createAssignment(
      academicAssociateId,
      studentIds,
      campusId,
      userData?.id || '',
      house,
      phase,
      notes
    );
    setShowAAForm(false);
    await loadAAAssignments();
    // Show success toast
  } catch (error) {
    console.error('Error saving AA assignment:', error);
    // Show error toast
  }
};

const handleDeleteAAAssignment = async (id: string) => {
  if (!window.confirm('Delete this assignment?')) return;
  try {
    await AcademicAssociateService.deleteAssignment(id);
    await loadAAAssignments();
  } catch (error) {
    console.error('Error deleting assignment:', error);
  }
};
```

Add new section in render (after existing admin sections):

```tsx
{/* Academic Associates Section */}
<div className="mt-8">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-xl font-semibold text-gray-900">Academic Associates</h3>
    <button
      onClick={() => setShowAAForm(true)}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      + New Assignment
    </button>
  </div>

  {loadingAA ? (
    <div className="text-center py-8">Loading...</div>
  ) : (
    <div className="bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
              Academic Associate
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
              Students
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
              House
            </th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
              Phase
            </th>
            <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {aaAssignments.map(assignment => (
            <tr key={assignment.id} className="border-t">
              <td className="px-6 py-3 text-sm text-gray-900">
                {assignment.academic_associate_id}
              </td>
              <td className="px-6 py-3 text-sm text-gray-600">
                {assignment.student_ids.length} students
              </td>
              <td className="px-6 py-3 text-sm text-gray-600">
                {assignment.house || '-'}
              </td>
              <td className="px-6 py-3 text-sm text-gray-600">
                {assignment.phase || '-'}
              </td>
              <td className="px-6 py-3 text-right">
                <button
                  onClick={() => handleDeleteAAAssignment(assignment.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {aaAssignments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No assignments yet
        </div>
      )}
    </div>
  )}

  {/* Assignment Form Modal */}
  {showAAForm && (
    <AAAssignmentForm
      campus={campusId}
      onSave={handleSaveAAAssignment}
      onClose={() => setShowAAForm(false)}
    />
  )}
</div>
```

---

### STEP 4: Create AAAssignmentForm Component (60 minutes)

**File**: `src/components/Admin/AAAssignmentForm.tsx` (NEW)

This is a simple form component that:
- Selects an Academic Associate
- Filters students by house and phase
- Multi-selects students
- Saves assignment

---

### STEP 5: Test & Verify

1. **Build**: `npm run build` (should succeed)
2. **Create Assignment**: Admin panel → Academic Associates → "+ New Assignment"
3. **Verify Firestore**: Check `academic_associate_assignments` collection
4. **Test Filters**: Try different house/phase combinations
5. **Persistence**: Reload page, assignments should still show

---

## Quick Reference

### Key Files
- ✅ Create: `src/services/academicAssociateService.ts`
- ✅ Create: `src/components/Admin/AAAssignmentForm.tsx`
- ✅ Update: `src/types/index.ts` (add types)
- ✅ Update: `src/components/Admin/CampusScheduleAdmin.tsx` (add section)

### Key Methods
```typescript
// Use in components like this:
await AcademicAssociateService.createAssignment(aaId, studentIds, campus, userId);
await AcademicAssociateService.getAssignments({ campus, house, phase });
await AcademicAssociateService.getAssignedStudents(aaId);
await AcademicAssociateService.deleteAssignment(id);
```

### Firestore Collection
```
academic_associate_assignments/
  ├─ doc_id_1/
  │  ├─ academic_associate_id: string
  │  ├─ student_ids: string[]
  │  ├─ campus: string
  │  ├─ house: string (optional)
  │  ├─ phase: string (optional)
  │  ├─ created_at: Timestamp
  │  ├─ updated_at: Timestamp
  │  ├─ created_by: string
  │  └─ notes: string
  └─ doc_id_2/ ...
```

---

## Timeline

| Task | Time |
|------|------|
| Add types | 15 min |
| AcademicAssociateService | 45 min |
| UI section in CampusScheduleAdmin | 45 min |
| AAAssignmentForm component | 45 min |
| Testing & fixes | 15 min |
| **Total** | **2.5 hours** |

---

## Success = Phase 4 Ready

Once Phase 3 is complete:
- ✅ Admins can assign students to AAs
- ✅ Data persists in Firestore
- ✅ Ready for Phase 4 rolling queue logic

**Ready to code?** Start with STEP 1! 🚀
