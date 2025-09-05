/**
 * お気に入り・ユーザー設定関連のビジネスロジックを担当するService
 * Web/Mobile共通利用可能
 */

import { SakeData } from '@/types/sake';
import { ApiClient, ApiClientError } from './core/ApiClient';

export interface Favorite {
  id: string;
  userId: string;
  sakeId: string;
  sakeData: SakeData;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  showFavorites: boolean;
  updatedAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  createdAt?: string;
}

export interface AuthSession {
  user: AuthUser | null;
  accessToken?: string;
  refreshToken?: string;
}

export class FavoriteServiceError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'FavoriteServiceError';
  }
}

export class FavoriteService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * お気に入り一覧を取得
   */
  async getFavorites(): Promise<Favorite[]> {
    try {
      const response = await this.apiClient.get<Favorite[]>('/api/v1/favorites');
      return response.data;
    } catch (error) {
      this.handleError('お気に入りの取得に失敗しました', error);
    }
  }

  /**
   * お気に入りに追加
   */
  async addFavorite(sake: SakeData): Promise<Favorite> {
    try {
      if (!sake || !sake.id) {
        throw new FavoriteServiceError('日本酒データが無効です');
      }

      const response = await this.apiClient.post<Favorite>('/api/v1/favorites', {
        sakeId: sake.id,
        sakeData: sake,
      });

      // レコメンドキャッシュをクリア
      await this.clearRecommendationCache();

      return response.data;
    } catch (error) {
      this.handleError('お気に入りの追加に失敗しました', error);
    }
  }

  /**
   * お気に入りから削除
   */
  async removeFavorite(sakeId: string): Promise<void> {
    try {
      if (!sakeId) {
        throw new FavoriteServiceError('日本酒IDが指定されていません');
      }

      await this.apiClient.delete(`/api/v1/favorites/${sakeId}`);

      // レコメンドキャッシュをクリア
      await this.clearRecommendationCache();
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 404) {
        // 既に削除済みの場合は成功として扱う
        return;
      }
      this.handleError('お気に入りの削除に失敗しました', error);
    }
  }

  /**
   * お気に入りかどうかチェック
   */
  async isFavorite(sakeId: string): Promise<boolean> {
    try {
      if (!sakeId) {
        return false;
      }

      const response = await this.apiClient.get<{ isFavorite: boolean }>(`/api/v1/favorites/check/${sakeId}`);
      return response.data.isFavorite;
    } catch (error) {
      // エラーの場合はfalseを返す
      console.warn('お気に入りチェック中にエラー:', error);
      return false;
    }
  }

  /**
   * お気に入り一覧を同期（ローカルとサーバーの差分を解決）
   */
  async syncFavorites(localFavorites: string[]): Promise<Favorite[]> {
    try {
      const response = await this.apiClient.post<Favorite[]>('/api/v1/favorites/sync', {
        localSakeIds: localFavorites,
      });

      return response.data;
    } catch (error) {
      this.handleError('お気に入りの同期に失敗しました', error);
    }
  }

  /**
   * ユーザー設定を取得
   */
  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const response = await this.apiClient.get<UserPreferences>('/api/v1/preferences');
      return response.data;
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 404) {
        // 設定が存在しない場合はnullを返す
        return null;
      }
      this.handleError('ユーザー設定の取得に失敗しました', error);
    }
  }

  /**
   * ユーザー設定を更新
   */
  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const response = await this.apiClient.put<UserPreferences>('/api/v1/preferences', preferences);
      return response.data;
    } catch (error) {
      this.handleError('ユーザー設定の更新に失敗しました', error);
    }
  }

  /**
   * お気に入り表示設定を切り替え
   */
  async toggleShowFavorites(currentValue: boolean): Promise<boolean> {
    try {
      const newValue = !currentValue;
      await this.updateUserPreferences({ showFavorites: newValue });
      return newValue;
    } catch (error) {
      this.handleError('お気に入り表示設定の切り替えに失敗しました', error);
    }
  }

  /**
   * レコメンドキャッシュをクリア
   */
  async clearRecommendationCache(): Promise<void> {
    try {
      await this.apiClient.delete('/api/v1/recommendations/cache');
    } catch (error) {
      // キャッシュクリアの失敗はログのみ（致命的エラーではない）
      console.warn('レコメンドキャッシュのクリアに失敗:', error);
    }
  }

  /**
   * 認証: メールでログイン
   */
  async signInWithEmail(credentials: AuthCredentials): Promise<AuthSession> {
    try {
      this.validateAuthCredentials(credentials);

      const response = await this.apiClient.post<AuthSession>('/api/v1/auth/signin', credentials);
      return response.data;
    } catch (error) {
      this.handleError('ログインに失敗しました', error);
    }
  }

  /**
   * 認証: メールでサインアップ
   */
  async signUpWithEmail(credentials: AuthCredentials): Promise<AuthSession> {
    try {
      this.validateAuthCredentials(credentials);

      const response = await this.apiClient.post<AuthSession>('/api/v1/auth/signup', credentials);
      return response.data;
    } catch (error) {
      this.handleError('アカウント作成に失敗しました', error);
    }
  }

  /**
   * 認証: ログアウト
   */
  async signOut(): Promise<void> {
    try {
      await this.apiClient.post('/api/v1/auth/signout');
    } catch (error) {
      this.handleError('ログアウトに失敗しました', error);
    }
  }

  /**
   * 認証: セッション取得
   */
  async getSession(): Promise<AuthSession> {
    try {
      const response = await this.apiClient.get<AuthSession>('/api/v1/auth/session');
      return response.data;
    } catch {
      // セッション取得失敗は未ログインとして扱う
      return { user: null };
    }
  }

  /**
   * 認証: セッションリフレッシュ
   */
  async refreshSession(): Promise<AuthSession> {
    try {
      const response = await this.apiClient.post<AuthSession>('/api/v1/auth/refresh');
      return response.data;
    } catch {
      // リフレッシュ失敗は未ログインとして扱う
      return { user: null };
    }
  }

  /**
   * お気に入り統計を取得
   */
  async getFavoriteStatistics(): Promise<{
    totalFavorites: number;
    mostFavoritedBrewery?: string;
    mostFavoritedPrefecture?: string;
    averageSweetness?: number;
    averageRichness?: number;
    flavorDistribution: {
      type: string;
      count: number;
    }[];
  }> {
    try {
      const response = await this.apiClient.get<{
        totalFavorites: number;
        mostFavoritedBrewery?: string;
        mostFavoritedPrefecture?: string;
        averageSweetness?: number;
        averageRichness?: number;
        flavorDistribution: {
          type: string;
          count: number;
        }[];
      }>('/api/v1/favorites/statistics');
      return response.data;
    } catch (error) {
      this.handleError('お気に入り統計の取得に失敗しました', error);
    }
  }

  /**
   * おすすめのお気に入り候補を取得（類似性ベース）
   */
  async getFavoriteRecommendations(limit: number = 10): Promise<SakeData[]> {
    try {
      const response = await this.apiClient.get<SakeData[]>('/api/v1/favorites/recommendations', {
        limit: limit.toString(),
      });
      return response.data;
    } catch (error) {
      this.handleError('おすすめ候補の取得に失敗しました', error);
    }
  }

  /**
   * プライベートメソッド: 認証情報のバリデーション
   */
  private validateAuthCredentials(credentials: AuthCredentials): void {
    if (!credentials.email || !this.isValidEmail(credentials.email)) {
      throw new FavoriteServiceError('有効なメールアドレスを入力してください');
    }

    if (!credentials.password || credentials.password.length < 6) {
      throw new FavoriteServiceError('パスワードは6文字以上で入力してください');
    }
  }

  /**
   * プライベートメソッド: メールアドレス形式チェック
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * プライベートメソッド: エラーハンドリング
   */
  private handleError(message: string, error: unknown): never {
    if (error instanceof FavoriteServiceError) {
      throw error;
    }

    if (error instanceof ApiClientError) {
      switch (error.statusCode) {
        case 400:
          throw new FavoriteServiceError('入力データが無効です');
        case 401:
          throw new FavoriteServiceError('ログインが必要です');
        case 403:
          throw new FavoriteServiceError('この操作の権限がありません');
        case 404:
          throw new FavoriteServiceError('データが見つかりません');
        case 409:
          throw new FavoriteServiceError('既に登録されています');
        case 429:
          throw new FavoriteServiceError('リクエストが多すぎます。しばらく待ってから再試行してください');
        case 500:
          throw new FavoriteServiceError('サーバーエラーが発生しました。時間をおいて再試行してください');
        default:
          throw new FavoriteServiceError(`${message} (${error.statusCode})`);
      }
    }

    // その他のエラー
    throw new FavoriteServiceError(message, error);
  }
}