import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

function makeHost(url = '/api/test', method = 'GET') {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const req = { originalUrl: url, method };
  return {
    host: {
      switchToHttp: () => ({
        getResponse: () => res,
        getRequest: () => req,
      }),
    } as any,
    res,
    req,
  };
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
  });

  it('maps NotFoundException to 404 with timestamp and path', () => {
    const { host, res } = makeHost('/api/words/abc');
    filter.catch(new NotFoundException('Word abc not found'), host);

    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.json.mock.calls[0][0];
    expect(body.statusCode).toBe(404);
    expect(body.message).toBe('Word abc not found');
    expect(body.path).toBe('/api/words/abc');
    expect(typeof body.timestamp).toBe('string');
  });

  it('flattens class-validator errors array into body.errors', () => {
    const { host, res } = makeHost();
    const ex = new BadRequestException({
      message: ['difficulty must be one of: beginner, intermediate, advanced'],
      error: 'Bad Request',
      statusCode: 400,
    });
    filter.catch(ex, host);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toEqual([
      'difficulty must be one of: beginner, intermediate, advanced',
    ]);
  });

  it('falls back to 500 and generic message for unknown errors in production', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const { host, res } = makeHost();
      filter.catch(new Error('DB connection string leaked'), host);

      expect(res.status).toHaveBeenCalledWith(500);
      const body = res.json.mock.calls[0][0];
      expect(body.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(body.message).toBe('Internal server error');
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it('preserves HttpException string payloads', () => {
    const { host, res } = makeHost();
    filter.catch(new HttpException('Teapot', 418), host);
    expect(res.status).toHaveBeenCalledWith(418);
    expect(res.json.mock.calls[0][0].message).toBe('Teapot');
  });
});
