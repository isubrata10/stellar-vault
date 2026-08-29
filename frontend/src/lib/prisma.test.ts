import { describe, it, expect } from 'vitest';
import { prisma } from './prisma';

describe('Prisma DB Client', () => {
  it('should instantiate without crashing', () => {
    expect(prisma).toBeDefined();
  });
});
