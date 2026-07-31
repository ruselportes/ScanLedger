<div align="center">

# 📖 ScanLedger

**Gym Revenue Logbook Digitizer & Handwriting OCR**

*Capture · Extract · Confirm · Analyze*

[![React Native](https://img.shields.io/badge/React%20Native-Expo%2056-000020?style=for-the-badge&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Google ML Kit](https://img.shields.io/badge/OCR-Google%20ML%20Kit-4285F4?style=for-the-badge&logo=google)](https://developers.google.com/ml-kit)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## 🌟 Overview

**ScanLedger** is an intelligent mobile application built for gyms and fitness centers that rely on paper logbooks for attendance and payment logging. Instead of forcing staff to adopt complicated new software, ScanLedger **digitizes paper logbooks in seconds**.

Staff simply take a picture of the daily logbook page. The app uses **Google ML Kit OCR** combined with specialized **handwriting parsing heuristics** to extract names and payment amounts, calculate total daily revenue, and sync data securely to Supabase.

---

## 🔍 How It Works

```
[ Paper Logbook ] ──> ( 📷 Camera Viewfinder ) ──> ( 🧠 Google ML Kit OCR + Heuristics )
                                                               │
                                                               ▼
[ 👑 Admin Dashboard ] <── ( ☁️ Supabase Cloud ) <── [ ✏️ Staff Review & Confirm ]
```

### OCR Heuristics & Cleaning
Handwritten logbooks are naturally messy. ScanLedger cleans character ambiguity automatically:
- **Digit Substitutions**: `O`/`o`/`Q`/`D` $\rightarrow$ `0`, `I`/`l`/`|`/`!` $\rightarrow$ `1`, `S`/`s` $\rightarrow$ `5`, `B` $\rightarrow$ `8`, `Z`/`z` $\rightarrow$ `2`.
- **Flexible Currency Parsing**: Recognizes `₱`, `P`, `Php`, `=`, `:`, `-`, `—`, and spaces.
- **Image Pre-processing**: Uses `expo-image-manipulator` to scale captured photos to an optimal **1600px width** at 95% JPEG quality before running text detection.

---

## ✨ Features

### 📷 Staff Experience
- **Guided Viewfinder Frame**: Visual overlay to align logbook pages easily.
- **On-Device Handwriting OCR**: Powered by Google ML Kit for offline-capable text recognition.
- **Interactive Review Screen**: Edit amounts, add missing entries, or delete noise lines.
- **Duplicate Detection**: Flags repeated names or payment entries.
- **Robust Offline Queue**: Automatically saves scans locally when offline and syncs with 1 pull-to-refresh.

### 📊 Owner / Admin Experience
- **Revenue Analytics**: Daily, Weekly, Monthly, and Yearly totals at a glance.
- **7-Day Revenue Trend Line**: Interactive visual chart powered by `react-native-chart-kit`.
- **Upload Audit History**: Detailed log of all processed logbooks with staff attribution and timestamps.
- **Staff Management**: View and audit authorized staff accounts.
- **Dark Mode Aesthetic**: Material Design 3 inspired sleek dark aesthetic with neon green accents (`#00E5A0`).

---

## 🚀 Setup & Installation Guide

### Prerequisites

1. **Node.js**: v18.x or higher
2. **Android Studio**: Installed with Android SDK (Compile SDK 36, NDK `26.1.10909125`)
3. **Physical Android Device or Emulator**: Android 7.0 (API 24) or higher
4. **Supabase Project**: Free tier account at [supabase.com](https://supabase.com)

---

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/ruselportes/ScanLedger.git
cd ScanLedger
npm install
```

---

### Step 2: Configure Supabase Database

1. Open your **Supabase Dashboard** $\rightarrow$ **SQL Editor**.
2. Run the full database schema script located in [`supabase_schema.sql`](./supabase_schema.sql).
3. Copy your project credentials from **Project Settings $\rightarrow$ API**.

---

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

---

### Step 4: Native Android Build & Device Deployment

Since ScanLedger utilizes **Google ML Kit native C++ libraries**, run a native Android development build:

```bash
# Connect your physical Android phone via USB or Wireless ADB
adb devices

# Enable port forwarding for Metro Bundler
adb reverse tcp:8081 tcp:8081

# Compile native Android APK & launch dev server
npx expo run:android
```

> 💡 **Wireless ADB Connection**:
> If connecting via Wireless ADB:
> ```bash
> adb connect <PHONE_IP>:<PORT>
> adb -s <PHONE_IP>:<PORT> reverse tcp:8081 tcp:8081
> ```

---

### Step 5: Assign Owner / Admin Role

To access the **Owner Dashboard**, run this SQL in your Supabase SQL Editor for your registered account:

```sql
UPDATE public.profiles SET role = 'owner' WHERE email = 'your_email@domain.com';
```

---

## 🏭 Production Build & Deployment Guide

ScanLedger can be compiled into a standalone production APK or Android App Bundle (AAB).

### Option A: Build Standalone Release APK (Direct Device Installation)

Compile a self-contained release APK to install directly on staff & owner devices:

```bash
# Navigate to android directory
cd android

# Compile standalone release APK
./gradlew assembleRelease -x lint -x test
```

> 📦 **Output APK Path**:
> `android/app/build/outputs/apk/release/app-release.apk`

---

### Option B: Build Production App Bundle (Google Play Store)

Compile an Android App Bundle (`.aab`) for publishing to the Google Play Console:

```bash
cd android
./gradlew bundleRelease -x lint -x test
```

> 📦 **Output AAB Path**:
> `android/app/build/outputs/bundle/release/app-release.aab`

---

### Option C: EAS Production Build (Expo Application Services)

If using EAS Cloud Build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Run production build
eas build -p android --profile production
```

---

## 🗄️ Database Architecture

The schema defined in [`supabase_schema.sql`](./supabase_schema.sql) includes:

- `public.profiles`: Extends Supabase `auth.users` with roles (`staff` | `owner`) and display names.
- `public.logbook_uploads`: Log of each scanned page (date, total amount, entry count, sync status).
- `public.logbook_entries`: Individual member payment items extracted per scan session.
- `public.devices`: Authorized device registry.

Row-Level Security (RLS) policies enforce authenticated staff uploads and owner-wide read permissions.

---

## 📁 Project Structure

```
ScanLedger/
├── App.tsx                          # App root & provider wrap
├── app.json                         # Expo configuration & plugins
├── supabase_schema.sql              # Database schema & RLS policies
├── .env                             # Environment variables
│
└── src/
    ├── theme/index.ts               # Colors, Spacing & Typography tokens
    ├── types/index.ts               # TypeScript data interfaces
    ├── context/
    │   └── AuthContext.tsx          # Session persistence & role switcher
    ├── services/
    │   ├── supabase.ts              # Supabase client initialization
    │   ├── dataService.ts           # Revenue analytics & query handlers
    │   └── offlineQueue.ts          # Offline storage & background sync engine
    ├── utils/
    │   └── parser.ts                # OCR text parsing & digit substitute heuristics
    ├── navigation/
    │   ├── RootNavigator.tsx        # Role-based container
    │   ├── StaffStack.tsx           # Camera → Review → Success stack
    │   ├── StaffTabs.tsx            # Staff tab navigator
    │   └── OwnerTabs.tsx            # Admin/Owner tab navigator
    └── screens/
        ├── auth/LoginScreen.tsx
        ├── staff/CameraScreen.tsx
        ├── staff/ReviewScreen.tsx
        ├── staff/UploadSuccessScreen.tsx
        ├── staff/StaffHistoryScreen.tsx
        ├── owner/DashboardScreen.tsx
        ├── owner/OwnerHistoryScreen.tsx
        ├── owner/StaffManagementScreen.tsx
        └── owner/OwnerSettingsScreen.tsx
```

---

## 🛠️ Native Build Configurations Discovered

For native compilation with Expo 56 and React Native 0.85:
- **NDK Version**: Set `ndkVersion = "26.1.10909125"` in `android/build.gradle` and `app.json`.
- **Min SDK**: Hardcoded `minSdkVersion = 24` across all native module builds (`react-native-worklets`, `react-native-screens`).
- **C++ Standards**: Enabled `-fexperimental-library` in CMake for LLVM Clang C++20 compatibility.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details.

<div align="center">

*Designed & Developed by [Rusel Portes](https://github.com/ruselportes)*  
*ScanLedger v1.0.0 · July 2026*

</div>
