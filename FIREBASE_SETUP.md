# Firebase Setup Guide for Campus Learning Dashboard

## Current Status
✅ Firebase SDK is installed and configured  
✅ Services are initialized (Auth, Firestore, Functions)  
❌ **Missing**: Real Firebase project connection (using demo values)

## Step-by-Step Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Project name: `Campus Learning Dashboard`
4. Enable Google Analytics (optional)
5. Choose or create a Google Analytics account

### 2. Enable Authentication
1. In Firebase Console → **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable **Email/Password** provider
5. Click "Save"

### 3. Create Firestore Database
1. In Firebase Console → **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to your users)
5. Click "Done"

### 4. Get Firebase Configuration
1. In Firebase Console → **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click **Web app** icon (`</>`)
4. App nickname: `Campus Learning Dashboard`
5. **Don't** check "Firebase Hosting" for now
6. Click "Register app"
7. **Copy the firebaseConfig object**

### 5. Update Environment Variables
Replace the values in `.env` file with your actual Firebase config:

```env
# Replace with your actual Firebase configuration
REACT_APP_FIREBASE_API_KEY=your_actual_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_actual_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
REACT_APP_FIREBASE_APP_ID=your_actual_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_actual_measurement_id
```

### 6. Deploy Security Rules
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init firestore
   ```

4. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 7. Initialize Sample Data (Optional)
Once connected, you can create initial data:

1. **Create Admin User**: Use the signup form with role "admin"
2. **Add Sample Phases**:
   ```javascript
   // In Firestore Console → phases collection
   {
     name: "Foundation",
     start_date: "2024-01-01",
     end_date: "2024-03-31",
     order: 1
   }
   ```

3. **Add Sample Topics**:
   ```javascript
   // In Firestore Console → topics collection
   {
     phase_id: "phase_id_from_above",
     name: "JavaScript Basics",
     order: 1
   }
   ```

## Testing the Connection

### 1. Restart Development Server
```bash
npm start
```

### 2. Test Authentication
1. Go to `http://localhost:3000/signup`
2. Create a test account
3. Check Firebase Console → Authentication → Users

### 3. Test Database
1. Set a daily goal as a student
2. Check Firebase Console → Firestore → daily_goals collection

## Quick Test (No Real Firebase Needed)

If you want to test the UI without setting up Firebase:

1. **Comment out Firebase calls** in components temporarily
2. **Use mock data** for testing UI components
3. **Focus on design and user experience** first

## Alternative: Firebase Emulator Suite

For local development without cloud costs:

```bash
# Install emulator
npm install -g firebase-tools

# Initialize emulator
firebase init emulators

# Start emulator
firebase emulators:start
```

Then update your Firebase config to use local emulator endpoints.

---

## Need Help?

If you need assistance with any of these steps:
1. Share your current Firebase Console project name
2. Let me know if you encounter any specific errors
3. I can help you debug connection issues

The application architecture is ready - it just needs the Firebase project credentials!