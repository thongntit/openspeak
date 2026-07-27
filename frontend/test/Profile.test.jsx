import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Profile from '@/pages/Profile';
import { getProfileSummary } from '@/services/openspeakApi';
import { useThemeStore } from '@/stores/themeStore';

const clerk = vi.hoisted(() => ({
  getToken: vi.fn().mockResolvedValue('fresh-token'),
  openUserProfile: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: clerk.getToken }),
  useClerk: () => clerk,
  useUser: () => ({
    user: {
      fullName: 'Thong Nguyen',
      primaryEmailAddress: { emailAddress: 'thong@example.com' },
      imageUrl: 'https://example.com/avatar.png',
    },
  }),
}));

vi.mock('@/services/openspeakApi', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getProfileSummary: vi.fn() };
});

beforeEach(() => {
  vi.clearAllMocks();
  useThemeStore.getState().setTheme(false);
});

describe('Profile', () => {
  it('shows the signed-in learner and persisted learning metrics', async () => {
    getProfileSummary.mockResolvedValue({
      reviewsCompleted: 17,
      learningDecks: 2,
      dueNow: 4,
    });

    render(<Profile />);

    expect(screen.getByText('Thong Nguyen')).toBeInTheDocument();
    expect(screen.getByText('thong@example.com')).toBeInTheDocument();
    expect(await screen.findByText('17')).toBeInTheDocument();
    expect(screen.getByText('Reviews')).toBeInTheDocument();
    expect(screen.getByText('Learning decks')).toBeInTheDocument();
    expect(screen.getByText('Due now')).toBeInTheDocument();
    expect(screen.queryByText('438')).not.toBeInTheDocument();
    expect(getProfileSummary).toHaveBeenCalledWith({ token: 'fresh-token' });
  });

  it('shows an explicit unavailable state and retries the summary request', async () => {
    const user = userEvent.setup();
    getProfileSummary.mockRejectedValueOnce(new Error('offline'));
    getProfileSummary.mockResolvedValueOnce({
      reviewsCompleted: 0,
      learningDecks: 0,
      dueNow: 0,
    });

    render(<Profile />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Learning stats are unavailable right now.',
    );
    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByText('Reviews')).toBeInTheDocument();
    expect(getProfileSummary).toHaveBeenCalledTimes(2);
  });
});
