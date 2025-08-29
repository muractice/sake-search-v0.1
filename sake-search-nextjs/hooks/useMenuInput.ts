import { useState, useCallback } from 'react';
import { SakeData } from '@/types/sake';

interface SearchResult {
  success: boolean;
  results: SakeData[];
}

export const useMenuInput = () => {
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [menuSakeData, setMenuSakeData] = useState<SakeData[]>([]);
  const [notFoundItems, setNotFoundItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // 日本酒を検索する関数（useSearchフックと同じロジック）
  const searchSake = useCallback(async (query: string): Promise<SakeData | null> => {
    if (!query.trim()) return null;

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data: SearchResult = await response.json();
      
      if (data.success && data.results.length > 0) {
        return data.results[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error('Search error:', error);
      return null;
    }
  }, []);

  // メニューアイテムを追加
  const handleMenuItemsAdd = useCallback(async (items: string[], fromImageProcessing: boolean = false) => {
    if (items.length === 0) return;

    // 画像処理からの呼び出しの場合のみ処理状態を表示
    if (fromImageProcessing) {
      setIsProcessing(true);
      setProcessingStatus(`${items.length}件の日本酒を検索中...`);
    }

    try {
      const results = await Promise.all(
        items.map(async (item) => {
          try {
            const data = await searchSake(item);
            return { item, data };
          } catch {
            return { item, data: null };
          }
        })
      );

      const foundSakes: SakeData[] = [];
      const notFound: string[] = [];

      results.forEach(({ item, data }) => {
        if (data) {
          // 既に追加済みでないか確認
          const existingSake = menuSakeData.find(s => s.id === data.id);
          if (!existingSake) {
            foundSakes.push(data);
          }
        } else {
          // 既にnotFoundに追加済みでないか確認
          if (!notFoundItems.includes(item) && !menuItems.includes(item)) {
            notFound.push(item);
          }
        }
      });

      if (foundSakes.length > 0) {
        setMenuSakeData(prev => [...prev, ...foundSakes]);
        setMenuItems(prev => [...prev, ...foundSakes.map(s => s.name)]);
      }

      if (notFound.length > 0) {
        setNotFoundItems(prev => [...prev, ...notFound]);
        setMenuItems(prev => [...prev, ...notFound]);
      }

      const message = [];
      if (foundSakes.length > 0) {
        message.push(`${foundSakes.length}件の日本酒データを追加`);
      }
      if (notFound.length > 0) {
        message.push(`${notFound.length}件はデータなし`);
      }
      
      if (message.length > 0 && fromImageProcessing) {
        setProcessingStatus(message.join('、'));
      }
    } catch (error) {
      console.error('Error processing menu items:', error);
      if (fromImageProcessing) {
        setProcessingStatus('エラーが発生しました');
      }
    } finally {
      if (fromImageProcessing) {
        setTimeout(() => {
          setIsProcessing(false);
          setProcessingStatus('');
        }, 2000);
      }
    }
  }, [menuSakeData, menuItems, notFoundItems, searchSake]);

  // OCR処理
  const handleProcessImage = useCallback(async (imageData: string) => {
    console.log('=== useMenuInput: OCR処理開始 ===');
    console.log('useMenuInput: 画像データサイズ:', imageData.length);
    console.log('useMenuInput: 画像データ先頭100文字:', imageData.substring(0, 100));
    
    setIsProcessing(true);
    setProcessingStatus('画像を解析中...');

    try {
      console.log('useMenuInput: Gemini Vision APIを呼び出します...');
      
      // Gemini Vision APIを呼び出し
      const response = await fetch('/api/gemini-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });

      console.log('useMenuInput: OCR APIレスポンスステータス:', response.status);
      console.log('useMenuInput: OCR APIレスポンスOK:', response.ok);

      if (!response.ok) {
        console.error('useMenuInput: OCR APIエラー:', response.status, response.statusText);
        throw new Error('OCR処理に失敗しました');
      }

      const result = await response.json();
      console.log('useMenuInput: Gemini Vision APIレスポンス全体:', result);
      console.log('useMenuInput: result.sake_names:', result.sake_names);
      console.log('useMenuInput: result.confidence:', result.confidence);
      
      const { sake_names, text, notes } = result;
      
      console.log('抽出された日本酒名:', sake_names);
      console.log('信頼度:', result.confidence);
      console.log('備考:', notes);
      
      if (sake_names && sake_names.length > 0) {
        // Gemini APIから直接日本酒名が返ってくる
        const sakeNames = sake_names;
        
        if (sakeNames.length > 0) {
          setProcessingStatus(`${sakeNames.length}件の日本酒を検出しました`);
          await handleMenuItemsAdd(sakeNames, true);
        } else {
          console.warn('日本酒が検出されませんでした。');
          console.warn('備考:', notes);
          setProcessingStatus('日本酒が検出されませんでした');
        }
      } else {
        console.warn('Gemini Vision APIから日本酒名が返されませんでした');
        console.warn('APIレスポンス:', result);
        setProcessingStatus('日本酒が検出されませんでした');
      }
    } catch (error) {
      console.error('=== OCR処理エラー ===');
      console.error('エラー詳細:', error);
      setProcessingStatus('画像の処理に失敗しました');
    } finally {
      console.log('=== OCR処理終了 ===');
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStatus('');
      }, 2000);
    }
  }, [handleMenuItemsAdd]);

  // アイテムを削除
  const handleRemoveItem = useCallback((itemName: string) => {
    setMenuItems(prev => prev.filter(item => item !== itemName));
    setMenuSakeData(prev => prev.filter(sake => sake.name !== itemName));
    setNotFoundItems(prev => prev.filter(item => item !== itemName));
  }, []);

  // すべてクリア
  const handleClearAll = useCallback(() => {
    setMenuItems([]);
    setMenuSakeData([]);
    setNotFoundItems([]);
  }, []);

  // メニューアイテムを設定（保存済みメニューのロード時）
  const handleMenuItemsChange = useCallback((items: string[]) => {
    handleClearAll();
    if (items.length > 0) {
      // メニューロード時はメッセージを表示しない（fromImageProcessing = false）
      handleMenuItemsAdd(items, false);
    }
  }, [handleClearAll, handleMenuItemsAdd]);

  return {
    menuItems,
    menuSakeData,
    notFoundItems,
    isProcessing,
    processingStatus,
    handleMenuItemsAdd,
    handleProcessImage,
    handleRemoveItem,
    handleClearAll,
    handleMenuItemsChange
  };
};