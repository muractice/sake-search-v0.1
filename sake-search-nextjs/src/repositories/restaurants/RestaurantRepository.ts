import { RestaurantMenu } from '@/types/restaurant';

/**
 * Restaurant（飲食店メニュー）系データの取得/永続化を抽象化するRepositoryインターフェース
 */
export interface IRestaurantRepository {
  /**
   * 認証済みの現在のユーザーに紐づく飲食店メニュー一覧を取得
   */
  listForCurrentUser(): Promise<RestaurantMenu[]>;
}

