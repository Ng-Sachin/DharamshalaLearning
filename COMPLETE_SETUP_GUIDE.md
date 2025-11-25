# 🚀 Complete Setup Guide - Discord & Google Sheets Integration

## ✅ Implementation Complete!

All code has been implemented. Follow this guide to configure and deploy.

---

## 📋 What's Been Built

### 1. ✅ Discord Integration
- **Service**: `src/services/discordService.ts`
- **Features**:
  - Individual login notifications
  - Hourly summaries
  - Daily reports
  - Low attendance alerts
  - Rate limiting (30 requests/min)

### 2. ✅ Login Tracking
- **Service**: `src/services/loginTrackingService.ts`
- **Integration**: Auto-tracks in `AuthContext.tsx`
- **Storage**: `daily_logins/{date}/logins/{user_id}`
- **Features**:
  - localStorage deduplication
  - Automatic Discord notifications
  - Query by date/range

### 3. ✅ Google Sheets Sync
- **Client Service**: `src/services/googleSheetsService.ts`
- **Server Script**: `scripts/sync-sheets.js`
- **Workflow**: `.github/workflows/sync-sheets.yml`
- **Features**:
  - Incremental sync (only new data)
  - Automated at 2 AM IST
  - Manual CSV export for admins
  - Sync statistics dashboard

### 4. ✅ Discord ID Field
- **UI**: `ProfileCompletionModal.tsx` updated
- **Schema**: Already in `types/index.ts` as `discord_user_id`
- **Validation**: Optional field for mentions

---

## 🔧 Setup Instructions

### Step 1: Get Discord Webhook URL

1. Open Discord server
2. Go to Server Settings > Integrations > Webhooks
3. Click "New Webhook"
4. Name it "Campus Dashboard"
5. Choose channel (e.g., #attendance)
6. Copy webhook URL
7. Save for later

**Format**: `https://discord.com/api/webhooks/XXXXX/YYYYY`

---

### Step 2: Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click ⚙️ Settings > Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Download JSON file
7. Save entire JSON content for GitHub secrets

---

### Step 3: Setup Google Sheets

#### 3.1 Create Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet
3. Name it "Campus Learning Dashboard Data"
4. Create 3 sheets (tabs):
   - **Goals** - with headers: Date, Student ID, Student Name, Goal Text, Target %, Status, Reviewed By, Mentor Comment, Campus, House, Goal ID
   - **Reflections** - with headers: Date, Student ID, Student Name, Goal ID, Reflection Answers, Status, Mentor Notes, Campus, Reflection ID
   - **Attendance** - with headers: Date, User Name, Email, Campus, House, Role, Discord ID, Login Time, User ID
5. Copy spreadsheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```

#### 3.2 Create Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Enable Google Sheets API:
   - Go to APIs & Services > Library
   - Search "Google Sheets API"
   - Click Enable
4. Create service account:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "Service Account"
   - Name it "sheets-sync-service"
   - Click "Create and Continue"
   - Skip optional steps, click "Done"
5. Create key:
   - Click on the service account
   - Go to "Keys" tab
   - Add Key > Create New Key > JSON
   - Download JSON file
6. Share spreadsheet:
   - Copy service account email (from JSON: `client_email`)
   - Open your Google Sheet
   - Click "Share"
   - Paste service account email
   - Give "Editor" permission
   - Uncheck "Notify people"
   - Click "Share"

---

### Step 4: Add GitHub Secrets

1. Go to your GitHub repository
2. Click Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add these 4 secrets:

#### Secret 1: FIREBASE_SERVICE_ACCOUNT
```
Name: FIREBASE_SERVICE_ACCOUNT
Value: (Paste entire Firebase service account JSON)
```

#### Secret 2: GOOGLE_SERVICE_ACCOUNT
```
Name: GOOGLE_SERVICE_ACCOUNT
Value: (Paste entire Google service account JSON)
```

#### Secret 3: GOOGLE_SHEETS_ID
```
Name: GOOGLE_SHEETS_ID
Value: (Your spreadsheet ID from Step 3.1)
```

#### Secret 4: DISCORD_WEBHOOK_URL
```
Name: DISCORD_WEBHOOK_URL
Value: (Your Discord webhook URL from Step 1)
```

---

### Step 5: Add Environment Variable (Client-Side)

1. Open your project
2. Create or update `.env` file:
   ```env
   VITE_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/XXXXX/YYYYY
   ```
3. Add to `.env.production`:
   ```env
   VITE_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/XXXXX/YYYYY
   ```
4. **Important**: `.env` is already in `.gitignore`, don't commit it!

---

### Step 6: Initialize Firestore Metadata

Run this once to create the metadata collection:

```bash
cd scripts
npm install
node init-metadata.js
```

**Expected output**:
```
🔄 Initializing Firestore metadata...
✅ Created system_metadata/sheets_sync document
✅ Metadata initialization complete!
```

---

### Step 7: Test Discord Notifications

1. Open browser console
2. Run this code:
   ```javascript
   import { DiscordService } from './services/discordService';
   await DiscordService.testConnection();
   ```
3. Check Discord channel for test message

---

### Step 8: Test Login Tracking

1. Log out of your app
2. Log back in
3. Check Firestore:
   - Go to Firestore console
   - Navigate to `daily_logins/{today}/logins/{your_user_id}`
   - Should see your login record
4. Check Discord:
   - Should receive login notification

---

### Step 9: Test GitHub Actions Sync

#### Manual Test:

1. Go to GitHub repository
2. Click "Actions" tab
3. Click "Daily Google Sheets Sync"
4. Click "Run workflow" > "Run workflow"
5. Wait ~30 seconds
6. Click on the run to see logs
7. Check Google Sheets - should have data!

#### Check Logs:

```
🔄 Starting Google Sheets sync...
📅 Last sync: 1970-01-01T00:00:00.000Z
✅ Synced 42 goals
✅ Synced 28 reflections
✅ Synced 95 logins
✅ SYNC COMPLETE
```

---

## 📊 How It Works

### Discord Notifications

**When user logs in** (automatic):
1. AuthContext detects login
2. LoginTrackingService saves to Firestore
3. DiscordService sends notification
4. Rate-limited to 30/min

**Daily summary** (manual or scheduled):
```javascript
import { LoginTrackingService } from './services/loginTrackingService';
await LoginTrackingService.sendDailySummary();
```

### Google Sheets Sync

**Automated** (GitHub Actions at 2 AM IST):
1. Workflow triggers at scheduled time
2. Script queries Firestore for new data since last sync
3. Appends new rows to Google Sheets
4. Updates metadata with timestamp
5. Sends Discord notification on success/failure

**Manual** (Admin panel):
```javascript
import { GoogleSheetsService } from './services/googleSheetsService';

// Get stats
const stats = await GoogleSheetsService.getSyncStatistics();

// Export CSV
await GoogleSheetsService.exportGoalsToCSV();
await GoogleSheetsService.exportReflectionsToCSV();
await GoogleSheetsService.exportLoginsToCSV();
```

---

## 🔍 Troubleshooting

### Discord notifications not working?

1. Check webhook URL is correct
2. Check environment variable: `import.meta.env.VITE_DISCORD_WEBHOOK_URL`
3. Check browser console for errors
4. Verify rate limiting (max 30/min)

### GitHub Actions failing?

1. Check all 4 secrets are added
2. Verify JSON format is valid
3. Check Google Sheets is shared with service account
4. View workflow logs for detailed error

### Spreadsheet not updating?

1. Verify spreadsheet ID is correct
2. Check service account has Editor permission
3. Verify sheet names match: "Goals", "Reflections", "Attendance"
4. Check column headers match expected format

### Login tracking not working?

1. Check Firestore rules allow writes to `daily_logins`
2. Verify user is authenticated
3. Check browser console for errors
4. Clear localStorage and try again

---

## 📈 Monitoring

### View Sync Status:

```javascript
import { GoogleSheetsService } from './services/googleSheetsService';

const metadata = await GoogleSheetsService.getLastSyncMetadata();
console.log(metadata);
// {
//   last_sync_time: Date,
//   last_sync_status: 'success',
//   goals_synced: 42,
//   reflections_synced: 28,
//   logins_synced: 95
// }
```

### View Today's Logins:

```javascript
import { LoginTrackingService } from './services/loginTrackingService';

const count = await LoginTrackingService.getTodayLoginCount();
const logins = await LoginTrackingService.getTodayLogins();
console.log(`${count} logins today`);
```

### Check Firestore Reads:

The incremental sync is optimized:
- **First sync**: ~8,000 reads (one-time)
- **Daily sync**: ~50-100 reads (only new data)
- **Monthly**: ~10,000 reads total (vs 243,000 without optimization!)

---

## 🚀 Next Steps

### Optional Enhancements:

1. **Admin Dashboard**:
   - Add sync button in admin panel
   - Show sync statistics
   - Display last sync time

2. **Scheduled Daily Summary**:
   - Add another GitHub Action for end-of-day Discord summary
   - Or create admin button to trigger manually

3. **Alerts**:
   - Low attendance notifications
   - Sync failure alerts
   - Weekly reports

4. **Analytics**:
   - Attendance trends
   - Goal completion rates
   - Active users by campus

---

## 🎉 You're All Set!

Everything is implemented and ready to use. Just follow the setup steps above to configure secrets and you'll have:

✅ Automatic login tracking
✅ Discord notifications
✅ Daily Google Sheets sync
✅ Zero cost (all within free tiers)
✅ Optimized Firestore reads

**Questions?** Check the planning documents:
- `DISCORD_ATTENDANCE_PLAN.md` - Full Discord integration details
- `GOOGLE_SHEETS_SYNC_AUTOMATION.md` - Sync optimization strategies
- `FREE_AUTOMATION_ALTERNATIVES.md` - Alternative solutions

Happy tracking! 🎊
