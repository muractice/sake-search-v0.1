import { renderHook, act } from '@testing-library/react';
import { useSelection } from '../useSelection';
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

describe('useSelection', () => {
  const sake1 = createSakeData('1', '日本酒1');
  const sake2 = createSakeData('2', '日本酒2');

  describe('初期状態', () => {
    test('選択されていない状態であること', () => {
      const { result } = renderHook(() => useSelection());
      expect(result.current.selectedSake).toBe(null);
    });
  });

  describe('selectSake機能', () => {
    test('日本酒を選択できること', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.selectSake(sake1);
      });

      expect(result.current.selectedSake).toBe(sake1);
      expect(result.current.selectedSake?.name).toBe('日本酒1');
    });

    test('異なる日本酒に選択を変更できること', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.selectSake(sake1);
      });
      expect(result.current.selectedSake?.name).toBe('日本酒1');

      act(() => {
        result.current.selectSake(sake2);
      });
      expect(result.current.selectedSake?.name).toBe('日本酒2');
    });

    test('nullを選択できること', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.selectSake(sake1);
      });
      expect(result.current.selectedSake).not.toBe(null);

      act(() => {
        result.current.selectSake(null);
      });
      expect(result.current.selectedSake).toBe(null);
    });
  });

  describe('clearSelection機能', () => {
    test('選択をクリアできること', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.selectSake(sake1);
      });
      expect(result.current.selectedSake).not.toBe(null);

      act(() => {
        result.current.clearSelection();
      });
      expect(result.current.selectedSake).toBe(null);
    });

    test('既にnullの場合もクリアできること', () => {
      const { result } = renderHook(() => useSelection());

      expect(result.current.selectedSake).toBe(null);

      act(() => {
        result.current.clearSelection();
      });
      expect(result.current.selectedSake).toBe(null);
    });
  });

  describe('handleChartClick機能', () => {
    test('チャートクリックで日本酒を選択できること', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleChartClick(sake1);
      });

      expect(result.current.selectedSake).toBe(sake1);
      expect(result.current.selectedSake?.name).toBe('日本酒1');
    });

    test('チャートクリックで選択を変更できること', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleChartClick(sake1);
      });
      expect(result.current.selectedSake?.name).toBe('日本酒1');

      act(() => {
        result.current.handleChartClick(sake2);
      });
      expect(result.current.selectedSake?.name).toBe('日本酒2');
    });
  });

  describe('公開APIのテスト', () => {
    test('公開APIのみが利用可能であること', () => {
      const { result } = renderHook(() => useSelection());
      
      // 公開されているプロパティとメソッドの確認
      expect(result.current).toHaveProperty('selectedSake');
      expect(result.current).toHaveProperty('selectSake');
      expect(result.current).toHaveProperty('clearSelection');
      expect(result.current).toHaveProperty('handleChartClick');
      
      // 関数の型確認
      expect(typeof result.current.selectSake).toBe('function');
      expect(typeof result.current.clearSelection).toBe('function');
      expect(typeof result.current.handleChartClick).toBe('function');
    });
  });

  describe('統合テスト', () => {
    test('複数の操作を組み合わせて正常に動作すること', () => {
      const { result } = renderHook(() => useSelection());

      // 初期状態確認
      expect(result.current.selectedSake).toBe(null);

      // selectSakeで選択
      act(() => {
        result.current.selectSake(sake1);
      });
      expect(result.current.selectedSake?.name).toBe('日本酒1');

      // handleChartClickで異なる日本酒を選択
      act(() => {
        result.current.handleChartClick(sake2);
      });
      expect(result.current.selectedSake?.name).toBe('日本酒2');

      // clearSelectionで選択解除
      act(() => {
        result.current.clearSelection();
      });
      expect(result.current.selectedSake).toBe(null);

      // 再度selectSakeで選択
      act(() => {
        result.current.selectSake(sake1);
      });
      expect(result.current.selectedSake?.name).toBe('日本酒1');
    });
  });
});