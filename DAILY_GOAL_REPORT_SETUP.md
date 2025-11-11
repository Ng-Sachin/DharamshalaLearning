# 📊 Daily Goal Attendance Report - Discord Notification

## Overview

Automated daily report that runs at **9:20 AM IST** every day and sends a Discord notification with:
- ✅ Number of students who submitted goals (Present)
- ❌ Number of students who didn't submit goals (Absent)  
- 👥 Names of absent students (comma-separated)
- 📈 Attendance percentage

---

## 🔔 Notification Format

### Example Message:

```
📊 Daily Goal Submission Report
Goal submission status for 2025-11-11

✅ Present (Goals Submitted): 45 students
❌ Absent (No Goals): 8 students
📈 Attendance Rate: 84.9%

👥 Absent Students:
Rahul Kumar, Priya Sharma, Amit Patel, Sneha Gupta, Arjun Singh, Ravi Mehta, Pooja Reddy, Vikram Joshi
```

### When Everyone Submits:

```
📊 Daily Goal Submission Report
Goal submission status for 2025-11-11

✅ Present (Goals Submitted): 53 students
❌ Absent (No Goals): 0 students
📈 Attendance Rate: 100.0%

🎉 Perfect Attendance!
All students have submitted their goals today!
```

---

## ⏰ Schedule

- **Time**: 9:20 AM IST (3:50 AM UTC)
- **Frequency**: Every day
- **Trigger**: Automatic via GitHub Actions

---

## 🎯 What It Checks

### Included Students:
- All users with `role: "student"` in Firestore

### Goal Submission Criteria:
- Checks if student has created a `daily_goals` document today
- Uses IST timezone for "today" calculation
- Considers goal submitted if `created_at` timestamp is within today's date range

---

## 🛠️ Files Created

1. **`scripts/daily-goal-report.js`**
   - Main script that:
     - Fetches all students from Firestore
     - Checks who submitted goals today
     - Calculates attendance statistics
     - Sends formatted Discord notification

2. **`.github/workflows/daily-goal-report.yml`**
   - GitHub Actions workflow
   - Scheduled to run at 9:20 AM IST daily
   - Can also be triggered manually for testing

---

## 🧪 Testing

### Test Immediately:

1. Go to: https://github.com/theemubin/DharamshalaLearning/actions
2. Click on **"Daily Goal Attendance Report"** workflow
3. Click **"Run workflow"** button
4. Check your Discord channel for the report

### What to Verify:
- ✅ Notification appears in Discord
- ✅ Student counts are accurate
- ✅ Absent names are listed correctly
- ✅ Attendance percentage is correct
- ✅ Message formatting looks good

---

## 📝 Customization Options

### Change Report Time:
Edit `.github/workflows/daily-goal-report.yml` line 5:
```yaml
- cron: '50 3 * * *'  # 9:20 AM IST
```

Cron format: `minute hour * * *` (in UTC)
- For 10:00 AM IST: `30 4 * * *`
- For 8:00 AM IST: `30 2 * * *`

### Change Message Format:
Edit `scripts/daily-goal-report.js` around line 140 to customize the Discord embed fields, colors, or text.

### Add More Details:
You can extend the script to include:
- Campus-wise breakdown
- House-wise breakdown
- Week-over-week trends
- Individual student streaks

---

## 🔒 Security

Uses existing GitHub secrets:
- `FIREBASE_SERVICE_ACCOUNT` - To read from Firestore
- `DISCORD_WEBHOOK_URL` - To send notifications

No new secrets needed! ✅

---

## 📊 Data Source

**Firestore Collections:**
- `users` - Gets all students (where `role == "student"`)
- `daily_goals` - Checks for today's goal submissions

**No quota concerns**: This runs once per day and only reads necessary data.

---

## 🚀 Next Steps

1. **Commit and Push** (I'll do this now)
2. **Test the workflow** manually
3. **Let it run automatically** every day at 9:20 AM IST

---

## 💡 Benefits

- **Accountability**: Students know their absence will be reported
- **Visibility**: Admins/mentors see daily participation at a glance
- **Automation**: Zero manual work required
- **Consistency**: Runs reliably every day
- **Transparency**: Everyone can see the attendance in Discord

---

## 🎉 Result

You'll get a beautiful, automated daily report showing who's engaged and who needs a reminder to submit their goals!

**Time saved**: ~15 minutes/day of manual tracking
**Accuracy**: 100% automated, no human error
**Motivation**: Public accountability encourages participation
