# LinkFlow: Technical Architecture

This document provides a detailed technical breakdown of the LinkFlow application, covering project structure, core architectural concepts, and component responsibilities.

---

## 1. Project Structure

The project follows a standard Next.js App Router structure.

```
/src
├── app/
│   ├── (auth)/             # Route group for login/signup pages
│   ├── (dashboard)/        # Route group for protected dashboard pages
│   │   ├── dashboard/
│   │   │   ├── analytics/
│   │   │   ├── appearance/
│   │   │   └── links/
│   ├── u/[username]/       # Public user profile page (dynamic route)
│   ├── api/                # API routes (e.g., for click tracking)
│   ├── globals.css         # Global styles and ShadCN theme variables
│   └── layout.tsx          # Root layout of the application
├── components/
│   ├── ui/                 # Unmodified UI components from ShadCN
│   └── *.tsx               # Custom, reusable components (e.g., Logo, UserNav)
├── contexts/
│   └── auth-context.tsx    # Defines the shape and hook for our Auth context
├── hooks/
│   ├── use-mobile.ts       # Hook to detect mobile viewports
│   └── use-toast.ts        # Custom toast hook for notifications
└── lib/
    ├── firebase.ts         # Firebase initialization and service exports
    ├── types.ts            # Core TypeScript types (UserProfile, Link)
    └── utils.ts            # Utility functions (e.g., `cn` for Tailwind)
```

---

## 2. Core Concepts

### a. Authentication & Session Management (`AuthProvider`)

This is the heart of the application's state management.

-   **`src/components/auth-provider.tsx`**: This component wraps the entire application. It uses Firebase's `onAuthStateChanged` listener to detect the user's login state in real-time.
-   **State Management**: When a user logs in, the provider fetches their corresponding profile from the `users` collection in Firestore and stores it in a React Context.
-   **`useAuth()` Hook**: The `useAuth()` hook (`src/contexts/auth-context.tsx`) provides easy access to the user's data (`user`, `userProfile`) and authentication status (`loading`) throughout the app.
-   **Protected Routes**: The `AuthProvider` contains logic to protect the `/dashboard` routes. If a user is not logged in, they are automatically redirected to `/login`. Conversely, if a logged-in user tries to access `/login` or `/signup`, they are redirected to their dashboard.

### b. Data Modeling (Firestore)

All application data is stored in Firestore with a simple and scalable structure.

-   **User Profiles**: `/users/{userId}`
    -   Each user has a single document in the `users` collection, keyed by their Firebase Auth UID.
    -   This document stores their display name, username, bio, photo URL, chosen theme, etc.
-   **Links**: `/users/{userId}/links/{linkId}`
    -   Each user's links are stored in a sub-collection under their user document. This is a highly scalable pattern.
    -   Each link document contains its `title`, `url`, `order`, `active` status, `clicks` count, and a boolean `isSocial` flag to differentiate it from regular links.

### c. Public Profile Page (`/u/[username]`)

This page is a showcase of Next.js App Router features.

1.  **Server Component (`page.tsx`)**: The page first renders on the server. It receives the `username` from the URL, queries the `users` collection to find the matching user ID, and then fetches that user's profile and all their links.
2.  **Serialization**: Because server components cannot pass complex objects like Firestore `Timestamp`s to client components, all data is serialized into simple JSON-compatible formats (e.g., ISO date strings).
3.  **Client Component (`profile-client-page.tsx`)**: The serialized user and link data is then passed as props to a client component. This component handles all interactivity, including:
    *   Filtering for active links and scheduled links.
    *   Handling link clicks and calling the `/api/clicks` endpoint.
    *   Rendering the final UI based on the user's selected theme.

### d. Security (`firestore.rules`)

The security of the application is enforced by `firestore.rules`.

-   **Public Reads**: Anyone is allowed to read data from the `/users` collection. This is necessary for the public profile pages to function.
-   **Restricted Writes**: All write operations (create, update, delete) on a user's documents (`/users/{userId}` and their links sub-collection) are strictly limited to that authenticated user. This prevents users from modifying each other's data.

---

## 3. Component Breakdown

### Core App Components

-   **`src/app/(dashboard)/layout.tsx`**: Provides the main dashboard structure, including the collapsible sidebar and the main content area. It uses the `useAuth` hook to protect its children.
-   **`src/app/layout.tsx`**: The root layout for the entire application. It includes the `<html>` and `<body>` tags and wraps everything in the `AuthProvider`.
-   **`src/components/auth-provider.tsx`**: Manages user session, state, and protected routing.
-   **`src/components/user-nav.tsx`**: The user dropdown menu in the dashboard sidebar, showing user info and logout/settings links.
-   **`src/components/logo.tsx`**: A simple, reusable logo component.
-   **`src/components/ui/sidebar.tsx`**: A highly customized and reusable sidebar component used for the dashboard navigation.

### Page-Specific Components

-   **`src/app/(auth)/*`**: Contains the `login` and `signup` pages, which are simple forms that use the `useAuth` context to perform authentication actions.
-   **`src/app/(dashboard)/dashboard/links/*`**:
    -   `page.tsx`: The main page for managing links. Handles fetching, adding, updating, and reordering links.
    -   `_components/link-card.tsx`: A card component to display a single link with its stats and action buttons (edit, delete, toggle).
    -   `_components/link-form.tsx`: The form used for both creating and editing links.
-   **`src/app/(dashboard)/dashboard/appearance/*`**:
    -   `page.tsx`: The page for customizing the user's public profile.
    -   `_components/public-profile-preview.tsx`: A key component that shows a live, real-time preview of the public profile as the user makes changes.
-   **`src/app/(dashboard)/dashboard/analytics/page.tsx`**: Displays statistics about link performance using cards and a bar chart from the `recharts` library.
