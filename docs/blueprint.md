# **App Name**: LinkFlow

## Core Features:

- Profile Creation and Management: Enable new users to sign up via Firebase Authentication (Google Auth and email/password). Upon signup, create a default user profile in Firestore containing: Name, Bio, Profile picture, Default username (auto-generated if not chosen during onboarding). Ensure profile persists after signup and is editable via dashboard.
- Username Claiming: Users can claim a unique username to personalize their public profile link. Username validation: Must be unique (check Firestore), Alphanumeric + underscores only, 3–20 characters. Once claimed, username is reserved for that account unless changed by user.
- Link Management: User dashboard for adding, editing, deleting, and reordering links. Each link contains: Title, URL, (Optional) active date range for scheduling. Links saved in Firestore and synced in real time to public profile.
- Monetization with Stripe: Stripe Checkout integration for Pro plan subscriptions. Use Stripe webhooks to: Update user’s plan field in Firestore when subscription status changes, Gate Pro-only features (e.g., custom domains, premium analytics). Pro plan feature logic must be server-side validated to prevent abuse.
- Public Profile Display: Public profile accessible at /u/[username]. Display user’s: Name, Bio, Profile picture, List of active links. Server-Side Rendering (SSR) or Incremental Static Regeneration (ISR) for: Improved SEO, Faster load times.
- Link Analytics: Track click counts per link. Display analytics in dashboard: Total clicks, Clicks over time (chart). Implement rate limiting and abuse detection to ensure data accuracy.

## Style Guidelines:

- Primary color: Vibrant blue (#29ABE2) evoking trust and innovation.
- Background color: Light blue (#E5F5FA), offering a clean and modern backdrop.
- Accent color: Soft green (#90EE90), providing a contrasting highlight for key elements.
- Responsive and mobile-first. Built with Tailwind CSS for consistency and easy customization.
- Body and headline font: 'Inter', a grotesque-style sans-serif font providing a modern look.
- Use icons from Remix Icon or Font Awesome. Maintain consistency with app aesthetic.
- Subtle fade-ins, transitions, and hover effects. Avoid distracting animations.