import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@clerk/clerk-react';

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101922]">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-[#137fec] font-medium"
        >
          ← Back
        </button>
        <UserProfile routing="hash" />
      </div>
    </div>
  );
}
