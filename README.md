# DSC Guidance Admin Panel

A complete, production-ready Admin/Tutor Web Console built with **React**, **Vite**, and **Tailwind CSS v4** connected to **Firebase**. 

This console serves as the content management backend for the **DSC GUIDANCE (by Nandikola)** platform, synchronizing study materials, previous papers, classes, chapters, and tests to the student-facing Android client application in real-time.

---

## 🚀 Tech Stack

- **Framework:** React 19 + Vite 8
- **Styling:** Tailwind CSS v4 (CSS-first configuration)
- **Icons:** Lucide React
- **Router:** React Router v7
- **Backend:** Firebase Web SDK v10+ (Authentication, Cloud Firestore, Firebase Storage)
- **Build Pipeline:** Rolldown (native Vite 8 bundler)

---

## 🛠️ Installation & Setup

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Credentials**
   Copy the `.env.example` file and create a `.env` in the root directory:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and paste your Firebase Web App configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=dsc-guidance.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=dsc-guidance
   VITE_FIREBASE_STORAGE_BUCKET=dsc-guidance.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Database Security Rules**
   For deployment, upload the provided rules files in the project root to your Firebase console:
   - Firestore rules: [firestore.rules](file:///d:/Projects/RIONTEX/DSC%20Guidance%20Admin%20Web%20App/firestore.rules)
   - Storage rules: [storage.rules](file:///d:/Projects/RIONTEX/DSC%20Guidance%20Admin%20Web%20App/storage.rules)

---

## 🔑 Admin Account Authorization

This console uses role-based access control (RBAC) to ensure only authorized tutors can manage content.

1. **Sign Up Tutors**
   Instruct new tutors to sign up using their email and password inside the application or via the student app (or register them directly in Firebase Authentication Console).
2. **Assign Role in Firestore**
   Copy their user UID from the Firebase Authentication Console. Go to Firestore and create a document under the `admins` collection with their UID as the Document ID:
   ```json
   // Document path: admins/{user_uid}
   {
     "name": "Nandikola Admin",
     "email": "admin@example.com",
     "role": "admin", // "admin" (full permissions) or "tutor" (content creation only)
     "active": true
   }
   ```
   *Only users with `active == true` can access the dashboard.*

---

## ⚙️ Development Commands

- **Run Dev Server:**
  ```bash
  npm run dev
  ```
- **Production Build:**
  ```bash
  npm run build
  ```
- **Preview Production Build locally:**
  ```bash
  npm run preview
  ```

---

## 📂 Firestore Data Schema

The database layout is documented in [FIREBASE_SCHEMA.md](file:///d:/Projects/RIONTEX/DSC%20Guidance%20Admin%20Web%20App/FIREBASE_SCHEMA.md) located in the root folder. Tutors can reference this to verify field mappings when integrating features in the Android student application.

---

## 🛡️ Firebase Security Overview

- **Firestore Rules:** Denies write access to any user not defined in the `/admins/{uid}` document with active tutor status. Allows public reads for active and published content.
- **Storage Rules:** Performs a cross-service Firestore query check (`firestore.get(...)`) to verify that the uploader is an authorized, active console member in the database before accepting PDF file uploads.
