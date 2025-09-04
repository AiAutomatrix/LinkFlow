
import type { Metadata } from 'next'

// This layout is specifically for the public user profile page.
// It uses a simple body without min-height to prevent unwanted scrolling.
export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-screen">{children}</div>;
}


// This is the key change to fix the scraper issue.
// By setting alternates.canonical to null, we prevent Next.js from adding a
// <link rel="canonical"> tag that points back to the homepage, which was
// confusing the scraper.
export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: null,
    alternates: {
      canonical: null,
    },
  };
}
