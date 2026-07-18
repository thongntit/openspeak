import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  getToday,
  submitReview,
} from '@/services/openspeakApi';
import { useLearningStore } from '@/stores/learningStore';
import Review from '@/pages/Review';

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken: () => Promise.resolve('fresh-token') }),
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
  explanation: 'Use present simple for a routine.',
  example: 'She works here.',
  options: ['work', 'works'],
  content_key: 'present-simple-1',
  content_version: 'v1',
  sort_order: 1,
};

const NEXT_CARD = {
  ...CARD,
  id: '22a4cd0f-768f-4446-90e6-62aa019a1490',
  type: 'vocab',
  front: 'mitigate',
  answer: 'make less severe',
  explanation: 'To reduce the seriousness of something.',
  example: 'Trees mitigate flood risk.',
  options: null,
  content_key: 'mitigate',
  sort_order: 2,
};

function queueItem(card) {
  return {
    card,
    progress: {
      stage: 'new',
      due_at: '2026-07-18T00:00:00.000Z',
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      repetitions: 0,
      lapses: 0,
      last_reviewed_at: null,
      last_rating: null,
      scheduler_version: 'fsrs-v1',
    },
  };
}

const TODAY = {
  queue: [queueItem(CARD)],
  totalDue: 1,
  countsByType: { grammar: 1 },
  countsByDeck: { [CARD.deck_id]: 1 },
  caughtUp: false,
  serverTimestamp: '2026-07-18T00:00:00.000Z',
};

const NEXT_TODAY = {
  ...TODAY,
  queue: [queueItem(NEXT_CARD)],
  countsByType: { vocab: 1 },
  serverTimestamp: '2026-07-18T00:01:00.000Z',
};

const CAUGHT_UP = {
  ...TODAY,
  queue: [],
  totalDue: 0,
  countsByType: {},
  countsByDeck: {},
  caughtUp: true,
  serverTimestamp: '2026-07-18T00:02:00.000Z',
};

function renderReview() {
  return render(
    <MemoryRouter initialEntries={['/review']}>
      <Routes>
        <Route path="/review" element={<Review />} />
        <Route path="/" element={<div>Today route</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function revealAndRate(user, rating) {
  await user.click(screen.getByRole('button', { name: /show answer/i }));
  await user.click(screen.getByRole('button', { name: new RegExp(`^${rating}`, 'i') }));
}

beforeEach(() => {
  vi.clearAllMocks();
  useLearningStore.getState().resetLearning();
});

describe('Review', () => {
  it('renders the backend queue head and answer fields', async () => {
    const user = userEvent.setup();
    useLearningStore.getState().replaceToday(TODAY);

    renderReview();

    expect(screen.getByText(CARD.front)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /show answer/i }));
    expect(screen.getByLabelText('Correct answer')).toHaveTextContent(CARD.answer);
    expect(screen.getByText(CARD.explanation)).toBeInTheDocument();
    expect(screen.getByText(CARD.example)).toBeInTheDocument();
  });

  it('disables ratings until POST resolves then renders the returned next card', async () => {
    const user = userEvent.setup();
    useLearningStore.getState().replaceToday(TODAY);
    let resolveReview;
    submitReview.mockReturnValue(new Promise((resolve) => {
      resolveReview = resolve;
    }));
    renderReview();

    await revealAndRate(user, 'Good');

    expect(screen.getByRole('button', { name: /^good/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /exit review/i })).toBeDisabled();
    resolveReview({ duplicate: false, today: NEXT_TODAY });

    expect(await screen.findByText(NEXT_CARD.front)).toBeInTheDocument();
    expect(screen.queryByText(CARD.front)).not.toBeInTheDocument();
  });

  it('retries a transient failure with the identical request and completes', async () => {
    const user = userEvent.setup();
    useLearningStore.getState().replaceToday(TODAY);
    submitReview
      .mockRejectedValueOnce(new ApiError(500, { message: 'failure' }, '/reviews'))
      .mockResolvedValueOnce({ duplicate: true, today: CAUGHT_UP });
    renderReview();

    await revealAndRate(user, 'Good');

    const retry = await screen.findByRole('button', { name: /retry review/i });
    const firstPayload = submitReview.mock.calls[0][0];
    await user.click(retry);

    expect(submitReview.mock.calls[1][0]).toEqual(firstPayload);
    expect(await screen.findByText(/session complete/i)).toBeInTheDocument();
  });

  it('hard-refreshes Today state before showing a direct review route', async () => {
    getToday.mockResolvedValue(TODAY);

    renderReview();

    expect(screen.getByText(/loading review session/i)).toBeInTheDocument();
    expect(await screen.findByText(CARD.front)).toBeInTheDocument();
    expect(getToday).toHaveBeenCalledOnce();
  });

  it('refreshes Today once after a submitted card returns 404', async () => {
    const user = userEvent.setup();
    useLearningStore.getState().replaceToday(TODAY);
    submitReview.mockRejectedValue(
      new ApiError(404, { message: 'Card not found' }, '/reviews'),
    );
    getToday.mockResolvedValue(NEXT_TODAY);
    renderReview();

    await revealAndRate(user, 'Hard');

    expect(await screen.findByText(NEXT_CARD.front)).toBeInTheDocument();
    expect(getToday).toHaveBeenCalledOnce();
  });

  it('requires a session refresh after a 409 conflict', async () => {
    const user = userEvent.setup();
    useLearningStore.getState().replaceToday(TODAY);
    submitReview.mockRejectedValue(
      new ApiError(409, { message: 'Request conflict' }, '/reviews'),
    );
    getToday.mockResolvedValue(NEXT_TODAY);
    renderReview();

    await revealAndRate(user, 'Easy');

    expect(await screen.findByText(/request conflict/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /refresh session/i }));
    expect(await screen.findByText(NEXT_CARD.front)).toBeInTheDocument();
  });

  it('returns from Complete to the caught-up Today route', async () => {
    const user = userEvent.setup();
    useLearningStore.getState().replaceToday(CAUGHT_UP);
    renderReview();

    await user.click(screen.getByRole('button', { name: /back to today/i }));

    expect(screen.getByText('Today route')).toBeInTheDocument();
  });
});
