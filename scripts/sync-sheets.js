#!/usr/bin/env node

/**
 * Google Sheets Sync Script
 * 
 * Runs as GitHub Action to sync Firestore data to Google Sheets
 * Uses incremental sync - only syncs data changed since last run
 */

const admin = require('firebase-admin');
const { google } = require('googleapis');

// Validate environment variables
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is not set');
  process.exit(1);
}

if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
  console.error('❌ GOOGLE_SERVICE_ACCOUNT environment variable is not set');
  process.exit(1);
}

if (!process.env.GOOGLE_SHEETS_ID) {
  console.error('❌ GOOGLE_SHEETS_ID environment variable is not set');
  process.exit(1);
}

// Parse service accounts with error handling
let serviceAccount;
let googleCredentials;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  console.log('✅ Firebase service account parsed successfully');
} catch (error) {
  console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', error.message);
  console.error('First 50 chars:', process.env.FIREBASE_SERVICE_ACCOUNT?.substring(0, 50));
  process.exit(1);
}

try {
  googleCredentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  console.log('✅ Google service account parsed successfully');
} catch (error) {
  console.error('❌ Failed to parse GOOGLE_SERVICE_ACCOUNT:', error.message);
  console.error('First 50 chars:', process.env.GOOGLE_SERVICE_ACCOUNT?.substring(0, 50));
  process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
}

const db = admin.firestore();

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
console.log('✅ Using Google Sheets ID:', SPREADSHEET_ID);

/**
 * Get Google Sheets client
 */
async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: googleCredentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

/**
 * Get last sync time from Firestore metadata
 */
async function getLastSyncTime() {
  try {
    const metaDoc = await db.collection('system_metadata')
      .doc('sheets_sync')
      .get();
    
    if (!metaDoc.exists) {
      console.log('📅 No previous sync found, will sync all data');
      return new Date(0); // Epoch - sync everything
    }

    const lastSync = metaDoc.data().last_sync_time;
    const lastSyncDate = lastSync ? lastSync.toDate() : new Date(0);
    console.log(`📅 Last sync: ${lastSyncDate.toISOString()}`);
    return lastSyncDate;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return new Date(0); // Default to syncing everything
  }
}

/**
 * Update last sync time
 */
async function updateLastSyncTime(stats) {
  try {
    await db.collection('system_metadata')
      .doc('sheets_sync')
      .set({
        last_sync_time: admin.firestore.FieldValue.serverTimestamp(),
        last_sync_status: 'success',
        goals_synced: stats.goals,
        reflections_synced: stats.reflections,
        logins_synced: stats.logins,
        last_run_at: new Date().toISOString()
      }, { merge: true });
    
    console.log('✅ Updated sync metadata');
  } catch (error) {
    console.error('Error updating sync metadata:', error);
  }
}

/**
 * Sync goals to Google Sheets
 */
async function syncGoals(sheets, since) {
  console.log('\n📊 Syncing goals...');
  
  try {
    let query = db.collection('daily_goals');
    
    if (since && since.getTime() > 0) {
      query = query
        .where('updated_at', '>', admin.firestore.Timestamp.fromDate(since))
        .orderBy('updated_at', 'asc');
    }

    const snapshot = await query.get();
    console.log(`📄 Found ${snapshot.size} goals to sync`);

    if (snapshot.size === 0) {
      return 0;
    }

    const values = snapshot.docs.map(doc => {
      const data = doc.data();
      return [
        data.created_at?.toDate().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }) || '',
        data.student_id || '',
        data.student_name || '',
        data.goal_text || '',
        data.target_percentage || '',
        data.status || '',
        data.reviewed_by || '',
        data.mentor_comment || '',
        data.campus || '',
        data.house || '',
        doc.id // Goal ID for reference
      ];
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Goals!A:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });

    console.log(`✅ Synced ${values.length} goals`);
    return values.length;
  } catch (error) {
    console.error('❌ Error syncing goals:', error);
    throw error;
  }
}

/**
 * Sync reflections to Google Sheets
 */
async function syncReflections(sheets, since) {
  console.log('\n📝 Syncing reflections...');
  
  try {
    let query = db.collection('daily_reflections');
    
    if (since && since.getTime() > 0) {
      query = query
        .where('updated_at', '>', admin.firestore.Timestamp.fromDate(since))
        .orderBy('updated_at', 'asc');
    }

    const snapshot = await query.get();
    console.log(`📄 Found ${snapshot.size} reflections to sync`);

    if (snapshot.size === 0) {
      return 0;
    }

    const values = snapshot.docs.map(doc => {
      const data = doc.data();
      return [
        data.created_at?.toDate().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }) || '',
        data.student_id || '',
        data.student_name || '',
        data.goal_id || '',
        JSON.stringify(data.reflection_answers || {}),
        data.status || '',
        data.mentor_notes || '',
        data.campus || '',
        doc.id // Reflection ID
      ];
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Reflections!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });

    console.log(`✅ Synced ${values.length} reflections`);
    return values.length;
  } catch (error) {
    console.error('❌ Error syncing reflections:', error);
    throw error;
  }
}

/**
 * Sync logins (attendance) to Google Sheets
 */
async function syncLogins(sheets, since) {
  console.log('\n👥 Syncing logins...');
  
  try {
    // Get dates to sync
    const today = new Date();
    const sinceDate = since && since.getTime() > 0 ? since : new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let allLogins = [];

    // Iterate through dates
    for (let date = new Date(sinceDate); date <= today; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      try {
        const loginsSnapshot = await db.collection('daily_logins')
          .doc(dateStr)
          .collection('logins')
          .get();

        loginsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          allLogins.push([
            data.date || dateStr,
            data.user_name || '',
            data.user_email || '',
            data.campus || '',
            data.house || '',
            data.role || '',
            data.discord_user_id || '',
            data.login_time?.toDate().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) || '',
            doc.id // User ID
          ]);
        });
      } catch (error) {
        // Date collection might not exist, continue
        console.log(`No logins for ${dateStr}`);
      }
    }

    console.log(`📄 Found ${allLogins.length} logins to sync`);

    if (allLogins.length === 0) {
      return 0;
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Attendance!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: allLogins }
    });

    console.log(`✅ Synced ${allLogins.length} logins`);
    return allLogins.length;
  } catch (error) {
    console.error('❌ Error syncing logins:', error);
    throw error;
  }
}

/**
 * Main sync function
 */
async function main() {
  console.log('🔄 Starting Google Sheets sync...\n');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`📍 Spreadsheet ID: ${SPREADSHEET_ID}\n`);

  try {
    // Get last sync time
    const lastSync = await getLastSyncTime();

    // Get Google Sheets client
    console.log('🔐 Authenticating with Google Sheets...');
    const sheets = await getGoogleSheetsClient();
    console.log('✅ Authentication successful\n');

    // Sync data
    const stats = {
      goals: await syncGoals(sheets, lastSync),
      reflections: await syncReflections(sheets, lastSync),
      logins: await syncLogins(sheets, lastSync)
    };

    // Update metadata
    await updateLastSyncTime(stats);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ SYNC COMPLETE');
    console.log('='.repeat(50));
    console.log(`Goals synced: ${stats.goals}`);
    console.log(`Reflections synced: ${stats.reflections}`);
    console.log(`Logins synced: ${stats.logins}`);
    console.log(`Total: ${stats.goals + stats.reflections + stats.logins} records`);
    console.log('='.repeat(50) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('❌ SYNC FAILED');
    console.error('='.repeat(50));
    console.error(error);
    console.error('='.repeat(50) + '\n');

    // Update metadata with error
    try {
      await db.collection('system_metadata')
        .doc('sheets_sync')
        .set({
          last_sync_status: 'failed',
          last_error: error.message,
          last_error_time: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (metaError) {
      console.error('Failed to update error metadata:', metaError);
    }

    process.exit(1);
  }
}

// Run the script
main();
