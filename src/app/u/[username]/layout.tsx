// This layout is specifically for the public user profile page.
// It uses a simple body without min-height to prevent unwanted scrolling.
export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
