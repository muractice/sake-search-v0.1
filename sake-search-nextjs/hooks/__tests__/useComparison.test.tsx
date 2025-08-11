import { renderHook, act } from '@testing-library/react';
import { useComparison } from '../useComparison';
import { SakeData } from '@/types/sake';

// テスト用のダミーデータ
const createSakeData = (id: string, name: string): SakeData => ({
  id,
  name,
  brewery: 'テスト酒造',
  region: '東京都',
  sweetness: 0,
  acidity: 0,
  richness: 0,
  tags: [],
  images: [],
  prices: [],
  ratings: { average: 0, count: 0 },
  description: '',
  alcoholContent: 15,
  ricePolishingRate: 60,
  volume: 720,
});

describe('useComparison', () => {
  const sake1 = createSakeData('1', '日本酒1');
  const sake2 = createSakeData('2', '日本酒2');
  const sake3 = createSakeData('3', '日本酒3');
  const sake4 = createSakeData('4', '日本酒4');
  const sake5 = createSakeData('5', '日本酒5');

  describe('初期状態', () => {
    test('比較リストが空であること', () => {
      const { result } = renderHook(() => useComparison());
      expect(result.current.comparisonList).toHaveLength(0);
    });

    test('比較モードがfalseであること', () => {
      const { result } = renderHook(() => useComparison());
      expect(result.current.isComparisonMode).toBe(false);
    });
  });

  describe('toggleComparison', () => {
    test('新しい日本酒を追加できること', () => {
      const { result } = renderHook(() => useComparison());

      act(() => {
        result.current.toggleComparison(sake1);
      });

      expect(result.current.comparisonList).toHaveLength(1);
      expect(result.current.comparisonList[0].id).toBe('1');
    });

    test('既存の日本酒をトグルすると削除されること', () => {
      const { result } = renderHook(() => useComparison());

      act(() => {
        result.current.toggleComparison(sake1);
      });
      expect(result.current.comparisonList).toHaveLength(1);

      act(() => {
        result.current.toggleComparison(sake1);
      });
      expect(result.current.comparisonList).toHaveLength(0);
    });

    test('4件まで追加できること', () => {
      const { result } = renderHook(() => useComparison());

      act(() => {
        result.current.toggleComparison(sake1);
        result.current.toggleComparison(sake2);
        result.current.toggleComparison(sake3);
        result.current.toggleComparison(sake4);
      });

      expect(result.current.comparisonList).toHaveLength(4);
    });

    test('5件目は追加されないこと', () => {
      const { result } = renderHook(() => useComparison());

      act(() => {
        result.current.toggleComparison(sake1);
        result.current.toggleComparison(sake2);
        result.current.toggleComparison(sake3);
        result.current.toggleComparison(sake4);
        result.current.toggleComparison(sake5);
      });

      expect(result.current.comparisonList).toHaveLength(4);
      expect(result.current.comparisonList.find(s => s.id === '5')).toBeUndefined();
    });

    test('同じ日本酒を重複して追加できないこと', () => {
      const { result } = renderHook(() => useComparison());

      act(() => {
        result.current.toggleComparison(sake1);
      });

      // 1件追加されている
      expect(result.current.comparisonList).toHaveLength(1);

      act(() => {
        result.current.toggleComparison(sake1);
      });

      // 2回目のトグルで削除される
      expect(result.current.comparisonList).toHaveLength(0);
    });
  });

  describe('isInComparison', () => {
    test('リストに存在する日本酒はtrueを返すこと', () => {
      const { result } = renderHook(() => useComparison());

      act(() => {
        result.current.toggleComparison(sake1);
      });

      expect(result.current.isInComparison('1')).toBe(true);
    });

    test('リストに存在しない日本酒はfalseを返すこと', () => {
      const { result } = renderHook(() => useComparison());

      act(() => {
        result.current.toggleComparison(sake1);
      });

      expect(result.current.isInComparison('2')).toBe(false);
    });
  });

  describe('clearComparison', () => {
    test('リストが空になること', () => {
      const { result } = renderHook(() => useComparison());

      act(() => {
        result.current.toggleComparison(sake1);
        result.current.toggleComparison(sake2);
      });
      expect(result.current.comparisonList).toHaveLength(2);

      act(() => {
        result.current.clearComparison();
      });

      expect(result.current.comparisonList).toHaveLength(0);
    });

    test('比較モードもfalseになること', () => {
      const { result } = renderHook(() => useComparison());

      act(() => {
        result.current.setIsComparisonMode(true);
      });
      expect(result.current.isComparisonMode).toBe(true);

      act(() => {
        result.current.clearComparison();
      });

      expect(result.current.isComparisonMode).toBe(false);
    });
  });

  describe('toggleComparisonMode', () => {
    test('比較モードをトグルできること', () => {
      const { result } = renderHook(() => useComparison());

      expect(result.current.isComparisonMode).toBe(false);

      act(() => {
        result.current.toggleComparisonMode();
      });
      expect(result.current.isComparisonMode).toBe(true);

      act(() => {
        result.current.toggleComparisonMode();
      });
      expect(result.current.isComparisonMode).toBe(false);
    });
  });

  describe('setIsComparisonMode', () => {
    test('比較モードを直接設定できること', () => {
      const { result } = renderHook(() => useComparison());

      act(() => {
        result.current.setIsComparisonMode(true);
      });
      expect(result.current.isComparisonMode).toBe(true);

      act(() => {
        result.current.setIsComparisonMode(false);
      });
      expect(result.current.isComparisonMode).toBe(false);
    });
  });

  describe('プライベート関数のテスト', () => {
    test('addToComparisonとremoveFromComparisonは外部から呼び出せないこと', () => {
      const { result } = renderHook(() => useComparison());
      
      // returnされたオブジェクトにaddToComparisonとremoveFromComparisonが含まれていないことを確認
      expect(result.current).not.toHaveProperty('addToComparison');
      expect(result.current).not.toHaveProperty('removeFromComparison');
    });

    test('公開APIのみが利用可能であること', () => {
      const { result } = renderHook(() => useComparison());
      
      // 公開されているプロパティとメソッドの確認
      expect(result.current).toHaveProperty('comparisonList');
      expect(result.current).toHaveProperty('isComparisonMode');
      expect(result.current).toHaveProperty('toggleComparison');
      expect(result.current).toHaveProperty('isInComparison');
      expect(result.current).toHaveProperty('clearComparison');
      expect(result.current).toHaveProperty('toggleComparisonMode');
      expect(result.current).toHaveProperty('setIsComparisonMode');
    });
  });
});