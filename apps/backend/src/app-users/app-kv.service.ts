import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppKv } from './app-kv.entity';

@Injectable()
export class AppKvService {
  constructor(
    @InjectRepository(AppKv, 'app')
    private readonly repo: Repository<AppKv>,
  ) {}

  async get(key: string): Promise<unknown> {
    const row = await this.repo.findOne({ where: { key } });
    if (!row) return null;
    try { return JSON.parse(row.value); } catch { return null; }
  }

  async set(key: string, value: unknown, userId?: number): Promise<void> {
    const json = JSON.stringify(value);
    const existing = await this.repo.findOne({ where: { key } });
    if (existing) {
      existing.value = json;
      existing.userId = userId ?? existing.userId;
      await this.repo.save(existing);
    } else {
      await this.repo.save(this.repo.create({ key, value: json, userId: userId ?? null }));
    }
  }

  async remove(key: string): Promise<void> {
    await this.repo.delete({ key });
  }

  async listKeys(prefix?: string): Promise<string[]> {
    const all = await this.repo.find({ select: ['key'] });
    if (!prefix) return all.map(r => r.key);
    return all.filter(r => r.key.startsWith(prefix)).map(r => r.key);
  }
}
