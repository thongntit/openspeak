import { DeckType } from '../learning/entities/deck.entity';
import { LearningContentController } from './learning-content.controller';

describe('LearningContentController', () => {
  it('scopes the published deck list to the authenticated user', async () => {
    const response = {
      data: [],
      total: 0,
      limit: 20,
      offset: 0,
      hasNext: false,
      hasPrev: false,
    };
    const content = {
      findPublishedDecks: jest.fn().mockResolvedValue(response),
    } as any;
    const controller = new LearningContentController(content);
    const query = {
      limit: 20,
      offset: 0,
      type: DeckType.Grammar,
    };

    await (controller.findAll as any)({ id: 'user-123' }, query);

    expect(content.findPublishedDecks).toHaveBeenCalledWith(
      'user-123',
      query,
    );
  });
});
