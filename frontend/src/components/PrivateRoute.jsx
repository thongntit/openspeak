import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react'

export default function PrivateRoute({ children }) {
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
