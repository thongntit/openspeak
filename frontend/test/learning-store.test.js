import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  enrollDeck,
  getToday,
  submitReview,
} from '@/services/openspeakApi';
import { useLearningStore } from '@/stores/learningStore';

vi.mock('@/services/openspeakApi', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    enrollDeck: vi.fn(),
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

const TODAY = {
  queue: [{
    card: CARD,
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
  }],
  totalDue: 1,
  countsByType: { grammar: 1 },
  countsByDeck: { [CARD.deck_id]: 1 },
  caughtUp: false,
  serverTimestamp: '2026-07-18T00:00:00.000Z',
};

const CAUGHT_UP = {
  ...TODAY,
  queue: [],
  totalDue: 0,
  countsByType: {},
  countsByDeck: {},
  caughtUp: true,
  serverTimestamp: '2026-07-18T00:01:00.000Z',
};

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.clearAllMocks();
  useLearningStore.getState().resetLearning();
});

describe('learning store', () => {
  it('enrolls with a fresh token and replaces the whole Today snapshot', async () => {
    enrollDeck.mockResolvedValue({
      deckId: '9bb9dfab-3572-44c0-a6cf-bd49edc30563',
      isLearning: true,
      enrolledCardCount: 1,
      today: TODAY,
    });

    const response = await useLearningStore.getState().enrollDeck(
      '9bb9dfab-3572-44c0-a6cf-bd49edc30563',
      () => Promise.resolve('fresh-token'),
    );

    expect(enrollDeck).toHaveBeenCalledWith(
      '9bb9dfab-3572-44c0-a6cf-bd49edc30563',
      { token: 'fresh-token' },
    );
    expect(response).toMatchObject({
      deckId: '9bb9dfab-3572-44c0-a6cf-bd49edc30563',
      isLearning: true,
    });
    expect(useLearningStore.getState()).toMatchObject({
      today: TODAY,
      loadStatus: 'ready',
      loadError: null,
    });
  });

  it('ignores a stale enrollment success after the learning session resets', async () => {
    const request = deferred();
    enrollDeck.mockReturnValue(request.promise);

    const enrollment = useLearningStore.getState().enrollDeck(
      '9bb9dfab-3572-44c0-a6cf-bd49edc30563',
      () => Promise.resolve('user-a-token'),
    );
    await vi.waitFor(() => expect(enrollDeck).toHaveBeenCalledOnce());

    useLearningStore.getState().resetLearning();
    request.resolve({
      deckId: '9bb9dfab-3572-44c0-a6cf-bd49edc30563',
      isLearning: true,
      enrolledCardCount: 1,
      today: TODAY,
    });
    await enrollment;

    expect(useLearningStore.getState()).toMatchObject({
      today: null,
      loadStatus: 'idle',
      loadError: null,
    });
  });

  it('ignores a stale Today success after the learning session resets', async () => {
    const request = deferred();
    getToday.mockReturnValue(request.promise);

    const load = useLearningStore.getState().loadToday(
      () => Promise.resolve('user-a-token'),
    );
    await vi.waitFor(() => expect(getToday).toHaveBeenCalledOnce());

    useLearningStore.getState().resetLearning();
    request.resolve(TODAY);
    await load;

    expect(useLearningStore.getState()).toMatchObject({
      today: null,
      loadStatus: 'idle',
      loadError: null,
      reviewStatus: 'idle',
      reviewError: null,
      pendingReview: null,
    });
  });

  it('ignores a stale Today failure after the learning session resets', async () => {
    const request = deferred();
    getToday.mockReturnValue(request.promise);

    const load = useLearningStore.getState().loadToday(
      () => Promise.resolve('user-a-token'),
    );
    await vi.waitFor(() => expect(getToday).toHaveBeenCalledOnce());

    useLearningStore.getState().resetLearning();
    request.reject(new ApiError(500, { message: 'User A failed' }, '/today'));
    await load;

    expect(useLearningStore.getState()).toMatchObject({
      today: null,
      loadStatus: 'idle',
      loadError: null,
      reviewStatus: 'idle',
      reviewError: null,
      pendingReview: null,
    });
  });

  it('ignores a stale review success after the learning session resets', async () => {
    const request = deferred();
    submitReview.mockReturnValue(request.promise);
    useLearningStore.getState().replaceToday(TODAY);
    useLearningStore.getState().beginReview(CARD.id, 'good');

    const submit = useLearningStore.getState().submitPendingReview(
      () => Promise.resolve('user-a-token'),
    );
    await vi.waitFor(() => expect(submitReview).toHaveBeenCalledOnce());

    useLearningStore.getState().resetLearning();
    request.resolve({ duplicate: false, today: CAUGHT_UP });
    await submit;

    expect(useLearningStore.getState()).toMatchObject({
      today: null,
      loadStatus: 'idle',
      loadError: null,
      reviewStatus: 'idle',
      reviewError: null,
      pendingReview: null,
    });
  });

  it('ignores a stale review failure after the learning session resets', async () => {
    const request = deferred();
    submitReview.mockReturnValue(request.promise);
    useLearningStore.getState().replaceToday(TODAY);
    useLearningStore.getState().beginReview(CARD.id, 'hard');

    const submit = useLearningStore.getState().submitPendingReview(
      () => Promise.resolve('user-a-token'),
    );
    await vi.waitFor(() => expect(submitReview).toHaveBeenCalledOnce());

    useLearningStore.getState().resetLearning();
    request.reject(new ApiError(0, { message: 'User A failed' }, '/reviews'));
    await submit;

    expect(useLearningStore.getState()).toMatchObject({
      today: null,
      loadStatus: 'idle',
      loadError: null,
      reviewStatus: 'idle',
      reviewError: null,
      pendingReview: null,
    });
  });

  it('loads a fresh token and replaces the whole Today snapshot', async () => {
    getToday.mockResolvedValue(TODAY);

    await useLearningStore.getState().loadToday(
      () => Promise.resolve('fresh-token'),
    );

    expect(getToday).toHaveBeenCalledWith({ token: 'fresh-token' });
    expect(useLearningStore.getState()).toMatchObject({
      today: TODAY,
      loadStatus: 'ready',
      loadError: null,
    });
  });

  it('reuses one request identity and fetches a fresh token after transient failure', async () => {
    useLearningStore.getState().replaceToday(TODAY);
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      'a9ba9e4d-f965-48f6-8a66-1d6279e038d0',
    );
    useLearningStore.getState().beginReview(CARD.id, 'good');
    const original = useLearningStore.getState().pendingReview;
    const getToken = vi.fn()
      .mockResolvedValueOnce('first-token')
      .mockResolvedValueOnce('retry-token');
    submitReview.mockRejectedValueOnce(
      new ApiError(0, { message: 'Network error' }, '/reviews'),
    );

    await useLearningStore.getState().submitPendingReview(getToken);

    expect(useLearningStore.getState()).toMatchObject({
      reviewStatus: 'retryable-error',
      pendingReview: original,
    });
    submitReview.mockResolvedValueOnce({
      duplicate: true,
      today: CAUGHT_UP,
    });

    await useLearningStore.getState().retryPendingReview(getToken);

    expect(submitReview.mock.calls[0]).toEqual([
      original,
      { token: 'first-token' },
    ]);
    expect(submitReview.mock.calls[1]).toEqual([
      original,
      { token: 'retry-token' },
    ]);
    expect(useLearningStore.getState()).toMatchObject({
      reviewStatus: 'idle',
      reviewError: null,
      pendingReview: null,
      today: CAUGHT_UP,
    });
  });

  it('accepts only one in-flight submit for the pending review', async () => {
    const request = deferred();
    const response = { duplicate: false, today: CAUGHT_UP };
    submitReview.mockReturnValue(request.promise);
    useLearningStore.getState().replaceToday(TODAY);
    useLearningStore.getState().beginReview(CARD.id, 'good');
    const getToken = vi.fn().mockResolvedValue('fresh-token');

    const first = useLearningStore.getState().submitPendingReview(getToken);
    const second = useLearningStore.getState().submitPendingReview(getToken);
    await vi.waitFor(() => expect(submitReview).toHaveBeenCalled());
    request.resolve(response);

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(submitReview).toHaveBeenCalledOnce();
    expect(firstResult).toBe(response);
    expect(secondResult).toBeNull();
    expect(useLearningStore.getState()).toMatchObject({
      today: CAUGHT_UP,
      pendingReview: null,
      reviewStatus: 'idle',
    });
  });

  it('does not create a new UUID when the same failed rating is begun again', () => {
    useLearningStore.getState().replaceToday(TODAY);
    const randomUUID = vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      'a9ba9e4d-f965-48f6-8a66-1d6279e038d0',
    );
    useLearningStore.getState().beginReview(CARD.id, 'hard');
    const pendingReview = useLearningStore.getState().pendingReview;

    useLearningStore.getState().beginReview(CARD.id, 'hard');

    expect(randomUUID).toHaveBeenCalledOnce();
    expect(useLearningStore.getState().pendingReview).toBe(pendingReview);
  });

  it('rejects a pending request that no longer matches the queue head', async () => {
    useLearningStore.getState().replaceToday(TODAY);
    useLearningStore.getState().beginReview(CARD.id, 'hard');
    useLearningStore.getState().replaceToday({
      ...TODAY,
      queue: [{
        ...TODAY.queue[0],
        card: {
          ...CARD,
          id: '22a4cd0f-768f-4446-90e6-62aa019a1490',
        },
      }],
    });

    await useLearningStore.getState().submitPendingReview(
      () => Promise.resolve('token'),
    );

    expect(submitReview).not.toHaveBeenCalled();
    expect(useLearningStore.getState()).toMatchObject({
      reviewStatus: 'error',
      reviewError: { status: 409 },
      pendingReview: null,
    });
  });

  it('resets the whole learning session while preserving a 401 load error', async () => {
    useLearningStore.getState().replaceToday(TODAY);
    useLearningStore.getState().beginReview(CARD.id, 'hard');
    submitReview.mockRejectedValueOnce(
      new ApiError(0, { message: 'Network error' }, '/reviews'),
    );
    await useLearningStore.getState().submitPendingReview(
      () => Promise.resolve('expired'),
    );
    getToday.mockRejectedValue(
      new ApiError(401, { message: 'Authentication required' }, '/today'),
    );

    await useLearningStore.getState().loadToday(
      () => Promise.resolve('expired'),
    );

    expect(useLearningStore.getState()).toMatchObject({
      today: null,
      loadStatus: 'error',
      loadError: {
        status: 401,
        message: 'Authentication required',
      },
      reviewStatus: 'idle',
      reviewError: null,
      pendingReview: null,
    });
  });

  it('retains an explicit 404 review error for a server refresh decision', async () => {
    useLearningStore.getState().replaceToday(TODAY);
    useLearningStore.getState().beginReview(CARD.id, 'easy');
    submitReview.mockRejectedValue(
      new ApiError(404, { message: 'Card not found' }, '/reviews'),
    );

    await useLearningStore.getState().submitPendingReview(
      () => Promise.resolve('token'),
    );

    expect(useLearningStore.getState()).toMatchObject({
      reviewStatus: 'error',
      reviewError: { status: 404, message: 'Card not found' },
      pendingReview: null,
    });
  });
});
