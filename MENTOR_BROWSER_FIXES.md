# Mentor Browser Fixes - October 7, 2025

## Issues Fixed

### 1. ✅ Incorrect House Names in Filters
**Problem:** MentorBrowser filter dropdown showed incorrect house names (Red, Blue, Green, Yellow) instead of the actual house names used in the system.

**Root Cause:** Hard-coded house names in the filter dropdown didn't match the houses defined in the types file.

**Solution:**
- Updated house filter options to match actual house names: **Bageshree**, **Malhar**, **Bhairav**
- These match the house type definition: `house?: 'Bageshree' | 'Malhar' | 'Bhairav'`

**Files Changed:**
- `src/components/Student/MentorBrowser.tsx` (lines 204-210)

**Before:**
```tsx
<option value="Red">Red House</option>
<option value="Blue">Blue House</option>
<option value="Green">Green House</option>
<option value="Yellow">Yellow House</option>
```

**After:**
```tsx
<option value="Bageshree">Bageshree</option>
<option value="Malhar">Malhar</option>
<option value="Bhairav">Bhairav</option>
```

---

### 2. ✅ Incorrect Campus Names in Filters
**Problem:** MentorBrowser filter dropdown showed incorrect campus names (Gurugram, Delhi, Dharamshala, Remote) instead of the actual campuses.

**Root Cause:** Hard-coded campus names didn't match the campus type definition in the types file.

**Solution:**
- Updated campus filter options to match actual campuses from the types file:
  - **Dantewada**
  - **Dharamshala** 
  - **Eternal**
  - **Jashpur**
  - **Kishanganj**
  - **Pune**
  - **Raigarh**
  - **Sarjapura**

**Files Changed:**
- `src/components/Student/MentorBrowser.tsx` (lines 190-202)

**Before:**
```tsx
<option value="Gurugram">Gurugram</option>
<option value="Delhi">Delhi</option>
<option value="Dharamshala">Dharamshala</option>
<option value="Remote">Remote</option>
```

**After:**
```tsx
<option value="Dantewada">Dantewada</option>
<option value="Dharamshala">Dharamshala</option>
<option value="Eternal">Eternal</option>
<option value="Jashpur">Jashpur</option>
<option value="Kishanganj">Kishanganj</option>
<option value="Pune">Pune</option>
<option value="Raigarh">Raigarh</option>
<option value="Sarjapura">Sarjapura</option>
```

---

### 3. ✅ Excessive Console Logging
**Problem:** Console was showing "all mentors are loading" with detailed logs for every user before filtering.

**Root Cause:** The `getAllMentorsWithCapacity()` method in `dataServices.ts` had 7 console.log statements that logged:
- Service start
- Fetching all users message
- Total user count
- Each user being processed with details
- Each mentor's mentee count
- Each mentor's capacity calculation
- Final mentor count

**Solution:**
- Removed all 7 excessive console.log statements from `getAllMentorsWithCapacity()`
- Kept only the error logging for debugging actual issues
- This eliminates the console spam and improves performance

**Files Changed:**
- `src/services/dataServices.ts` (lines 927-973)

**Console Output Before:**
```
🔧 MentorshipService: getAllMentorsWithCapacity started
👥 MentorshipService: Fetching all users
📊 MentorshipService: Got 45 total users
🔍 MentorshipService: Processing user John Doe { id: '123', isSuperMentor: false, ... }
👨‍🎓 MentorshipService: Mentor John Doe has 2 mentees
📈 MentorshipService: Mentor capacity for John Doe { maxMentees: 2, currentMentees: 2, availableSlots: 0 }
[... repeated for all users ...]
🎯 MentorshipService: Returning 45 mentors with capacity
```

**Console Output After:**
```
[Clean - no logs unless error occurs]
```

---

### 4. ✅ Mentor Request Submission Debugging
**Problem:** After finding a mentor and submitting the request, it was failing with "failed to submit request" error.

**Root Cause:** Firebase/Firestore doesn't allow `undefined` values in documents. When a student doesn't have a current mentor (`currentMentorId` is `undefined`), the code was trying to save:
```typescript
{
  current_mentor_id: undefined,  // ❌ Firebase rejects this!
  current_mentor_name: undefined  // ❌ Firebase rejects this!
}
```

**Error Message:**
```
FirebaseError: Function addDoc() called with invalid data. 
Unsupported field value: undefined (found in field current_mentor_id)
```

**Solution:**
1. Added comprehensive debug logging to trace the entire submission flow
2. Fixed the data structure to **conditionally exclude** undefined fields:

```typescript
// Build request data, excluding undefined values
const requestData: any = {
  student_id: studentId,
  student_name: student.name,
  student_email: student.email,
  requested_mentor_id: requestedMentorId,
  requested_mentor_name: requestedMentor.name,
  status: 'pending',
  created_at: new Date()
};

// Only add optional fields if they have values
if (currentMentorId) {
  requestData.current_mentor_id = currentMentorId;
}
if (currentMentor?.name) {
  requestData.current_mentor_name = currentMentor.name;
}
if (reason) {
  requestData.reason = reason;
}
```

This ensures Firebase only receives fields with actual values, not `undefined`.

**Files Changed:**
- `src/components/Student/MentorBrowser.tsx` (lines 110-145)
- `src/services/dataServices.ts` (lines 997-1066)

**Debug Flow:**
```
🚀 MentorBrowser: Starting mentor request submission { currentStudentId, selectedMentor, currentMentorId, reason }
  ↓
🔧 MentorshipService.requestMentorChange called with: { ... }
  ↓
📥 Fetching student info...
📥 Fetching requested mentor info...
📥 Fetching current mentor info...
✅ All user data fetched successfully
  ↓
💾 Creating mentor request document... { requestData }
✅ Request document created with ID: abc123
  ↓
🔄 Updating student pending_mentor_id...
✅ Student updated successfully
  ↓
🎉 Mentor change request completed successfully
  ↓
✅ MentorBrowser: Request submitted successfully { requestId }
```

---

### 5. ✅ Admin Approve/Reject Mentor Request Fix

**Problem:** Admin could not approve or reject mentor change requests. Error occurred when clicking approve/reject buttons.

**Root Cause:** Same Firebase `undefined` value issue - when admin doesn't enter notes, `admin_notes` is `undefined`, and Firebase rejects it:

```
FirebaseError: Function updateDoc() called with invalid data. 
Unsupported field value: undefined (found in field admin_notes)
```

Also, when clearing `pending_mentor_id`, the code was using `undefined` which Firebase doesn't accept.

**Solution:**
1. **Conditionally include `admin_notes`** only if provided:
```typescript
const updateData: any = {
  status: 'approved',
  reviewed_at: new Date(),
  reviewed_by: adminId
};
if (adminNotes) {
  updateData.admin_notes = adminNotes;
}
```

2. **Use empty string instead of undefined** to clear `pending_mentor_id`:
```typescript
// Approve: Assign mentor and clear pending
await UserService.updateUser(request.student_id, {
  mentor_id: request.requested_mentor_id,
  pending_mentor_id: ''  // Empty string works, undefined doesn't
});

// Reject: Just clear pending
await UserService.updateUser(request.student_id, {
  pending_mentor_id: ''  // Empty string works, undefined doesn't
});
```

**Files Changed:**
- `src/services/dataServices.ts` - `approveMentorRequest()` and `rejectMentorRequest()` methods

---

## Testing Instructions

### 1. Test House Filter
1. Login as a student
2. Click "Change Mentor" button
3. Click "Filters" to expand filter options
4. Check house dropdown - should show: **Bageshree**, **Malhar**, **Bhairav**
5. Select each house and verify filtering works

### 2. Test Campus Filter
1. Same as above
2. Check campus dropdown - should show all 8 campuses:
   - Dantewada
   - Dharamshala
   - Eternal
   - Jashpur
   - Kishanganj
   - Pune
   - Raigarh
   - Sarjapura
3. Select each campus and verify filtering works

### 3. Test Console Output
1. Open browser DevTools → Console tab
2. Click "Change Mentor" to open MentorBrowser
3. Console should be **CLEAN** - no mentor loading logs
4. Should only see logs if there's an actual error

### 4. Test Mentor Request Submission
1. Open browser DevTools → Console tab
2. Search for a mentor in higher phase
3. Select a mentor
4. Enter a reason for the request
5. Click "Submit Request"
6. **Watch console** for the debug flow:
   - Should see 🚀 starting submission
   - Should see 🔧 service call
   - Should see 📥 fetching steps
   - Should see ✅ completion messages
7. If it fails, console will show exactly where it failed
8. Success message should appear in UI
9. As admin, check "Mentor Requests" tab to verify request was created

---

## Related Files Modified

1. **src/components/Student/MentorBrowser.tsx**
   - Fixed house filter options (3 houses)
   - Fixed campus filter options (8 campuses)
   - Added debug logging to handleRequestMentor

2. **src/services/dataServices.ts**
   - Removed 7 excessive console.log statements from getAllMentorsWithCapacity
   - Added comprehensive debug logging to requestMentorChange

---

## Notes

- **House Names:** The system uses Indian classical music raga-based house names (Bageshree, Malhar, Bhairav) which relate to colors:
  - Bageshree → Blue theme
  - Bhairav → Orange theme  
  - Malhar → Green theme

- **Campus Names:** These are actual Dharamshala Learning campus locations across India

- **Debug Logging:** The extensive debug logging added to request submission is intentional and should help identify any issues. It can be removed once the system is stable.

- **Parameter Order:** The mentor request function expects parameters in this specific order:
  1. studentId (required)
  2. requestedMentorId (required)
  3. currentMentorId (optional)
  4. reason (optional)
