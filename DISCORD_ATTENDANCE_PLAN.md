# 📋 Discord Attendance Notification & Google Sheets Integration Plan

## 🎯 Overview

**Goal**: Automatically notify Discord when users log in, showing who's present with their names, and sync data to Google Sheets.

---

## 📊 Feature Breakdown

### 1. Discord ID Collection in Profile
### 2. Login Tracking & Notifications
### 3. Discord Webhook Integration
### 4. Cloud Function Requirements
### 5. Google Sheets Database Sync

---

## 1️⃣ Discord ID Collection in Profile Page

### Current State
- Profile page exists with basic user info
- Need to add Discord ID field

### Implementation Plan

#### A. Update User Type
**File**: `src/types/index.ts`

```typescript
export interface User {
  // ... existing fields
  discord_id?: string;          // Discord username or ID
  discord_webhook_url?: string; // Optional: Campus-specific webhook
}
```

#### B. Update Profile UI
**File**: `src/pages/ProfilePage.tsx` (or wherever profile is)

**Add Field**:
```typescript
<div className="form-group">
  <label>Discord Username</label>
  <input
    type="text"
    value={discordId}
    onChange={(e) => setDiscordId(e.target.value)}
    placeholder="username#1234 or user ID"
  />
  <small>Optional: For attendance notifications</small>
</div>
```

#### C. Update Firestore Rules
**File**: `firestore.rules`

```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow update: if request.auth.uid == userId && 
    request.resource.data.discord_id is string;
}
```

**Firestore Writes**: 1 write per profile update

---

## 2️⃣ Login Tracking & Notifications

### Current State
- `AuthContext.tsx` handles authentication
- Need to track daily logins

### Implementation Options

#### Option A: Client-Side Tracking (Recommended for Start)
**Pros**:
- No cloud functions needed
- Simpler to implement
- Works with current setup

**Cons**:
- Users can potentially bypass
- Requires user to fully load app

**Implementation**:

**File**: `src/contexts/AuthContext.tsx`

```typescript
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      const userData = await UserService.getUserById(firebaseUser.uid);
      setUser(userData);
      
      // Track daily login
      await trackDailyLogin(userData);
    }
  });
}, []);

const trackDailyLogin = async (user: User) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const loginKey = `login_${today}_${user.id}`;
  
  // Check if already logged today (use localStorage to avoid duplicate calls)
  const alreadyLogged = localStorage.getItem(loginKey);
  if (alreadyLogged) return;
  
  try {
    // Record login in Firestore
    await LoginService.recordLogin({
      user_id: user.id,
      user_name: user.name,
      email: user.email,
      campus: user.campus,
      role: user.role,
      discord_id: user.discord_id,
      login_time: new Date(),
      date: today
    });
    
    localStorage.setItem(loginKey, 'true');
    
    // Trigger Discord notification
    await notifyDiscordLogin(user);
  } catch (error) {
    console.error('Error tracking login:', error);
  }
};
```

**Firestore Structure**:
```
daily_logins/
  ├── 2024-12-10/
  │   ├── user1_id: { name, time, campus }
  │   ├── user2_id: { name, time, campus }
  ├── 2024-12-11/
      ├── user1_id: { name, time, campus }
```

**Firestore Operations**: 
- 1 write per user per day
- 1 read to check existing login (with cache)

#### Option B: Cloud Functions (For Production)
**Pros**:
- Server-side validation
- Cannot be bypassed
- More reliable

**Cons**:
- Requires backend infrastructure
- More complex setup

---

## 3️⃣ Discord Webhook Integration

### Current State
- Discord webhook URL exists in environment/config
- Need to send formatted messages

### Implementation Plan

#### A. Create Discord Service
**File**: `src/services/discordService.ts`

```typescript
import { User } from '../types';

interface LoginRecord {
  user_id: string;
  user_name: string;
  campus: string;
  login_time: Date;
  discord_id?: string;
}

export class DiscordService {
  private static WEBHOOK_URL = process.env.REACT_APP_DISCORD_WEBHOOK_URL || '';
  
  // Campus-specific webhooks (optional)
  private static CAMPUS_WEBHOOKS: { [key: string]: string } = {
    'Dharamshala': process.env.REACT_APP_DISCORD_WEBHOOK_DHARAMSHALA || '',
    'Bangalore': process.env.REACT_APP_DISCORD_WEBHOOK_BANGALORE || '',
    // Add more campuses
  };

  /**
   * Send individual login notification
   */
  static async notifyLogin(user: User): Promise<void> {
    const webhook = this.CAMPUS_WEBHOOKS[user.campus || ''] || this.WEBHOOK_URL;
    if (!webhook) return;

    const message = {
      username: "Attendance Bot",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
      embeds: [{
        title: "✅ User Logged In",
        description: `${user.name} has logged into the system`,
        color: 3066993, // Green
        fields: [
          {
            name: "Campus",
            value: user.campus || 'Unknown',
            inline: true
          },
          {
            name: "Role",
            value: user.role || 'Student',
            inline: true
          },
          {
            name: "Time",
            value: new Date().toLocaleTimeString('en-IN', {
              timeZone: 'Asia/Kolkata',
              hour: '2-digit',
              minute: '2-digit'
            }),
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: user.discord_id || user.email
        }
      }]
    };

    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('Discord notification failed:', error);
    }
  }

  /**
   * Send daily attendance summary
   * Call this periodically or on-demand
   */
  static async sendAttendanceSummary(
    campus: string,
    logins: LoginRecord[]
  ): Promise<void> {
    const webhook = this.CAMPUS_WEBHOOKS[campus] || this.WEBHOOK_URL;
    if (!webhook) return;

    const presentList = logins
      .map((l, i) => `${i + 1}. **${l.user_name}** - ${l.login_time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`)
      .join('\n');

    const message = {
      username: "Attendance Bot",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
      embeds: [{
        title: `📊 Daily Attendance - ${campus}`,
        description: `**${logins.length} students** logged in today`,
        color: 3447003, // Blue
        fields: [
          {
            name: "Present Today",
            value: presentList || "No one logged in yet",
            inline: false
          },
          {
            name: "Date",
            value: new Date().toLocaleDateString('en-IN'),
            inline: true
          }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('Discord summary failed:', error);
    }
  }

  /**
   * Send attendance alert if low attendance
   */
  static async sendAttendanceAlert(
    campus: string,
    presentCount: number,
    totalExpected: number
  ): Promise<void> {
    const webhook = this.CAMPUS_WEBHOOKS[campus] || this.WEBHOOK_URL;
    if (!webhook) return;

    const percentage = (presentCount / totalExpected) * 100;
    
    if (percentage >= 70) return; // Only alert if < 70%

    const message = {
      username: "Attendance Bot",
      embeds: [{
        title: "⚠️ Low Attendance Alert",
        description: `Only ${presentCount}/${totalExpected} students (${percentage.toFixed(1)}%) logged in today`,
        color: 15158332, // Red
        timestamp: new Date().toISOString()
      }]
    };

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  }
}
```

**Network Calls**: 
- 1 HTTP POST per notification
- Rate limit: 30 requests per minute per webhook

---

## 4️⃣ Where to Pick Up Login Events

### Option A: Client-Side (Current Approach - No Cloud Functions)

**Trigger Point**: `AuthContext.tsx` after user authentication

```typescript
// src/contexts/AuthContext.tsx
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      const userData = await UserService.getUserById(firebaseUser.uid);
      setUser(userData);
      
      // ✅ PICKUP POINT 1: Right after login
      await LoginTrackingService.trackLogin(userData);
    }
  });
}, []);
```

**Advantages**:
- ✅ No backend needed
- ✅ Works with current Firebase setup
- ✅ Easy to implement
- ✅ No additional costs

**Disadvantages**:
- ❌ Can be bypassed (user closes tab before tracking)
- ❌ Depends on client internet
- ❌ Not 100% reliable

### Option B: Firebase Auth Triggers (Requires Cloud Functions)

**Setup Required**:
```bash
# Install Firebase Functions
npm install -g firebase-tools
firebase init functions
```

**File**: `functions/src/index.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// ✅ PICKUP POINT 2: Server-side auth trigger
export const onUserLogin = functions.auth.user().onCreate(async (user) => {
  // This only fires on FIRST login (account creation)
  // Not suitable for daily tracking
});

// Better approach: Firestore trigger on login collection
export const onLoginRecorded = functions.firestore
  .document('daily_logins/{date}/{userId}')
  .onCreate(async (snap, context) => {
    const loginData = snap.data();
    
    // Send Discord notification
    await sendDiscordNotification(loginData);
    
    // Update Google Sheets
    await updateGoogleSheets(loginData);
  });
```

**Platform Options for Cloud Functions**:

1. **Firebase Cloud Functions** (Google Cloud Platform)
   - **Cost**: Free tier: 2M invocations/month
   - **Setup**: Already using Firebase
   - **Pros**: Integrated with Firestore
   - **Cons**: Requires billing account

2. **Vercel Serverless Functions**
   - **Cost**: Free tier: 100GB-hours
   - **Setup**: Simple deployment
   - **Pros**: Good free tier
   - **Cons**: Need to connect to Firebase

3. **AWS Lambda**
   - **Cost**: Free tier: 1M requests/month
   - **Setup**: More complex
   - **Pros**: Very scalable
   - **Cons**: Learning curve

### Option C: Scheduled Cloud Function (Hybrid Approach)

**Best of Both Worlds**:
- Client records login in Firestore (simple write)
- Cloud function runs periodically (every hour) to send summaries

```typescript
// Runs every hour
export const sendHourlyAttendanceSummary = functions.pubsub
  .schedule('0 * * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all logins for today
    const loginsSnapshot = await admin.firestore()
      .collection('daily_logins')
      .doc(today)
      .collection('logins')
      .get();
    
    const logins = loginsSnapshot.docs.map(doc => doc.data());
    
    // Send to Discord (one summary per campus)
    const campuses = [...new Set(logins.map(l => l.campus))];
    
    for (const campus of campuses) {
      const campusLogins = logins.filter(l => l.campus === campus);
      await DiscordService.sendAttendanceSummary(campus, campusLogins);
    }
  });
```

**Firestore Reads**: 
- Approximately 100-200 reads per day (depending on user count)
- Each scheduled run reads all logins for the day

---

## 5️⃣ Google Sheets Integration

### Setup Requirements

#### A. Enable Google Sheets API

```bash
# Install required package
npm install googleapis
```

#### B. Service Account Setup

1. Go to Google Cloud Console
2. Enable Google Sheets API
3. Create Service Account
4. Download credentials JSON
5. Share Google Sheet with service account email

#### C. Implementation

**File**: `src/services/googleSheetsService.ts` (or Cloud Function)

```typescript
import { google } from 'googleapis';

export class GoogleSheetsService {
  private static sheets = google.sheets('v4');
  private static SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
  
  private static async getAuthClient() {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    return auth.getClient();
  }

  /**
   * Sync daily logins to Google Sheets
   */
  static async syncDailyLogins(date: string, logins: LoginRecord[]): Promise<void> {
    const auth = await this.getAuthClient();
    
    const values = logins.map(login => [
      date,
      login.user_name,
      login.campus,
      login.role,
      login.login_time.toLocaleTimeString('en-IN'),
      login.discord_id || ''
    ]);

    // Append to sheet
    await this.sheets.spreadsheets.values.append({
      auth: auth as any,
      spreadsheetId: this.SPREADSHEET_ID,
      range: 'Attendance!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          ['Date', 'Name', 'Campus', 'Role', 'Login Time', 'Discord ID'],
          ...values
        ]
      }
    });
  }

  /**
   * Sync all goals to Google Sheets
   */
  static async syncGoals(): Promise<void> {
    const auth = await this.getAuthClient();
    
    // Get all goals from Firestore
    const goalsSnapshot = await admin.firestore()
      .collection('daily_goals')
      .limit(1000) // Adjust as needed
      .get();
    
    const values = goalsSnapshot.docs.map(doc => {
      const goal = doc.data();
      return [
        goal.created_at?.toDate().toISOString().split('T')[0],
        goal.student_id,
        goal.goal_text,
        goal.target_percentage,
        goal.status,
        goal.reviewed_by || '',
        goal.mentor_comment || ''
      ];
    });

    // Clear and update sheet
    await this.sheets.spreadsheets.values.clear({
      auth: auth as any,
      spreadsheetId: this.SPREADSHEET_ID,
      range: 'Goals!A:G'
    });

    await this.sheets.spreadsheets.values.update({
      auth: auth as any,
      spreadsheetId: this.SPREADSHEET_ID,
      range: 'Goals!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          ['Date', 'Student ID', 'Goal', 'Target %', 'Status', 'Reviewer', 'Comment'],
          ...values
        ]
      }
    });
  }

  /**
   * Sync all reflections
   */
  static async syncReflections(): Promise<void> {
    // Similar to syncGoals
  }
}
```

### Firestore Read Calculations

#### Scenario 1: Daily Login Sync
```
Users: 100 students
Firestore Reads: 100 reads per day (one per user)
Google Sheets API Calls: 1 batch write per day
Cost: Free tier covers this easily
```

#### Scenario 2: Full Database Sync
```
Collections to Sync:
- Users: 100 users = 100 reads
- Goals: 5000 goals = 5000 reads
- Reflections: 3000 reflections = 3000 reads
- Reviews: 500 reviews = 500 reads

Total: 8,600 reads per full sync
```

#### Firestore Pricing
```
Free Tier: 50,000 reads per day
Paid: $0.06 per 100,000 reads

Monthly Full Sync (daily):
- 8,600 reads/day × 30 days = 258,000 reads/month
- Cost: $0.16/month (well within free tier)

Hourly Login Sync:
- 100 reads/hour × 24 hours × 30 days = 72,000 reads/month
- Cost: FREE (within free tier)
```

#### Google Sheets API Limits
```
Free Tier:
- 100 requests per 100 seconds per user
- 500 requests per 100 seconds per project

For your use case:
- 1 sync per hour = 24 requests/day
- Well within limits
```

---

## 🎯 Recommended Implementation Roadmap

### Phase 1: Basic Setup (Week 1)
**No Cloud Functions Required**

1. ✅ Add Discord ID field to user profile
2. ✅ Create `discordService.ts`
3. ✅ Create `loginTrackingService.ts`
4. ✅ Add login tracking in `AuthContext.tsx`
5. ✅ Test Discord notifications

**Firestore Operations**:
- Writes: 100-200 per day (login records)
- Reads: Minimal (cached user data)

### Phase 2: Enhanced Notifications (Week 2)
**Still No Cloud Functions**

1. ✅ Add attendance summary component in admin panel
2. ✅ Manual "Send Summary" button
3. ✅ Campus-wise filtering
4. ✅ Export to CSV feature

### Phase 3: Google Sheets Integration (Week 3)
**Requires Cloud Function or Backend**

**Option A: Manual Sync**
- Admin clicks "Sync to Sheets" button
- Runs client-side with service account
- Simple, no automation

**Option B: Scheduled Sync**
- Use Firebase Cloud Functions
- Runs daily at specific time
- Automatic, reliable

### Phase 4: Advanced Features (Week 4)
**Full Cloud Functions Setup**

1. ✅ Automatic hourly summaries
2. ✅ Low attendance alerts
3. ✅ Real-time Google Sheets sync
4. ✅ Historical reports

---

## 💰 Cost Analysis

### Current Setup (No Cloud Functions)
```
Firestore:
- 50,000 reads/day: FREE
- 20,000 writes/day: FREE
- Your usage: ~200 writes/day (logins)
- Cost: $0/month ✅

Discord Webhooks:
- Unlimited (rate limited)
- Cost: FREE ✅

Total: $0/month
```

### With Cloud Functions
```
Firebase Cloud Functions:
- Free tier: 2M invocations/month
- Free tier: 400,000 GB-seconds compute
- Your usage: ~720 invocations/month (hourly cron)
- Cost: $0/month (within free tier) ✅

Google Sheets API:
- Free tier: Plenty for your use
- Cost: $0/month ✅

Total: $0/month ✅
```

### If You Exceed Free Tier (Future)
```
Firebase:
- Blaze (Pay as you go) plan
- Estimated: $1-5/month for your scale

Alternative: Vercel/Netlify Functions
- Better free tier
- Easier deployment
- Cost: $0/month ✅
```

---

## 🚀 Quick Start Implementation

### Step 1: Add Discord ID Field (20 minutes)

```typescript
// src/pages/ProfilePage.tsx
const [discordId, setDiscordId] = useState(userData?.discord_id || '');

const handleSave = async () => {
  await UserService.updateUser(userData.id, {
    discord_id: discordId
  });
};

// In JSX:
<input
  type="text"
  value={discordId}
  onChange={(e) => setDiscordId(e.target.value)}
  placeholder="username#1234"
/>
```

### Step 2: Create Discord Service (30 minutes)

Create the file I showed above: `src/services/discordService.ts`

### Step 3: Track Logins (30 minutes)

```typescript
// src/services/loginTrackingService.ts
export class LoginTrackingService {
  static async trackLogin(user: User): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const loginKey = `login_${today}_${user.id}`;
    
    // Check localStorage to avoid duplicates
    if (localStorage.getItem(loginKey)) return;
    
    // Record in Firestore
    await FirestoreService.create('daily_logins', {
      user_id: user.id,
      user_name: user.name,
      campus: user.campus,
      login_time: new Date(),
      date: today
    });
    
    localStorage.setItem(loginKey, 'true');
    
    // Notify Discord
    await DiscordService.notifyLogin(user);
  }
}
```

### Step 4: Integrate in AuthContext (10 minutes)

```typescript
// src/contexts/AuthContext.tsx
import { LoginTrackingService } from '../services/loginTrackingService';

useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      const userData = await UserService.getUserById(firebaseUser.uid);
      setUser(userData);
      
      // Track login
      LoginTrackingService.trackLogin(userData);
    }
  });
}, []);
```

---

## 📊 Data Structure

### Firestore Collections

```javascript
// daily_logins/{date}/logins/{userId}
{
  user_id: "abc123",
  user_name: "John Doe",
  email: "john@example.com",
  campus: "Dharamshala",
  role: "student",
  discord_id: "john#1234",
  login_time: Timestamp,
  date: "2024-12-10"
}

// users/{userId}
{
  // ... existing fields
  discord_id: "username#1234"
}
```

### Google Sheets Structure

**Sheet 1: Daily Attendance**
| Date | Name | Campus | Role | Login Time | Discord ID |
|------|------|--------|------|------------|------------|
| 2024-12-10 | John | Dharamshala | Student | 09:30 AM | john#1234 |

**Sheet 2: Goals**
| Date | Student | Goal | Target % | Status | Reviewer |
|------|---------|------|----------|--------|----------|
| 2024-12-10 | John | Complete Module 1 | 80 | approved | mentor1 |

---

## 🎯 Summary & Next Steps

### Immediate Action Items:

1. **Start with Phase 1** (No cloud functions needed)
   - Add Discord ID field ✅
   - Setup login tracking ✅
   - Test Discord notifications ✅

2. **Environment Variables** to add:
```env
REACT_APP_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
REACT_APP_DISCORD_WEBHOOK_DHARAMSHALA=https://discord.com/api/webhooks/...
REACT_APP_DISCORD_WEBHOOK_BANGALORE=https://discord.com/api/webhooks/...
```

3. **Firestore Reads Estimate**:
   - Daily logins: 100-200 reads
   - Full sync to Sheets: 8,600 reads
   - **Total monthly**: ~10,000 reads (FREE tier covers 1.5M reads/month)

4. **Decision Point**:
   - Start WITHOUT cloud functions (client-side tracking)
   - Move to cloud functions later if needed
   - This keeps costs at $0 and simplifies development

### Want me to implement any specific part first?

I can start with:
- [ ] Discord ID field in profile
- [ ] Discord service implementation
- [ ] Login tracking service
- [ ] Google Sheets service (needs service account)

Let me know which one to start with! 🚀
