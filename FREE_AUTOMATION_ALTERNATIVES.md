# 🚀 Free Automation Alternatives (No Firebase Cloud Functions)

## 🎯 Problem
Need to automate Google Sheets sync at specific times WITHOUT Firebase Cloud Functions.

---

## ✅ Solution Options

### Option 1: **GitHub Actions** (Recommended - 100% Free)

**Perfect for your use case!** You already have a GitHub repo.

#### Setup

**1. Create GitHub Action Workflow**

```yaml
# .github/workflows/sync-sheets.yml
name: Daily Google Sheets Sync

on:
  schedule:
    # Runs at 2 AM IST (8:30 PM UTC previous day)
    - cron: '30 20 * * *'
  
  # Allow manual trigger
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm install firebase-admin googleapis
      
      - name: Run sync script
        env:
          FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          GOOGLE_SHEETS_ID: ${{ secrets.GOOGLE_SHEETS_ID }}
          GOOGLE_SERVICE_ACCOUNT: ${{ secrets.GOOGLE_SERVICE_ACCOUNT }}
        run: node scripts/sync-sheets.js
```

**2. Create Sync Script**

```javascript
// scripts/sync-sheets.js
const admin = require('firebase-admin');
const { google } = require('googleapis');

// Initialize Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function syncToSheets() {
  console.log('🔄 Starting Google Sheets sync...');
  
  try {
    // Get last sync time
    const metaDoc = await db.collection('system_metadata')
      .doc('sheets_sync')
      .get();
    
    const lastSync = metaDoc.exists 
      ? metaDoc.data().last_sync_time.toDate() 
      : new Date(0);
    
    console.log(`📅 Last sync: ${lastSync.toISOString()}`);

    // Query only new/updated data
    const [goalsSnap, reflectionsSnap, loginsSnap] = await Promise.all([
      db.collection('daily_goals')
        .where('updated_at', '>', lastSync)
        .orderBy('updated_at', 'asc')
        .get(),
      
      db.collection('daily_reflections')
        .where('updated_at', '>', lastSync)
        .orderBy('updated_at', 'asc')
        .get(),
      
      db.collection('daily_logins')
        .where('login_time', '>', lastSync)
        .orderBy('login_time', 'asc')
        .get()
    ]);

    console.log(`📊 Found: ${goalsSnap.size} goals, ${reflectionsSnap.size} reflections, ${loginsSnap.size} logins`);

    // Initialize Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    // Sync Goals
    if (goalsSnap.size > 0) {
      const goalRows = goalsSnap.docs.map(doc => {
        const data = doc.data();
        return [
          data.created_at?.toDate().toLocaleDateString('en-IN') || '',
          data.student_name || '',
          data.goal_text || '',
          data.target_percentage || '',
          data.status || '',
          data.reviewed_by || '',
          data.mentor_comment || ''
        ];
      });

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Goals!A:G',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: goalRows }
      });

      console.log(`✅ Synced ${goalRows.length} goals`);
    }

    // Sync Reflections
    if (reflectionsSnap.size > 0) {
      const reflectionRows = reflectionsSnap.docs.map(doc => {
        const data = doc.data();
        return [
          data.created_at?.toDate().toLocaleDateString('en-IN') || '',
          data.student_name || '',
          data.goal_id || '',
          JSON.stringify(data.reflection_answers || {}),
          data.status || '',
          data.mentor_notes || ''
        ];
      });

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Reflections!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: reflectionRows }
      });

      console.log(`✅ Synced ${reflectionRows.length} reflections`);
    }

    // Sync Logins
    if (loginsSnap.size > 0) {
      const loginRows = loginsSnap.docs.map(doc => {
        const data = doc.data();
        return [
          data.date || '',
          data.user_name || '',
          data.campus || '',
          data.role || '',
          data.login_time?.toDate().toLocaleTimeString('en-IN') || '',
          data.discord_id || ''
        ];
      });

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Attendance!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: loginRows }
      });

      console.log(`✅ Synced ${loginRows.length} logins`);
    }

    // Update last sync time
    await db.collection('system_metadata')
      .doc('sheets_sync')
      .set({
        last_sync_time: admin.firestore.Timestamp.now(),
        last_sync_status: 'success',
        goals_synced: goalsSnap.size,
        reflections_synced: reflectionsSnap.size,
        logins_synced: loginsSnap.size
      }, { merge: true });

    console.log('✅ Sync completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Sync failed:', error);
    
    // Log error to Firestore
    await db.collection('system_metadata')
      .doc('sheets_sync')
      .set({
        last_sync_status: 'failed',
        last_error: error.message,
        last_error_time: admin.firestore.Timestamp.now()
      }, { merge: true });

    process.exit(1);
  }
}

syncToSheets();
```

**3. Add Secrets to GitHub**

Go to: `Settings > Secrets and variables > Actions > New repository secret`

Add these secrets:
- `FIREBASE_SERVICE_ACCOUNT` - Your Firebase admin SDK JSON
- `GOOGLE_SHEETS_ID` - Your spreadsheet ID
- `GOOGLE_SERVICE_ACCOUNT` - Google Sheets service account JSON

**4. Test Manual Run**

- Go to Actions tab in GitHub
- Click "Daily Google Sheets Sync"
- Click "Run workflow"

#### Advantages ✅
- **100% FREE** - 2,000 minutes/month on GitHub Actions
- **Reliable** - Always runs at scheduled time
- **Easy setup** - Just push YAML file
- **Manual trigger** - Can run anytime from GitHub UI
- **Logs** - View execution logs in GitHub
- **No backend needed** - Runs on GitHub's servers

#### Disadvantages ❌
- Requires GitHub repo (you already have this!)
- 5-minute cron minimum resolution

---

### Option 2: **Vercel Cron Jobs** (Free)

If your app is deployed on Vercel, you can use their cron jobs.

#### Setup

**1. Create API Route**

```typescript
// pages/api/cron/sync-sheets.ts (Next.js)
// OR
// api/sync-sheets.ts (Vercel serverless)

import { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';
import { google } from 'googleapis';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)
    )
  });
}

const db = admin.firestore();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret to prevent unauthorized access
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔄 Starting sync...');

    // Get last sync time
    const metaDoc = await db.collection('system_metadata')
      .doc('sheets_sync')
      .get();
    
    const lastSync = metaDoc.exists 
      ? metaDoc.data()!.last_sync_time.toDate() 
      : new Date(0);

    // Query new data
    const goalsSnap = await db.collection('daily_goals')
      .where('updated_at', '>', lastSync)
      .get();

    // ... (sync logic same as above)

    // Update timestamp
    await db.collection('system_metadata')
      .doc('sheets_sync')
      .set({
        last_sync_time: admin.firestore.Timestamp.now(),
        synced_count: goalsSnap.size
      }, { merge: true });

    return res.status(200).json({ 
      success: true, 
      synced: goalsSnap.size 
    });

  } catch (error: any) {
    console.error('❌ Sync failed:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

**2. Add to vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-sheets",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**3. Add Environment Variables**

In Vercel dashboard:
- `FIREBASE_SERVICE_ACCOUNT`
- `GOOGLE_SHEETS_ID`
- `GOOGLE_SERVICE_ACCOUNT`
- `CRON_SECRET` (generate random string)

#### Advantages ✅
- **FREE** - Hobby plan includes cron jobs
- **Fast** - Edge network
- **Integrated** - With your existing app

#### Disadvantages ❌
- Requires Vercel deployment
- Cron jobs only on Pro plan (was free, may change)

---

### Option 3: **Railway.app Cron** (Free Tier)

Similar to Vercel but with guaranteed free cron.

```yaml
# railway.yml
version: 1

cron:
  - name: sheets-sync
    schedule: "0 2 * * *"
    command: node scripts/sync-sheets.js
```

---

### Option 4: **EasyCron.com** (Free Tier)

External cron service that calls your endpoint.

**1. Create public endpoint in your app**

```typescript
// src/pages/api/sync-sheets.ts
export default async function handler(req, res) {
  // Verify secret
  if (req.headers['x-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Run sync logic
  await syncToSheets();
  
  res.json({ success: true });
}
```

**2. Configure on EasyCron**
- URL: `https://your-app.com/api/sync-sheets`
- Schedule: `0 2 * * *`
- Add header: `X-Cron-Secret: your-secret`

**Free tier**: 20 jobs

---

### Option 5: **Self-Hosted with PM2** (If you have VPS)

```bash
# Install PM2
npm install -g pm2

# Create cron job
pm2 start scripts/sync-sheets.js --cron "0 2 * * *" --no-autorestart
```

---

### Option 6: **Client-Side Background Sync** (Fallback)

Last resort if no backend available.

```typescript
// src/utils/backgroundSync.ts
export class BackgroundSyncService {
  private static SYNC_TIME = '02:00'; // 2 AM
  private static LAST_RUN_KEY = 'last_sync_date';

  static initialize() {
    // Check every 5 minutes
    setInterval(() => {
      this.checkAndSync();
    }, 5 * 60 * 1000);

    // Check on page load
    this.checkAndSync();
  }

  private static async checkAndSync() {
    const today = new Date().toDateString();
    const lastRun = localStorage.getItem(this.LAST_RUN_KEY);

    // Already ran today
    if (lastRun === today) return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Check if within 5-minute window of sync time
    if (this.isNearTime(currentTime, this.SYNC_TIME, 5)) {
      console.log('🔄 Running background sync...');
      
      try {
        await GoogleSheetsService.syncIncremental();
        localStorage.setItem(this.LAST_RUN_KEY, today);
        console.log('✅ Sync completed');
      } catch (error) {
        console.error('❌ Sync failed:', error);
      }
    }
  }

  private static isNearTime(current: string, target: string, windowMinutes: number): boolean {
    const [curH, curM] = current.split(':').map(Number);
    const [tarH, tarM] = target.split(':').map(Number);
    
    const curMinutes = curH * 60 + curM;
    const tarMinutes = tarH * 60 + tarM;
    
    return Math.abs(curMinutes - tarMinutes) <= windowMinutes;
  }
}

// In App.tsx
useEffect(() => {
  BackgroundSyncService.initialize();
}, []);
```

**Disadvantages**:
- ❌ Requires someone to have app open at 2 AM
- ❌ Not reliable
- ❌ Only use as last resort

---

## 📊 Comparison

| Solution | Cost | Reliability | Setup | Best For |
|----------|------|-------------|-------|----------|
| **GitHub Actions** | FREE ✅ | ⭐⭐⭐⭐⭐ | Easy | **RECOMMENDED** |
| **Vercel Cron** | FREE ✅ | ⭐⭐⭐⭐⭐ | Easy | If on Vercel |
| **Railway** | FREE ✅ | ⭐⭐⭐⭐ | Medium | Alternative |
| **EasyCron** | FREE ✅ | ⭐⭐⭐⭐ | Easy | External service |
| **PM2** | FREE ✅ | ⭐⭐⭐⭐⭐ | Medium | If have VPS |
| **Client-Side** | FREE ✅ | ⭐⭐ | Easy | Last resort only |

---

## 🎯 **RECOMMENDED: GitHub Actions**

**Why?**
1. ✅ You already have a GitHub repo
2. ✅ 100% free and reliable
3. ✅ Easy to set up (just add 2 files)
4. ✅ View logs directly in GitHub
5. ✅ Manual trigger anytime
6. ✅ No server/hosting required

**Setup Time**: 10 minutes

---

## 🚀 Quick Start (GitHub Actions)

**Step 1**: Create files
```bash
mkdir -p .github/workflows scripts
```

**Step 2**: Copy workflow YAML (see above)

**Step 3**: Copy sync script (see above)

**Step 4**: Add GitHub secrets

**Step 5**: Push to GitHub
```bash
git add .github/workflows/sync-sheets.yml scripts/sync-sheets.js
git commit -m "Add automated Google Sheets sync"
git push
```

**Step 6**: Test
- Go to GitHub Actions tab
- Click "Run workflow"
- Wait ~30 seconds
- Check logs

Done! 🎉

---

## 💡 Pro Tips

### 1. Add Notifications
Get notified when sync completes:

```yaml
# In GitHub Action
- name: Send Discord notification
  if: success()
  run: |
    curl -X POST ${{ secrets.DISCORD_WEBHOOK_URL }} \
      -H "Content-Type: application/json" \
      -d '{"content":"✅ Daily sync completed!"}'
```

### 2. Multiple Schedules
```yaml
on:
  schedule:
    - cron: '30 2 * * *'   # 2:30 AM daily
    - cron: '0 14 * * *'   # 2:00 PM daily
    - cron: '0 20 * * 0'   # 8:00 PM Sunday (weekly report)
```

### 3. Retry on Failure
```yaml
- name: Run sync with retry
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 5
    max_attempts: 3
    command: node scripts/sync-sheets.js
```

---

## 📝 Summary

**Best Solution**: GitHub Actions
- ✅ FREE forever
- ✅ No Firebase Cloud Functions needed
- ✅ Runs reliably at scheduled time
- ✅ Uses incremental sync (minimal reads)
- ✅ Easy to set up and maintain

**Ready to implement?** I can help you set it up! 🚀
