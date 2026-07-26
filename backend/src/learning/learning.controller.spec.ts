import { LearningController } from './learning.controller';

describe('LearningController', () => {
  it('forwards the authenticated user id to the Today service', () => {
    const learning = { getToday: jest.fn() } as any;
    const controller = new LearningController(learning);

    void controller.getToday({ id: 'user-123' } as any);

    expect(learning.getToday).toHaveBeenCalledWith('user-123');
  });
});
