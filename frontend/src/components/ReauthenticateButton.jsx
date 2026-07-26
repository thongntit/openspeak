import { useClerk } from '@clerk/clerk-react';

export default function ReauthenticateButton({ className = '' }) {
  const { signOut } = useClerk();

  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: '/' })}
      className={className}
    >
      Sign in again
    </button>
  );
}
