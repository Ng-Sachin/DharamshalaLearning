#!/usr/bin/env node

/**
 * Daily Goal Attendance Report
 * 
 * Sends a Discord notification at 9:20 AM IST showing:
 * - How many people submitted goals (Present)
 * - How many people didn't submit goals (Absent)
 * - Names of absent people
 */

const admin = require('firebase-admin');
const https = require('https');
const { URL } = require('url');

// Validate environment variables
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is not set');
  process.exit(1);
}

if (!process.env.DISCORD_WEBHOOK_URL) {
  console.error('❌ DISCORD_WEBHOOK_URL environment variable is not set');
  process.exit(1);
}

// Parse Firebase service account
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  console.log('✅ Firebase service account parsed successfully');
} catch (error) {
  console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', error.message);
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
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

/**
 * Get today's date in YYYY-MM-DD format (IST timezone)
 */
function getTodayDateIST() {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get all active students (role: student)
 */
async function getAllStudents() {
  console.log('📋 Fetching all students...');
  const usersSnapshot = await db.collection('users')
    .where('role', '==', 'student')
    .get();
  
  const students = [];
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    students.push({
      id: doc.id,
      name: data.name || 'Unknown',
      email: data.email || '',
      campus: data.campus || '',
      house: data.house || ''
    });
  });
  
  console.log(`✅ Found ${students.length} students`);
  return students;
}

/**
 * Get students who submitted goals today
 */
async function getStudentsWithGoalsToday(todayDate) {
  console.log(`📊 Checking goals for date: ${todayDate}`);
  
  const goalsSnapshot = await db.collection('daily_goals')
    .where('created_at', '>=', admin.firestore.Timestamp.fromDate(new Date(todayDate)))
    .where('created_at', '<', admin.firestore.Timestamp.fromDate(new Date(todayDate + 'T23:59:59')))
    .get();
  
  const studentIdsWithGoals = new Set();
  goalsSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.student_id) {
      studentIdsWithGoals.add(data.student_id);
    }
  });
  
  console.log(`✅ ${studentIdsWithGoals.size} students submitted goals today`);
  return studentIdsWithGoals;
}

/**
 * Send Discord notification
 */
function sendDiscordNotification(payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(WEBHOOK_URL);
    const payloadString = JSON.stringify(payload);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 204 || res.statusCode === 200) {
          console.log('✅ Discord notification sent successfully!');
          resolve();
        } else {
          console.error(`❌ Discord responded with status ${res.statusCode}`);
          console.error('Response:', data);
          reject(new Error(`Discord API error: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error sending Discord notification:', error.message);
      reject(error);
    });
    
    req.write(payloadString);
    req.end();
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔄 Starting daily goal attendance check...\n');
    
    const todayDate = getTodayDateIST();
    console.log(`📅 Today's date (IST): ${todayDate}\n`);
    
    // Get all students
    const allStudents = await getAllStudents();
    
    if (allStudents.length === 0) {
      console.log('⚠️ No students found in database');
      process.exit(0);
    }
    
    // Get students who submitted goals today
    const studentIdsWithGoals = await getStudentsWithGoalsToday(todayDate);
    
    // Separate present and absent students
    const presentStudents = [];
    const absentStudents = [];
    
    allStudents.forEach(student => {
      if (studentIdsWithGoals.has(student.id)) {
        presentStudents.push(student);
      } else {
        absentStudents.push(student);
      }
    });
    
    const presentCount = presentStudents.length;
    const absentCount = absentStudents.length;
    const totalCount = allStudents.length;
    const attendancePercentage = ((presentCount / totalCount) * 100).toFixed(1);
    
    console.log('\n📊 Attendance Summary:');
    console.log(`   Present: ${presentCount}/${totalCount} (${attendancePercentage}%)`);
    console.log(`   Absent: ${absentCount}/${totalCount}`);
    
    // Prepare absent names list
    const absentNames = absentStudents
      .map(s => s.name)
      .sort()
      .join(', ');
    
    // Create Discord embed
    const embed = {
      title: "🌅 Morning Attendance",
      description: `Attendance report for **${todayDate}**`,
      color: presentCount > absentCount ? 65280 : 16776960, // Green if more present, yellow if more absent
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: "✅ Present",
          value: `**${presentCount}** students`,
          inline: true
        },
        {
          name: "❌ Absent",
          value: `**${absentCount}** students`,
          inline: true
        },
        {
          name: "📈 Attendance Rate",
          value: `**${attendancePercentage}%**`,
          inline: true
        }
      ],
      footer: {
        text: "Campus Learning Dashboard - Daily Report"
      }
    };
    
    // Add absent students list if there are any
    if (absentCount > 0) {
      embed.fields.push({
        name: "👥 Absent Students",
        value: absentNames.length > 1000 ? absentNames.substring(0, 997) + '...' : absentNames,
        inline: false
      });
    } else {
      embed.fields.push({
        name: "🎉 Perfect Attendance!",
        value: "All students have submitted their goals today!",
        inline: false
      });
    }
    
    // Send to Discord
    console.log('\n🔔 Sending Discord notification...');
    await sendDiscordNotification({ embeds: [embed] });
    
    console.log('\n✅ Daily goal attendance report completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error generating report:', error);
    console.error(error.stack);
    
    // Try to send error notification to Discord
    try {
      await sendDiscordNotification({
        embeds: [{
          title: "❌ Daily Report Failed",
          description: "An error occurred while generating the daily goal attendance report.",
          color: 16711680, // Red
          fields: [
            {
              name: "Error",
              value: error.message.substring(0, 1000),
              inline: false
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: "Campus Learning Dashboard - Error Report"
          }
        }]
      });
    } catch (notifError) {
      console.error('Failed to send error notification:', notifError.message);
    }
    
    process.exit(1);
  }
}

// Run the script
main();
