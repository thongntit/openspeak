import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react'

const HAS_CLERK = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export default function PrivateRoute({ children }) {
  if (!HAS_CLERK) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)] p-6 text-center">
        <div>
          <div className="text-[15px] font-semibold text-[var(--text-1)]">Sign in required</div>
          <div className="mt-1 text-[13px] text-[var(--text-2)]">Authentication is not configured in this environment.</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-gray-50 dark:bg-[#101922] flex items-center justify-center p-4">
          <SignIn routing="hash" />
        </div>
      </SignedOut>
    </>
  )
}
