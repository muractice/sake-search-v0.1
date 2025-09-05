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
        message.push(`${foundSakes.length}件の日本酒データを追加`);
      }
      if (notFound.length > 0) {
        message.push(`${notFound.length}件はデータなし`);
      }
      
      if (message.length > 0 && fromImageProcessing) {
        setProcessingStatus(message.join('、'));
        // 成功メッセージは2秒後に消去
        setTimeout(() => {
          setProcessingStatus('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing menu items:', error);
      if (fromImageProcessing) {
        setProcessingStatus('エラーが発生しました');
      }
    } finally {
      if (fromImageProcessing) {
        setIsProcessing(false);
      }
    }
  }, [menuSakeData, menuItems, notFoundItems, searchSake]);

  // OCR処理
  const handleProcessImage = useCallback(async (imageData: string) => {
    console.log('=== useMenuInput: OCR処理開始 ===');
    console.log('useMenuInput: 画像データサイズ:', imageData.length);
    console.log('useMenuInput: 画像データ先頭100文字:', imageData.substring(0, 100));
    
    // 新しい処理開始時に前のメッセージをクリア
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

      console.log('useMenuInput: Gemini Vision APIレスポンスステータス:', response.status);
      console.log('useMenuInput: Gemini Vision APIレスポンスOK:', response.ok);

      if (!response.ok) {
        console.error('useMenuInput: Gemini Vision APIエラー:', response.status, response.statusText);
        
        // エラーレスポンスの詳細を取得
        try {
          const errorResponse = await response.json();
          console.error('useMenuInput: エラーレスポンス詳細:', errorResponse);
        } catch (e) {
          console.error('useMenuInput: エラーレスポンスの解析に失敗:', e);
        }
        
        throw new Error(`Gemini Vision API エラー (${response.status}): ${response.statusText}`);
      }

      const result = await response.json();
      console.log('useMenuInput: Gemini Vision APIレスポンス全体:', result);
      console.log('useMenuInput: result.sake_names:', result.sake_names);
      console.log('useMenuInput: result.confidence:', result.confidence);
      
      const { sake_names, notes, error } = result;
      
      console.log('抽出された日本酒名:', sake_names);
      console.log('信頼度:', result.confidence);
      console.log('備考:', notes);
      console.log('エラー:', error);
      
      // エラーがある場合の処理
      if (error) {
        let errorMessage = '画像の処理に失敗しました';
        
        if (error.includes('too large') || error.includes('2MB')) {
          errorMessage = '画像サイズが大きすぎます（2MB以下にしてください）';
        } else if (error.includes('timeout')) {
          errorMessage = 'タイムアウトしました（画像が複雑すぎる可能性があります）';
        } else if (error.includes('API key')) {
          errorMessage = 'APIキーの設定に問題があります';
        } else if (error.includes('rate limit')) {
          errorMessage = 'API利用制限に達しました。しばらく待ってから再試行してください';
        } else {
          errorMessage = `エラー: ${error}`;
        }
        
        setProcessingStatus(errorMessage);
        return;
      }
      
      if (sake_names && sake_names.length > 0) {
        // Gemini APIから直接日本酒名が返ってくる
        const sakeNames = sake_names;
        
        setProcessingStatus(`${sakeNames.length}件の日本酒を検出しました`);
        await handleMenuItemsAdd(sakeNames, true);
      } else {
        // 日本酒が検出されなかった場合
        let message = '日本酒が検出されませんでした';
        
        if (notes) {
          if (notes.includes('不鮮明') || notes.includes('解像度')) {
            message = '画像が不鮮明で読み取れませんでした';
          } else if (notes.includes('フィルタリング') || notes.includes('safety')) {
            message = '画像の内容が制限により処理できませんでした';
          }
        }
        
        console.warn('日本酒が検出されませんでした。');
        console.warn('備考:', notes);
        console.warn('APIレスポンス:', result);
        setProcessingStatus(message);
      }
    } catch (error) {
      console.error('=== OCR処理エラー ===');
      console.error('エラー詳細:', error);
      // 詳細なエラー情報を表示
      let detailedError = '画像の処理に失敗しました';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          detailedError = 'ネットワークエラーが発生しました';
        } else if (error.message.includes('timeout')) {
          detailedError = 'タイムアウトしました（画像が複雑すぎる可能性があります）';
        } else {
          detailedError = `エラー: ${error.message}`;
        }
      }
      setProcessingStatus(detailedError);
    } finally {
      console.log('=== OCR処理終了 ===');
      // 処理中状態のみ解除（エラーメッセージは次の処理まで保持）
      setIsProcessing(false);
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