# Attendance Tracking Setup Guide

## Quick Setup Instructions

The attendance tracking system is now fully integrated and ready to use! Here's how to get started:

### 1. ✅ Firebase Configuration (Already Complete)
- ✅ Firestore rules deployed
- ✅ Firestore indexes deployed  
- ✅ Firebase configuration integrated

### 2. 🚀 Start Using the System

The attendance tracking will work automatically as soon as:
1. Students submit goals and get them approved
2. Students submit reflections
3. Admin accesses the attendance dashboard

**No additional setup required!** The system will:
- Auto-create collections when first data is submitted
- Calculate attendance in real-time
- Update statistics automatically

### 3. 📊 Access the Dashboard

1. **Login as Admin** to your Campus Learning Dashboard
2. **Navigate to**: Admin → User Management
3. **Find**: "Daily Attendance Tracking" section (appears after user statistics cards)
4. **Use Features**:
   - Date picker (defaults to today)
   - Campus filter (all or specific campus)
   - Real-time statistics cards
   - "My Mentees" section for admin oversight

### 4. 🎯 How Attendance Works

**Present = Approved Goals + Submitted Reflections**

Students are marked "present" for a day when they have:
- ✅ At least one **approved** goal for that date
- ✅ At least one **submitted** reflection for that date

### 5. 📈 What You'll See

**Statistics Cards:**
- **Total Students**: Active students (excludes those on leave)
- **Goals Approved**: Students with approved goals (with %)
- **Reflections Submitted**: Students with submitted reflections (with %)
- **Students Present**: Students meeting both criteria (attendance rate)

**My Mentees Section:**
- Search mentees by name/email
- Individual attendance rates
- Admin can override mentor functions

### 6. 🔧 Real-time Updates

The dashboard automatically updates when:
- Goals are approved/disapproved by mentors
- Students submit new reflections
- User status changes (active/inactive/on leave)
- Date or campus filter is changed

### 7. 📱 Mobile Support

The attendance dashboard is fully responsive and works great on:
- Desktop computers
- Tablets
- Mobile phones
- Touch-friendly controls

## That's It! 🎉

Your attendance tracking system is **ready to use right now**. Just login as admin and check the User Management section. The system will start tracking attendance as soon as students begin submitting goals and reflections.

## Troubleshooting

If you don't see the attendance dashboard:
1. Ensure you're logged in as an **admin user**
2. Navigate to **Admin → User Management**
3. Look for "Daily Attendance Tracking" section
4. Check browser console for any errors

If no data appears:
1. Ensure students have submitted goals and reflections
2. Verify goals have been approved by mentors
3. Check the date picker is set to a day with activity
4. Try different campus filters

## Need Help?

Refer to the comprehensive guide: `ATTENDANCE_TRACKING_GUIDE.md` for detailed technical information, customization options, and advanced troubleshooting.