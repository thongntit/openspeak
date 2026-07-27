import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { DeckEnrollmentController } from './deck-enrollment.controller';

describe('DeckEnrollmentController', () => {
  it('forwards the authenticated user and deck ids', async () => {
    const enrollment = { enroll: jest.fn().mockResolvedValue({}) } as any;
    const controller = new DeckEnrollmentController(enrollment);

    await controller.enroll(
      { id: 'user-123' } as any,
      '22222222-2222-4222-8222-222222222222',
    );

    expect(enrollment.enroll).toHaveBeenCalledWith(
      'user-123',
      '22222222-2222-4222-8222-222222222222',
    );
  });

  it('uses HTTP 200 for repeat-safe enrollment', () => {
    const handler = Object.getOwnPropertyDescriptor(
      DeckEnrollmentController.prototype,
      'enroll',
    )?.value;

    expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler)).toBe(
      HttpStatus.OK,
    );
  });

  it('forwards a stop-learning request for the authenticated user', async () => {
    const enrollment = { stopLearning: jest.fn().mockResolvedValue({}) } as any;
    const controller = new DeckEnrollmentController(enrollment);

    await controller.stopLearning(
      { id: 'user-123' } as any,
      '22222222-2222-4222-8222-222222222222',
    );

    expect(enrollment.stopLearning).toHaveBeenCalledWith(
      'user-123',
      '22222222-2222-4222-8222-222222222222',
    );
  });

  it('uses HTTP 200 for repeat-safe stop learning', () => {
    const handler = Object.getOwnPropertyDescriptor(
      DeckEnrollmentController.prototype,
      'stopLearning',
    )?.value;

    expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler)).toBe(
      HttpStatus.OK,
    );
  });
});
