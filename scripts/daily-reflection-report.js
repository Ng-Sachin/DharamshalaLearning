#!/usr/bin/env node

/**
 * Daily Reflection Attendance Report
 * 
 * Sends a Discord notification at 8:30 PM IST showing:
 * - How many people submitted reflections (Present)
 * - How many people didn't submit reflections (Absent)
 * - Attendance percentage
 * 
 * Note: Does NOT list names of absent students (just counts)
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
    students.push({
      id: doc.id,
      name: doc.data().name || 'Unknown'
    });
  });
  
  console.log(`✅ Found ${students.length} students`);
  return students;
}

/**
 * Get students who submitted reflections today
 */
async function getStudentsWithReflectionsToday(todayDate) {
  console.log(`📊 Checking reflections for date: ${todayDate}`);
  
  const reflectionsSnapshot = await db.collection('daily_reflections')
    .where('created_at', '>=', admin.firestore.Timestamp.fromDate(new Date(todayDate)))
    .where('created_at', '<', admin.firestore.Timestamp.fromDate(new Date(todayDate + 'T23:59:59')))
    .get();
  
  const studentIdsWithReflections = new Set();
  reflectionsSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.student_id) {
      studentIdsWithReflections.add(data.student_id);
    }
  });
  
  console.log(`✅ ${studentIdsWithReflections.size} students submitted reflections today`);
  return studentIdsWithReflections;
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
    console.log('🔄 Starting daily reflection attendance check...\n');
    
    const todayDate = getTodayDateIST();
    console.log(`📅 Today's date (IST): ${todayDate}\n`);
    
    // Get all students
    const allStudents = await getAllStudents();
    
    if (allStudents.length === 0) {
      console.log('⚠️ No students found in database');
      process.exit(0);
    }
    
    // Get students who submitted reflections today
    const studentIdsWithReflections = await getStudentsWithReflectionsToday(todayDate);
    
    // Calculate counts
    const presentCount = studentIdsWithReflections.size;
    const totalCount = allStudents.length;
    const absentCount = totalCount - presentCount;
    const attendancePercentage = ((presentCount / totalCount) * 100).toFixed(1);
    
    console.log('\n📊 Reflection Attendance Summary:');
    console.log(`   Present: ${presentCount}/${totalCount} (${attendancePercentage}%)`);
    console.log(`   Absent: ${absentCount}/${totalCount}`);
    
    // Create Discord embed
    const embed = {
      title: "🌙 Evening Attendance",
      description: `Attendance report for **${todayDate}**`,
      color: presentCount > absentCount ? 5763719 : 15844367, // Purple if good, orange if low
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
          name: "📈 Completion Rate",
          value: `**${attendancePercentage}%**`,
          inline: true
        }
      ],
      footer: {
        text: "Campus Learning Dashboard - Evening Report"
      }
    };
    
    // Add motivational message based on performance
    if (presentCount === totalCount) {
      embed.fields.push({
        name: "🎉 Perfect Day!",
        value: "All students completed both goals AND reflections today!",
        inline: false
      });
    } else if (attendancePercentage >= 90) {
      embed.fields.push({
        name: "💪 Excellent Work!",
        value: "Outstanding completion rate today!",
        inline: false
      });
    } else if (attendancePercentage >= 75) {
      embed.fields.push({
        name: "👍 Good Progress",
        value: "Keep up the momentum!",
        inline: false
      });
    } else if (attendancePercentage >= 50) {
      embed.fields.push({
        name: "📝 Reminder",
        value: "Encourage students to complete their reflections before day end.",
        inline: false
      });
    } else {
      embed.fields.push({
        name: "⚠️ Low Completion",
        value: "Many students haven't submitted reflections yet. Consider sending reminders.",
        inline: false
      });
    }
    
    // Send to Discord
    console.log('\n🔔 Sending Discord notification...');
    await sendDiscordNotification({ embeds: [embed] });
    
    console.log('\n✅ Daily reflection attendance report completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error generating report:', error);
    console.error(error.stack);
    
    // Try to send error notification to Discord
    try {
      await sendDiscordNotification({
        embeds: [{
          title: "❌ Evening Report Failed",
          description: "An error occurred while generating the reflection attendance report.",
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
