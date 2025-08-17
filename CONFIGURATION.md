# LinkFlow: Application Configuration

This document provides a guide to configuring the LinkFlow application for local development. The primary method of configuration is through environment variables.

---

## 1. Environment Variables

The application uses environment variables to manage sensitive keys and project-specific settings, particularly for connecting to Firebase services.

You must create a file named `.env.local` in the root directory of the project. This file is ignored by Git and will not be checked into version control, keeping your keys secure.

### a. Required Firebase Variables

These variables are essential for connecting the application to your Firebase project. You can find these values in your Firebase project's settings.

1.  Go to your **Firebase Console**.
2.  Select your project.
3.  Click the gear icon and go to **Project settings**.
4.  In the "General" tab, scroll down to the "Your apps" section.
5.  Select your Web App.
6.  Under "Firebase SDK snippet", choose "Config" to view the configuration object.

-   `NEXT_PUBLIC_FIREBASE_API_KEY`: The API key for your Firebase project.
-   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Your project's authentication domain (e.g., `your-project-id.firebaseapp.com`).
-   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your unique Firebase project ID.
-   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Your project's Cloud Storage bucket (e.g., `your-project-id.appspot.com`).
-   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Your messaging sender ID.
-   `NEXT_PUBLIC_FIREBASE_APP_ID`: Your web app's unique ID.

### b. Optional Google Analytics Variable

If you wish to enable Google Analytics tracking, you need to provide your Measurement ID.

-   `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Your Google Analytics Measurement ID (e.g., `G-XXXXXXXXXX`).

### c. Example `.env.local` File

Create a file named `.env.local` in the project root and add your keys like this:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
NEXT_PUBLIC_FIREBASE_APP_ID="1:1234567890:web:abcdef123456"

# Google Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

---

## 2. Firebase Services Setup

For the application to function correctly, ensure the following Firebase services are enabled and configured in your project:

1.  **Authentication**: Enable the **Email/Password** sign-in provider.
2.  **Firestore**: Create a Firestore database. The application's security rules (`firestore.rules`) will be applied to it, but you must have an active database.
3.  **Storage**: Enable Cloud Storage for Firebase to handle profile picture uploads.

---

## 3. Running the Application

Once your `.env.local` file is created and your Firebase project is set up, you can run the application locally using the standard command:

```bash
npm run dev
```

The application will now be connected to your Firebase backend.
