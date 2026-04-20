import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Controller()
export class AppController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get('health')
  async health(): Promise<{ status: string; db: string; uptime: number }> {
    let db = 'up';
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      db = 'down';
    }
    return { status: 'ok', db, uptime: Math.floor(process.uptime()) };
  }
}
