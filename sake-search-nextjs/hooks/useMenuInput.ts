import { useState, useCallback } from 'react';
import { searchSake } from '@/lib/sake-api';
import { SakeData } from '@/types/sake';

export const useMenuInput = () => {
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [menuSakeData, setMenuSakeData] = useState<SakeData[]>([]);
  const [notFoundItems, setNotFoundItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // メニューアイテムを追加
  const handleMenuItemsAdd = useCallback(async (items: string[]) => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setProcessingStatus(`${items.length}件の日本酒を検索中...`);

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
        if (data && data.length > 0) {
          // 既に追加済みでないか確認
          const existingSake = menuSakeData.find(s => s.id === data[0].id);
          if (!existingSake) {
            foundSakes.push(data[0]);
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
      
      if (message.length > 0) {
        setProcessingStatus(message.join('、'));
      }
    } catch (error) {
      console.error('Error processing menu items:', error);
      setProcessingStatus('エラーが発生しました');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStatus('');
      }, 2000);
    }
  }, [menuSakeData, menuItems, notFoundItems]);

  // OCR処理
  const handleProcessImage = useCallback(async (imageData: string) => {
    setIsProcessing(true);
    setProcessingStatus('画像を解析中...');

    try {
      // OCR APIを呼び出し（実装は別途必要）
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });

      if (!response.ok) {
        throw new Error('OCR処理に失敗しました');
      }

      const { sakeNames } = await response.json();
      
      if (sakeNames && sakeNames.length > 0) {
        setProcessingStatus(`${sakeNames.length}件の日本酒を検出しました`);
        await handleMenuItemsAdd(sakeNames);
      } else {
        setProcessingStatus('日本酒が検出されませんでした');
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      setProcessingStatus('画像の処理に失敗しました');
    } finally {
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
      handleMenuItemsAdd(items);
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