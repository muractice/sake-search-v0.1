import {
  RestaurantMenu,
  RestaurantMenuFormData,
  RestaurantMenuSake,
  RestaurantMenuSakeFormData,
  RestaurantMenuWithSakes,
  RestaurantDrinkingRecordDetail,
  RestaurantCreationResponse,
} from '@/types/restaurant';

/**
 * Restaurant（飲食店メニュー）系データの取得/永続化を抽象化するRepositoryインターフェース
 */
export interface IRestaurantRepository {
  /**
   * 認証済みの現在のユーザーに紐づく飲食店メニュー一覧を取得
   */
  listForCurrentUser(): Promise<RestaurantMenu[]>;

  /**
   * 現在のユーザーで飲食店メニューを作成
   */
  createForCurrentUser(input: RestaurantMenuFormData): Promise<RestaurantCreationResponse>;

  /**
   * 飲食店メニューを削除
   */
  delete(menuId: string): Promise<void>;

  /**
   * 飲食店メニューに日本酒を1件追加（存在時は更新）
   */
  addSakeToMenu(menuId: string, input: RestaurantMenuSakeFormData): Promise<RestaurantMenuSake>;

  /**
   * メニューに紐づく日本酒ID一覧を取得
   */
  getMenuSakeIds(menuId: string): Promise<string[]>;

  /**
   * メニューの日本酒を差分更新（upsert + optional delete）
   */
  updateMenuSakes(
    menuId: string,
    sakes: { sake_id: string; brand_id?: number | null; is_available?: boolean; menu_notes?: string | null }[],
    options?: { upsert?: boolean; toDelete?: string[] }
  ): Promise<RestaurantMenuSake[]>;

  /**
   * メニューに日本酒を複数追加
   */
  addMultipleSakesToMenu(
    menuId: string,
    sakes: { sake_id: string; brand_id?: number | null; is_available?: boolean; menu_notes?: string | null }[]
  ): Promise<RestaurantMenuSake[]>;

  /**
   * メニュー内の日本酒情報を更新
   */
  updateMenuSake(menuSakeId: string, input: Partial<RestaurantMenuSakeFormData>): Promise<RestaurantMenuSake>;

  /**
   * メニューから日本酒を削除
   */
  removeSakeFromMenu(menuSakeId: string): Promise<void>;

  /**
   * 飲食店詳細（メニュー + 日本酒）一覧を取得
   */
  getRestaurantWithSakes(menuId: string): Promise<RestaurantMenuWithSakes[]>;

  /**
   * 最近の飲食店記録を取得
   */
  getRecentRecords(limit: number): Promise<RestaurantDrinkingRecordDetail[]>;

  /**
   * 飲食店記録を削除
   */
  deleteRecord(recordId: string): Promise<void>;
}
