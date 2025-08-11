# LinkFlow: How It Works

This document provides a technical overview of the LinkFlow application, detailing its architecture and key features.

## 1. Project Overview

LinkFlow is a micro-SaaS application that allows users to create a single, customizable public profile page to host all their important links. It includes user authentication, link management, appearance customization, and click analytics.

The tech stack is:
- **Framework**: Next.js (App Router)
- **UI**: React, Tailwind CSS, ShadCN UI
- **Backend & Database**: Firebase (Authentication, Firestore, Storage)
- **Deployment**: Firebase App Hosting

---

## 2. Authentication

The app uses Firebase Authentication to manage user sign-up and login. The core principle is that the UI (login/signup pages) initiates the sign-in, and a central `AuthProvider` listens for the result to manage the user's session across the entire application.

### a. Key Files & Their Roles

-   **`src/lib/firebase.ts`**: This is the first and most critical file. It handles the initialization of the Firebase app. It reads your project configuration from environment variables and creates the connections to all Firebase services (Auth, Firestore, Storage). This file ensures that a single, consistent instance of Firebase is used everywhere.

-   **`src/lib/auth.ts`**: This file contains the core functions that interact with Firebase Auth.
    -   `signInWithEmail(email, password)`: Handles the standard email & password login.
    -   `signUpWithEmail(email, password, displayName)`: Creates a new user with email/password.
    -   `signInWithGoogle()`: This is the key function for Google Auth. It now uses `signInWithPopup`, which opens a popup window for Google login. This is more reliable than the previous redirect method because it doesn't navigate the user away from the app. Once the user signs in via the popup, their credentials are sent directly back to the app.
    -   `getOrCreateUserProfile(user)`: This is a crucial function called **after any successful sign-in or sign-up**. It checks if a user's profile already exists in your Firestore database. If it does, it fetches it. If not (i.e., a new user), it creates a new profile document in the `/users/{userId}` collection with default values.

-   **`src/contexts/auth-context.tsx`**: This is the heart of the session management. The `AuthProvider` component wraps the entire application.
    -   It uses Firebase's `onAuthStateChanged` listener. This is a real-time listener that automatically detects whenever a user signs in (via email or Google popup) or signs out.
    -   When `onAuthStateChanged` fires with a valid user, the provider fetches their profile using `getOrCreateUserProfile` and stores both the `user` and `userProfile` objects in its state.
    -   This state is then made available to the entire app via the `useAuth()` hook.
    -   Crucially, it also handles routing logic: if a user is logged in, it redirects them away from the `/login` page to the `/dashboard`. If they are not logged in, it protects the dashboard pages and sends them back to `/login`.

-   **`src/app/(auth)/login/page.tsx` & `src/app/(auth)/signup/page.tsx`**: These are the client-facing UI components. The buttons on these pages simply call the functions from `src/lib/auth.ts` (e.g., `signInWithGoogle()`). They don't need to know the complex details; they just trigger the action, and the `AuthProvider` handles the result.

### b. The Google Sign-In Flow (No Redirects)

Here is the step-by-step flow for the Google button, which no longer uses redirects:

1.  **Click**: User clicks the "Sign in with Google" button.
2.  **Popup**: The `signInWithGoogle` function is called from `src/lib/auth.ts`, which triggers `signInWithPopup`. A popup window opens with Google's authentication screen. Your app page remains open and active in the background.
3.  **Authentication**: The user chooses their Google account and approves the permissions in the popup.
4.  **Credential Return**: Google sends the user's credential token back to your page. The popup closes.
5.  **Session Update**: The `onAuthStateChanged` listener in `AuthProvider` detects the successful login almost instantly.
6.  **Profile & Redirect**: `AuthProvider` fetches or creates the user's profile and then redirects the user to the `/dashboard`, as they are now authenticated.

This popup-based flow is robust and avoids all the issues that were happening with the previous redirect-based implementation.

---

## 3. Data Storage & Security

-   **User Profiles**: Stored in Firestore at `/users/{userId}`.
-   **Links**: Stored in a sub-collection at `/users/{userId}/links/{linkId}`.
-   **Profile Pictures**: Stored in Firebase Storage in the `profile_pictures/{userId}/` folder.
-   **Security**: The `firestore.rules` file defines the security for your database. It allows anyone to read public profile data but restricts all write operations (creating, updating, deleting) to the currently logged-in user for their own documents. This ensures users can't modify each other's data.
