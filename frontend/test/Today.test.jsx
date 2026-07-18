import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getToday } from '@/services/openspeakApi';
import { useLearningStore } from '@/stores/learningStore';
import Today from '@/pages/Today';

const clerk = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: () => Promise.resolve('fresh-token') }),
  useClerk: () => ({ signOut: clerk.signOut }),
}));

vi.mock('@/services/openspeakApi', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getToday: vi.fn(),
    submitReview: vi.fn(),
  };
});

const CARD = {
  id: 'be7d7592-2e3d-4a41-8cf5-20f1ea90f4fd',
  deck_id: '9bb9dfab-3572-44c0-a6cf-bd49edc30563',
  type: 'grammar',
  level: 'A1',
  front: 'She ___ here.',
  answer: 'works',
  explanation: 'Present simple.',
  example: 'She works here.',
  options: ['work', 'works'],
  content_key: 'present-simple-1',
  content_version: 'v1',
  sort_order: 1,
};

const TODAY = {
  queue: [{
    card: CARD,
    progress: {
      stage: 'new',
      due_at: '2026-07-18T00:00:00.000Z',
    },
  }],
  totalDue: 1,
  countsByType: { grammar: 1 },
  countsByDeck: { [CARD.deck_id]: 1 },
  caughtUp: false,
  serverTimestamp: '2026-07-18T00:00:00.000Z',
};

function renderToday() {
  return render(
    <MemoryRouter>
      <Today />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useLearningStore.getState().resetLearning();
});

describe('Today', () => {
  it('loads and renders backend due counts', async () => {
    getToday.mockResolvedValue(TODAY);

    renderToday();

    expect(screen.getByText(/loading today/i)).toBeInTheDocument();
    expect(await screen.findByText('1')).toBeInTheDocument();
    expect(screen.getByText('1 grammar')).toBeInTheDocument();
    expect(getToday).toHaveBeenCalledWith({ token: 'fresh-token' });
  });

  it('renders caught up without a start button', async () => {
    getToday.mockResolvedValue({
      ...TODAY,
      queue: [],
      totalDue: 0,
      countsByType: {},
      countsByDeck: {},
      caughtUp: true,
    });

    renderToday();

    expect(await screen.findByText(/caught up/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start review/i })).not.toBeInTheDocument();
  });

  it.each([
    [404, /learning route is unavailable/i],
    [500, /today is unavailable/i],
    [0, /could not reach the learning service/i],
  ])('renders status %s explicitly and retries', async (status, message) => {
    getToday
      .mockRejectedValueOnce(new ApiError(status, { message: 'failure' }, '/today'))
      .mockResolvedValueOnce(TODAY);
    const user = userEvent.setup();
    renderToday();

    expect(await screen.findByText(message)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByRole('button', { name: /start review session/i })).toBeInTheDocument();
    expect(getToday).toHaveBeenCalledTimes(2);
  });

  it('renders an explicit reauthentication state for 401', async () => {
    const user = userEvent.setup();
    getToday.mockRejectedValue(
      new ApiError(401, { message: 'Authentication required' }, '/today'),
    );

    renderToday();

    expect(await screen.findByText(/session expired/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /sign in again/i }));
    expect(clerk.signOut).toHaveBeenCalledWith({ redirectUrl: '/' });
    expect(screen.queryByText(/caught up/i)).not.toBeInTheDocument();
  });

  it('uses a cached successful response when returning from Review', () => {
    useLearningStore.getState().replaceToday(TODAY);

    renderToday();

    expect(screen.getByRole('button', { name: /start review session/i })).toBeInTheDocument();
    expect(getToday).not.toHaveBeenCalled();
  });
});
