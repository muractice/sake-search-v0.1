'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SakeData } from '@/types/sake';
import ScanService from '@/services/ScanService';
import { addMenuItemsAction } from '@/app/actions/menu';

// 旧APIレスポンス型は不要になったため削除

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
  clearProcessingStatus: () => void;
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

  // バッチで日本酒を検索（Server Action）
  const searchSakesBatch = useCallback(async (items: string[]) => {
    return addMenuItemsAction(items);
  }, []);

  // メニューアイテムを追加
  const handleMenuItemsAdd = useCallback(async (items: string[], fromImageProcessing: boolean = false) => {
    console.log('[handleMenuItemsAdd] 開始 - items:', items);
    console.log('[handleMenuItemsAdd] 現在のmenuSakeData:', menuSakeData.map(s => s.id));
    
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
      const { foundSakes, notFound } = await searchSakesBatch(items);

      if (foundSakes.length > 0) {
        console.log('[handleMenuItemsAdd] 追加候補の日本酒:', foundSakes.map(s => s.id));
        
        setMenuSakeData(prev => {
          // 1) 入力自体の重複も除去
          const incoming = Array.from(new Map(foundSakes.map(s => [s.id, s])).values());
          
          // 2) 既存IDを除いたものだけ追加（順序: 既存→新規の出現順）
          const existingIds = new Set(prev.map(s => s.id));
          const onlyNew = incoming.filter(s => !existingIds.has(s.id));
          
          const result = [...prev, ...onlyNew];
          console.log('[handleMenuItemsAdd] 重複除去後の新規追加:', onlyNew.map(s => s.id));
          console.log('[handleMenuItemsAdd] 最終的なmenuSakeData:', result.map(s => s.id));
          return result;
        });
        
        setMenuItems(prev => {
          // 同様のパターンで名前も冪等に追加
          const incoming = Array.from(new Set(foundSakes.map(s => s.name)));
          const existingNames = new Set(prev);
          const onlyNew = incoming.filter(name => !existingNames.has(name));
          return [...prev, ...onlyNew];
        });
      }

      if (notFound.length > 0) {
        setNotFoundItems(prev => {
          // 同じパターンで冪等に追加
          const incoming = Array.from(new Set(notFound));
          const existingItems = new Set(prev);
          const onlyNew = incoming.filter(item => !existingItems.has(item));
          return [...prev, ...onlyNew];
        });
        
        setMenuItems(prev => {
          // notFoundアイテムも名前として追加
          const incoming = Array.from(new Set(notFound));
          const existingNames = new Set(prev);
          const onlyNew = incoming.filter(name => !existingNames.has(name));
          return [...prev, ...onlyNew];
        });
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
        // メッセージはクリアしない（画面リロードまたは次回処理まで保持）
      }
    }
  }, [searchSakesBatch, menuSakeData]);

  // メニューアイテムを変更
  const handleMenuItemsChange = useCallback((items: string[]) => {
    setMenuItems(items);
    
    // menuSakeDataも更新（存在するものだけ残す）
    setMenuSakeData(prev => prev.filter(sake => items.includes(sake.name)));
    
    // notFoundItemsも更新（存在するものだけ残す）
    setNotFoundItems(prev => prev.filter(item => items.includes(item)));
  }, []);

  // 画像処理（ScanService を利用）
  const handleProcessImage = useCallback(async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingStatus(''); // 新しい処理開始時に前のメッセージをクリア
    
    try {
      const result = await ScanService.processImage(file, setProcessingStatus);
      
      if (result.success && result.sake_names && result.sake_names.length > 0) {
        setProcessingStatus(`${result.sake_names.length}件の日本酒を検出しました`);
        await handleMenuItemsAdd(result.sake_names, true);
      } else if (result.error) {
        setProcessingStatus(result.error);
      } else {
        setProcessingStatus('日本酒が検出されませんでした');
      }
    } catch (error) {
      console.error('画像処理エラー:', error);
      setProcessingStatus('画像の処理に失敗しました');
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
    console.log('[clearMenuData] クリア実行');
    console.log('[clearMenuData] クリア前のmenuSakeData:', menuSakeData.map(s => s.id));
    setMenuItems([]);
    setMenuSakeData([]);
    setNotFoundItems([]);
    setProcessingStatus('');
  }, [menuSakeData]);

  // 処理ステータスをクリア
  const clearProcessingStatus = useCallback(() => {
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
    clearProcessingStatus,
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
