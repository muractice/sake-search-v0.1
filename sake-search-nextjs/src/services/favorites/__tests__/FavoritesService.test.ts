import { FavoritesService } from '@/services/favorites/FavoritesService';
import { IFavoritesRepository } from '@/repositories/favorites/FavoritesRepository';
import { IRecommendationCacheRepository } from '@/repositories/recommendations/RecommendationCacheRepository';
import { SakeData } from '@/types/sake';

interface RepoItem { userId: string; sakeId: string; sakeData: SakeData; createdAt: string }

class MockFavoritesRepo implements IFavoritesRepository {
  public items: RepoItem[] = [];
  public addCalls: Array<{ userId: string; sake: SakeData }> = [];
  public removeCalls: Array<{ userId: string; sakeId: string }> = [];
  public shouldThrowOnAdd = false;
  public shouldThrowOnRemove = false;
  public shouldThrowOnList = false;

  async list(userId: string) {
    if (this.shouldThrowOnList) throw new Error('list failed');
    return this.items.filter(i => i.userId === userId).map(i => ({
      sakeId: i.sakeId,
      sakeData: i.sakeData,
      createdAt: i.createdAt,
    }));
  }
  async add(userId: string, sake: SakeData) {
    if (this.shouldThrowOnAdd) throw new Error('add failed');
    this.addCalls.push({ userId, sake });
    this.items.unshift({ userId, sakeId: sake.id, sakeData: sake, createdAt: new Date().toISOString() });
  }
  async remove(userId: string, sakeId: string) {
    if (this.shouldThrowOnRemove) throw new Error('remove failed');
    this.removeCalls.push({ userId, sakeId });
    this.items = this.items.filter(i => !(i.userId === userId && i.sakeId === sakeId));
  }
}

class MockRecCacheRepo implements IRecommendationCacheRepository {
  public clearCalls: string[] = [];
  public shouldThrow = false;
  async clearByUser(userId: string) {
    this.clearCalls.push(userId);
    if (this.shouldThrow) throw new Error('cache clear failed');
  }
}

const mockSake = (id: string): SakeData => ({
  id,
  name: `Sake ${id}`,
  brewery: 'Test Brewery',
  brandId: 1,
  breweryId: 1,
  sweetness: 3,
  richness: 2,
  description: 'desc',
});

describe('FavoritesService', () => {
  let repo: MockFavoritesRepo;
  let cacheRepo: MockRecCacheRepo;
  let service: FavoritesService;

  beforeEach(() => {
    repo = new MockFavoritesRepo();
    cacheRepo = new MockRecCacheRepo();
    service = new FavoritesService(repo, cacheRepo);
  });

  test('list returns [] when userId is empty', async () => {
    const result = await service.list('');
    expect(result).toEqual([]);
  });

  test('list dedupes by sakeId preserving order', async () => {
    const userId = 'u1';
    const s1 = mockSake('s1');
    const s2 = mockSake('s2');
    repo.items = [
      { userId, sakeId: 's1', sakeData: s1, createdAt: '3' },
      { userId, sakeId: 's2', sakeData: s2, createdAt: '2' },
      { userId, sakeId: 's1', sakeData: s1, createdAt: '1' },
    ];
    const result = await service.list(userId);
    expect(result.map(i => i.sakeId)).toEqual(['s1', 's2']);
  });

  test('add is no-op when userId empty', async () => {
    await service.add('', mockSake('s1'));
    expect(repo.addCalls.length).toBe(0);
    expect(cacheRepo.clearCalls.length).toBe(0);
  });

  test('add calls repo and clears cache', async () => {
    const userId = 'u1';
    await service.add(userId, mockSake('s1'));
    expect(repo.addCalls[0]).toEqual({ userId, sake: expect.objectContaining({ id: 's1' }) });
    expect(cacheRepo.clearCalls[0]).toBe(userId);
  });

  test('add propagates repo error', async () => {
    repo.shouldThrowOnAdd = true;
    await expect(service.add('u1', mockSake('s1'))).rejects.toThrow('add failed');
  });

  test('add swallows cache clear error', async () => {
    cacheRepo.shouldThrow = true;
    await expect(service.add('u1', mockSake('s1'))).resolves.toBeUndefined();
  });

  test('remove is no-op when userId empty', async () => {
    await service.remove('', 's1');
    expect(repo.removeCalls.length).toBe(0);
    expect(cacheRepo.clearCalls.length).toBe(0);
  });

  test('remove calls repo and clears cache', async () => {
    const userId = 'u1';
    await service.remove(userId, 's1');
    expect(repo.removeCalls[0]).toEqual({ userId, sakeId: 's1' });
    expect(cacheRepo.clearCalls[0]).toBe(userId);
  });

  test('remove propagates repo error', async () => {
    repo.shouldThrowOnRemove = true;
    await expect(service.remove('u1', 's1')).rejects.toThrow('remove failed');
  });

  test('remove swallows cache clear error', async () => {
    cacheRepo.shouldThrow = true;
    await expect(service.remove('u1', 's1')).resolves.toBeUndefined();
  });
});
