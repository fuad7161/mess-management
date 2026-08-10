# Mess Manager

An Android-first Expo/React Native app for shared-mess meal and expense management. It uses Firebase Phone Authentication, Cloud Firestore, Storage, and callable/background Cloud Functions.

Implemented flows include phone OTP, group creation/search/join approval, member roles, two-admin activation, meal entries, Bazar/Payment/Extra Cost verification, live monthly summaries, and month finalization.

## Prerequisites

- Node.js 20 (the Cloud Functions runtime is Node 20)
- npm
- Android Studio with an Android emulator
- Java 21+ for the current Firebase emulators
- A Firebase project with the Blaze plan when deploying Cloud Functions

This app uses native React Native Firebase modules, so it does **not** run in Expo Go. Use `expo run:android` to create a development build.

## 1. Install dependencies

From the repository root:

```sh
npm install
npm --prefix functions install
```

## 2. Connect Firebase

The repository currently names `mess-app-439cb` in `.firebaserc`. To use another project, replace that value or run:

```sh
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use YOUR_PROJECT_ID
```

Register the Android package `com.messapp.management` if it is not already registered:

```sh
npx -y firebase-tools@latest apps:create ANDROID MessApp --package-name com.messapp.management --project YOUR_PROJECT_ID
npx -y firebase-tools@latest apps:list ANDROID --project YOUR_PROJECT_ID
```

Use the Android app ID printed by the second command to fetch its config:

```sh
npx -y firebase-tools@latest apps:sdkconfig ANDROID YOUR_ANDROID_APP_ID --project YOUR_PROJECT_ID > google-services.json
```

In Firebase Authentication, enable the **Phone** provider. For a real Android device/build, also add the development and release SHA-1/SHA-256 fingerprints to the registered Firebase Android app.

Create a Cloud Firestore database in Native mode and a default Storage bucket, then deploy the backend:

```sh
npm run functions:build
npx -y firebase-tools@latest deploy --only firestore,storage,functions
```

## 3. Run against Firebase

Start an Android emulator, then run:

```sh
npm run android
```

After the first native build, Metro can be started separately with:

```sh
npm start
```

## Run locally with Firebase emulators

The local host mapping is configured for the standard Android Emulator (`10.0.2.2`). First make sure `google-services.json` exists, then start all emulators:

```sh
npm run emulators
```

In another terminal:

```sh
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true npm run android
```

The Emulator Suite UI is at `http://localhost:4000`. Phone-auth verification codes are shown by the Auth emulator; no SMS is sent. The hardcoded `10.0.2.2` host does not work on a physical phone without changing `src/api/firebase.ts` to the computer's LAN address.

## Verification

```sh
npm run typecheck
npm run functions:build
```

## Important behavior

- A group must have at least two admins before financial entries can be created.
- A financial entry must be approved by an admin other than its submitter.
- Financial and group mutations are Cloud Function-only; clients directly write only their own validated meal documents.
- Finalizing a month prevents later meal or financial changes from affecting it.
