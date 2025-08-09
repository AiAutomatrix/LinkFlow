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

The app uses Firebase Authentication to manage user sign-up and login.

- **Files**: `src/app/(auth)/*`, `src/lib/firebase.ts`, `src/contexts/auth-context.tsx`
- **Providers**: Supports both Email/Password and Google Sign-In (OAuth).
- **Flow**:
  1. When a new user signs up, a `User` record is created in Firebase Authentication.
  2. Simultaneously, a `user` document is created in the Firestore database at `/users/{userId}`. This document stores public profile information like `displayName`, `username`, `bio`, etc.
  3. A `username` document is also created at `/usernames/{username}` to ensure usernames are unique and to allow for easy lookups of user profiles.
- **Session Management**: The `AuthProvider` (`src/components/auth-provider.tsx`) wraps the entire application, providing user session data and protecting dashboard routes.

---

## 3. Core Dashboard Features

### a. Link Management

Users can add, edit, delete, and reorder their links from the "Links" page in the dashboard.

- **Files**: `src/app/(dashboard)/dashboard/links/*`
- **Data Storage**: All links are stored as documents in a sub-collection in Firestore at `/users/{userId}/links/{linkId}`. Each link document contains its `title`, `url`, `order`, and `clicks` count.
- **Real-time Updates**: The page uses Firestore's `onSnapshot` listener to display link data in real-time. Any changes made are immediately reflected on the screen.

### b. Appearance Customization

Users can customize their public-facing profile from the "Appearance" page.

- **Files**: `src/app/(dashboard)/dashboard/appearance/*`
- **Functionality**:
    - **Profile Info**: Users can update their `displayName`, `username`, and `bio`. These changes are saved to their user document in Firestore.
    - **Profile Picture**: Users can upload a profile picture. The image is uploaded to **Firebase Storage** in the `profile_pictures/{userId}/` directory. The public download URL is then saved to the user's document in Firestore.
    - **Themes**: Users can select from a variety of color themes. The selected theme's ID is stored in the user's document and applied to the public profile page using CSS variables.

---

## 4. Click Tracking & Analytics

This is a critical feature that reliably tracks every click on a user's public links.

- **Files**: `src/app/u/[username]/profile-client-page.tsx`, `src/app/redirect/page.tsx`, `src/app/api/clicks/route.ts`
- **The Flow**:
    1.  **Initial Click**: On the public profile page, a visitor clicks a link. The link is an `<a>` tag that opens in a new tab (`target="_blank"`). An `onClick` event handler simultaneously triggers a navigation to an internal `/redirect` page.
    2.  **Background Redirect Page**: The `/redirect` page (`src/app/redirect/page.tsx`) loads instantly. It grabs the `userId`, `linkId`, and destination `url` from the query parameters.
    3.  **API Call**: The redirect page immediately sends a `POST` request to the backend API endpoint at `/api/clicks`. This request contains the `userId` and `linkId`.
    4.  **Database Update**: The API route (`src/app/api/clicks/route.ts`) receives the request. It securely finds the correct link document in Firestore (`/users/{userId}/links/{linkId}`) and uses Firestore's atomic `increment(1)` function to increase the `clicks` field by one.
    5.  **Data Display**: The "Analytics" page on the dashboard uses a real-time `onSnapshot` listener. As soon as the `clicks` value is updated in Firestore, the charts and stats on the dashboard update instantly.

This process is robust because the API call is guaranteed to complete before the user is navigated away, and opening the link in a new tab provides a seamless user experience.

---

## 5. Security with Firestore Rules

The application's data is secured using Firestore Security Rules.

- **File**: `firestore.rules`
- **Rules Breakdown**:
    - **Default Deny**: All reads and writes are denied by default to prevent unauthorized access.
    - **Public Reads**: Anyone can read the `users` and `links` collections, which is necessary for the public profile pages to function.
    - **Secure Writes**:
        - **Profile Updates**: A user can only write to their own `user` document (where `request.auth.uid == userId`). This allows them to update their profile but not anyone else's.
        - **Click Increments**: The rules specifically allow *anyone* to perform an `update` on a link document, but **only if the *only* field being changed is `clicks`**. This allows the public-facing click counter to work without exposing other data to be modified.
        - **Link & Username Management**: A logged-in user has permission to create, update, and delete documents within their own `/links` sub-collection and manage their `username` document.