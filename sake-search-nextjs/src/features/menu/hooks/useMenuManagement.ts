import { useState, useCallback, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { RestaurantMenu, isConflictResponse, isRestaurantMenu } from '@/types/restaurant';
import { SakeData } from '@/types/sake';
import {
  loadRestaurantMenusAction,
  createRestaurantAction,
  getMenuSakesAction,
  addMultipleSakesToMenuAction,
  updateMenuSakesAction,
  getRestaurantWithSakesAction,
} from '@/app/actions/restaurant';

type InitialGrouped = Record<string, {
  restaurant_menu_id: string;
  restaurant_name: string;
  location?: string;
  registration_date: string;
  restaurant_created_at: string;
  count: number;
}>;

export const useMenuManagement = (opts?: { initialRestaurantMenus?: import('@/types/restaurant').RestaurantMenu[] }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<RestaurantMenu[]>(opts?.initialRestaurantMenus ?? []);
  // 初期表示判定用フラグ
  const [hasUserSelected, setHasUserSelected] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hasUserSelected') === 'true';
    }
    return false;
  });
  
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(() => {
    // ユーザーが選択したことがある場合のみsessionStorageから復元
    if (typeof window !== 'undefined' && sessionStorage.getItem('hasUserSelected') === 'true') {
      return sessionStorage.getItem('selectedRestaurant') || '';
    }
    return '';
  });
  
  const [selectedSavedMenu, setSelectedSavedMenu] = useState<string>(() => {
    // ユーザーが選択したことがある場合のみsessionStorageから復元
    if (typeof window !== 'undefined' && sessionStorage.getItem('hasUserSelected') === 'true') {
      return sessionStorage.getItem('selectedSavedMenu') || '';
    }
    return '';
  });
  const [savingToMenu, setSavingToMenu] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [lastSavedSakes, setLastSavedSakes] = useState<string[]>([]);  // 最後に保存した日本酒リスト
  
  console.log('=== useMenuManagement レンダリング ===');
  console.log('lastSavedSakes:', lastSavedSakes);
  console.log('selectedSavedMenu:', selectedSavedMenu);
  console.log('lastSavedSakes.length:', lastSavedSakes.length);
  const [groupedSavedMenusData, setGroupedSavedMenusData] = useState<InitialGrouped>(() => {
    if (!opts?.initialRestaurantMenus) return {} as InitialGrouped;
    const grouped: InitialGrouped = {} as InitialGrouped;
    for (const r of opts.initialRestaurantMenus) {
      grouped[r.id] = {
        restaurant_menu_id: r.id,
        restaurant_name: r.restaurant_name,
        location: r.location,
        registration_date: r.registration_date,
        restaurant_created_at: r.created_at,
        count: r.sake_count || 0,
      };
    }
    return grouped;
  });

  // I/OはServer Actions経由

  // カスタムセッター関数（ユーザーの選択を記録）
  const updateSelectedSavedMenu = useCallback((menuId: string) => {
    setSelectedSavedMenu(menuId);
    setHasUserSelected(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hasUserSelected', 'true');
    }
  }, []);

  // 認証状態を取得
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    getUser();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // メニュー一覧を取得
  const fetchRestaurants = useCallback(async () => {
    try {
      const data = await loadRestaurantMenusAction();
      setRestaurants(data || []);
      
      // ユーザーが明示的に選択した場合のみ、選択状態を検証
      if (hasUserSelected && data && data.length > 0) {
        const savedRestaurantExists = selectedRestaurant && data.some(r => r.id === selectedRestaurant);
        if (!savedRestaurantExists) {
          // 選択していたメニューが削除された場合は「新しいメニュー」に戻す
          setSelectedRestaurant('');
          setSelectedSavedMenu('');
        }
      }
      // 初期表示または未選択の場合は「新しいメニュー」のまま
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  }, [selectedRestaurant, hasUserSelected]);

  // 保存済みメニュー一覧を取得
  const fetchSavedMenus = useCallback(async () => {
    try {
      const data = await loadRestaurantMenusAction();
      if (!data) return;

      const groupedData = data.reduce((acc, restaurant) => {
        acc[restaurant.id] = {
          restaurant_menu_id: restaurant.id,
          restaurant_name: restaurant.restaurant_name,
          location: restaurant.location,
          registration_date: restaurant.registration_date,
          restaurant_created_at: restaurant.created_at,
          count: restaurant.sake_count || 0
        };
        return acc;
      }, {} as typeof groupedSavedMenusData);

      setGroupedSavedMenusData(groupedData);
    } catch (error) {
      console.error('Error fetching saved menus:', error);
    }
  }, []);

  // 選択状態をSessionStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedRestaurant', selectedRestaurant);
    }
  }, [selectedRestaurant]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedSavedMenu', selectedSavedMenu);
    }
  }, [selectedSavedMenu]);

  // ユーザーがログインしている場合のみ飲食店データを取得
  useEffect(() => {
    if (user) {
      // 初期値がないときのみ取得
      if ((opts?.initialRestaurantMenus?.length ?? 0) === 0) {
        fetchRestaurants();
        fetchSavedMenus();
      }
    }
  }, [user, fetchRestaurants, fetchSavedMenus, opts?.initialRestaurantMenus?.length]);
  
  // selectedSavedMenuが存在し、lastSavedSakesが空の場合、DBから現在の状態を取得
  useEffect(() => {
    const loadSavedState = async () => {
      if (selectedSavedMenu && lastSavedSakes.length === 0 && !loadingMenu) {
        console.log('[useMenuManagement] lastSavedSakesが空なので、DBから取得:', selectedSavedMenu);
        try {
          const currentSakeIds = await getMenuSakesAction(selectedSavedMenu);
          console.log('[useMenuManagement] DBから取得したsakeIds:', currentSakeIds);
          setLastSavedSakes(currentSakeIds);
        } catch (error) {
          console.error('Error loading saved sakes:', error);
        }
      }
    };
    
    loadSavedState();
  }, [selectedSavedMenu, lastSavedSakes.length, loadingMenu]);
  

  // 新しいメニューを追加
  const handleAddRestaurant = useCallback(async (
    newRestaurantName: string,
    newRestaurantLocation: string,
    registrationDate: string,
    menuSakeData: SakeData[]
  ) => {
    try {
      const restaurantData = {
        restaurant_name: newRestaurantName.trim(),
        registration_date: registrationDate,
        location: newRestaurantLocation.trim() || undefined
      };
      
      const data = await createRestaurantAction(restaurantData);
      
      // conflict（重複）の場合の処理
      if (isConflictResponse(data)) {
        await fetchRestaurants();
        await fetchSavedMenus();
        
        // 同じ飲食店名と登録日で既存のレストランを探す
        const existingRestaurant = restaurants.find(r => 
          r.restaurant_name.toLowerCase() === newRestaurantName.trim().toLowerCase() &&
          r.registration_date === registrationDate
        );
        
        if (existingRestaurant) {
          setSelectedRestaurant(existingRestaurant.id);
          updateSelectedSavedMenu(existingRestaurant.id);  // カスタムセッターを使用
        }
        
        alert(data.message);
        return null;
      }
      
      // 正常作成の場合
      if (isRestaurantMenu(data)) {
        await fetchRestaurants();
        await fetchSavedMenus();
        setSelectedRestaurant(data.id);
        updateSelectedSavedMenu(data.id);  // カスタムセッターを使用
        
        // メニューデータがある場合は自動で保存
        if (menuSakeData.length > 0) {
          try {
            const sakes = menuSakeData.map(sake => ({
              sake_id: sake.id,
              brand_id: sake.brandId || null,
              is_available: true,
              menu_notes: null
            }));

            await addMultipleSakesToMenuAction(data.id, sakes);
            await fetchSavedMenus();
            // 保存成功後、最後に保存した状態を記録
            setLastSavedSakes(menuSakeData.map(s => s.id));
            alert(`メニュー「${newRestaurantName}」を作成し、${menuSakeData.length}件の日本酒を保存しました。`);
          } catch (saveError) {
            console.error('Error saving menu to new restaurant:', saveError);
            alert(`メニュー「${newRestaurantName}」は作成されましたが、日本酒の保存に失敗しました。\n再度保存ボタンをクリックしてください。`);
          }
        } else {
          alert(`メニュー「${newRestaurantName}」を作成しました。\n日本酒を追加してから保存ボタンをクリックしてください。`);
        }
        
        return data;
      }
    } catch (error) {
      console.error('[MenuManagement] handleAddRestaurant - エラー:', error);
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        alert(error.message);
      } else {
        alert('メニューの追加に失敗しました。しばらく経ってから再度お試しください。');
      }
      return null;
    }
  }, [restaurants, fetchRestaurants, fetchSavedMenus, updateSelectedSavedMenu]);

  // 日本酒をメニューに保存/更新
  const handleSaveToRestaurant = useCallback(async (menuSakeData: SakeData[]) => {
    if (!selectedRestaurant) {
      alert('メニューを選択してください');
      return;
    }

    setSavingToMenu(true);
    try {
      const sakes = menuSakeData.map(sake => ({
        sake_id: sake.id,
        brand_id: sake.brandId || null,
        is_available: true,
        menu_notes: null
      }));

      // updateMenuSakes（UPSERT）を使用して重複エラーを回避
      await updateMenuSakesAction(selectedRestaurant, sakes);
      
      // 保存成功後、最後に保存した状態を記録
      setLastSavedSakes(menuSakeData.map(s => s.id));
      
      alert(`メニューを更新しました（${sakes.length}件の日本酒）`);
      await fetchSavedMenus();
    } catch (error) {
      console.error('Error updating restaurant menu:', error);
      alert(error instanceof Error ? error.message : 'メニューの更新に失敗しました');
    } finally {
      setSavingToMenu(false);
    }
  }, [selectedRestaurant, fetchSavedMenus]);

  // 保存済みメニューをロード
  const handleLoadSavedMenu = useCallback(async (restaurantMenuId: string, onMenuDataUpdate: (items: string[]) => Promise<void>) => {
    if (!restaurantMenuId) return;

    setLoadingMenu(true);
    try {
      // 完全なデータを取得
      const menuWithSakes = await getRestaurantWithSakesAction(restaurantMenuId);
      
      // 日本酒名のリストを作成
      const sakeNames: string[] = [];
      for (const item of menuWithSakes) {
        if (item.sake_name) {
          sakeNames.push(item.sake_name);
        } else if (item.sake_id) {
          sakeNames.push(item.sake_id);
        }
      }
      
      // MenuContextのhandleMenuItemsAddを呼び出して、名前から詳細データを検索・設定
      await onMenuDataUpdate(sakeNames);
      updateSelectedSavedMenu(restaurantMenuId);  // カスタムセッターを使用
      
      // 現在のDB状態を記録
      const currentSakeIds = await getMenuSakesAction(restaurantMenuId);
      setLastSavedSakes(currentSakeIds);
    } catch (error) {
      console.error('Error loading saved menu:', error);
      alert('保存済みメニューの読み込みに失敗しました');
    } finally {
      setLoadingMenu(false);
    }
  }, [updateSelectedSavedMenu]);

  // 変更があるかチェック
  const hasChanges = useCallback((currentSakes: SakeData[]): boolean => {
    console.log('=== hasChanges デバッグ ===');
    console.log('selectedSavedMenu:', selectedSavedMenu);
    console.log('currentSakes:', currentSakes.map(s => s.id));
    console.log('lastSavedSakes (変更前):', lastSavedSakes);
    
    if (!selectedSavedMenu) {
      console.log('selectedSavedMenu が空のため false を返す');
      return false;
    }
    
    const currentIds = currentSakes.map(s => s.id).sort();
    const savedIds = [...lastSavedSakes].sort();  // 配列をコピーしてからソート
    
    console.log('currentIds (sorted):', currentIds);
    console.log('savedIds (sorted):', savedIds);
    console.log('lastSavedSakes (変更後):', lastSavedSakes);
    
    // 配列の長さが違えば変更あり
    if (currentIds.length !== savedIds.length) {
      console.log('配列の長さが違う:', currentIds.length, '!=', savedIds.length);
      return true;
    }
    
    // 各要素を比較
    const hasChange = !currentIds.every((id, index) => id === savedIds[index]);
    console.log('要素比較結果:', hasChange);
    console.log('=== hasChanges デバッグ終了 ===');
    
    return hasChange;
  }, [selectedSavedMenu, lastSavedSakes]);

  return {
    user,
    isAuthLoading,
    restaurants,
    selectedRestaurant,
    setSelectedRestaurant,
    selectedSavedMenu,
    setSelectedSavedMenu: updateSelectedSavedMenu,  // カスタムセッターを使用
    savingToMenu,
    loadingMenu,
    groupedSavedMenusData,
    fetchRestaurants,
    fetchSavedMenus,
    handleAddRestaurant,
    handleSaveToRestaurant,
    handleLoadSavedMenu,
    hasChanges
  };
};
