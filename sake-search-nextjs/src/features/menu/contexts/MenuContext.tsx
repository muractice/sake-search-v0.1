'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SakeData } from '@/types/sake';

interface SearchResult {
  success: boolean;
  results: SakeData[];
}

interface MenuContextType {
  // State
  menuItems: string[];
  menuSakeData: SakeData[];
  notFoundItems: string[];
  isProcessing: boolean;
  processingStatus: string;

  // Actions
  handleMenuItemsAdd: (items: string[], fromImageProcessing?: boolean) => Promise<void>;
  handleMenuItemsChange: (items: string[]) => void;
  handleProcessImage: (file: File) => Promise<void>;
  handleRemoveItem: (index: number) => void;
  removeItemByName: (name: string) => void;
  clearMenuData: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

interface MenuProviderProps {
  children: ReactNode;
}

export const MenuProvider = ({ children }: MenuProviderProps) => {
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [menuSakeData, setMenuSakeData] = useState<SakeData[]>([]);
  const [notFoundItems, setNotFoundItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // 日本酒を検索する関数
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

    // 新しい処理開始時に前のメッセージをクリア
    if (fromImageProcessing) {
      setIsProcessing(true);
      setProcessingStatus(`${items.length}件の日本酒を検索中...`);
    } else {
      // テキスト検索の場合もエラーメッセージをクリア
      setProcessingStatus('');
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
        message.push(`${foundSakes.length}件の日本酒を追加しました`);
      }
      if (notFound.length > 0) {
        message.push(`${notFound.length}件が見つかりませんでした`);
      }

      if (fromImageProcessing) {
        setProcessingStatus(message.join(' / '));
      }
    } catch (error) {
      console.error('Error processing menu items:', error);
      if (fromImageProcessing) {
        setProcessingStatus('エラーが発生しました');
      }
    } finally {
      if (fromImageProcessing) {
        setIsProcessing(false);
        // 3秒後にメッセージをクリア
        setTimeout(() => setProcessingStatus(''), 3000);
      }
    }
  }, [searchSake, menuSakeData, notFoundItems, menuItems]);

  // メニューアイテムを変更
  const handleMenuItemsChange = useCallback((items: string[]) => {
    setMenuItems(items);
    
    // menuSakeDataも更新（存在するものだけ残す）
    setMenuSakeData(prev => prev.filter(sake => items.includes(sake.name)));
    
    // notFoundItemsも更新（存在するものだけ残す）
    setNotFoundItems(prev => prev.filter(item => items.includes(item)));
  }, []);

  // 画像処理
  const handleProcessImage = useCallback(async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingStatus('画像を処理中...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.items) {
        await handleMenuItemsAdd(data.items, true);
      } else {
        throw new Error(data.error || '画像処理に失敗しました');
      }
    } catch (error) {
      console.error('Image processing error:', error);
      setProcessingStatus('画像処理でエラーが発生しました');
      setTimeout(() => setProcessingStatus(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  }, [handleMenuItemsAdd]);

  // アイテム削除
  const handleRemoveItem = useCallback((index: number) => {
    setMenuItems(prev => prev.filter((_, i) => i !== index));
    setMenuSakeData(prev => prev.filter((_, i) => i !== index));
    setNotFoundItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // アイテム名で削除（UIの意図に合わせたAPI）
  const removeItemByName = useCallback((name: string) => {
    setMenuItems(prev => prev.filter(item => item !== name));
    setMenuSakeData(prev => prev.filter(sake => sake.name !== name));
    setNotFoundItems(prev => prev.filter(item => item !== name));
  }, []);

  // メニューデータをクリア
  const clearMenuData = useCallback(() => {
    setMenuItems([]);
    setMenuSakeData([]);
    setNotFoundItems([]);
    setProcessingStatus('');
  }, []);

  const value: MenuContextType = {
    // State
    menuItems,
    menuSakeData,
    notFoundItems,
    isProcessing,
    processingStatus,

    // Actions
    handleMenuItemsAdd,
    handleMenuItemsChange,
    handleProcessImage,
    handleRemoveItem,
    removeItemByName,
    clearMenuData,
  };

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenuContext = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenuContext must be used within a MenuProvider');
  }
  return context;
};
