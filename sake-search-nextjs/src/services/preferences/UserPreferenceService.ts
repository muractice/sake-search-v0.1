/**
 * ユーザー設定管理サービス
 * アプリ設定（user_preferences）と嗜好分析（user_taste_preferences）の両方を管理
 */

import type { IUserPreferencesRepository } from '@/repositories/preferences/UserPreferencesRepository';
import type { UserPreferences } from '@/types/userPreferences';

export class UserPreferenceService {
  private prefsRepo: IUserPreferencesRepository;

  constructor(prefsRepo: IUserPreferencesRepository) {
    this.prefsRepo = prefsRepo;
  }

  /**
   * ユーザー設定を取得
   * @param userId ユーザーID
   * @returns ユーザー設定
   */
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    if (!userId) return null;
    return this.prefsRepo.get(userId);
  }

  /**
   * お気に入り表示設定を更新
   * @param userId ユーザーID
   * @param show 表示するかどうか
   * @returns 更新後のユーザー設定
   */
  async updateShowFavorites(userId: string, show: boolean): Promise<UserPreferences | null> {
    if (!userId) return null;
    return this.prefsRepo.updateShowFavorites(userId, show);
  }

  /**
   * 比較モード設定を更新
   * @param userId ユーザーID
   * @param mode 比較モードを有効にするかどうか
   * @returns 更新後のユーザー設定
   */
  async updateComparisonMode(userId: string, _mode: boolean): Promise<UserPreferences | null> {
    if (!userId) return null;
    // TODO: repositoryにメソッドを追加
    console.warn('updateComparisonMode not implemented yet');
    return this.getPreferences(userId);
  }

  /**
   * ユーザー設定を初期化
   * @param userId ユーザーID
   * @returns 初期化されたユーザー設定
   */
  async initializePreferences(userId: string): Promise<UserPreferences | null> {
    if (!userId) return null;

    try {
      // 既存設定があるかチェック
      const existing = await this.getPreferences(userId);
      if (existing) {
        return existing;
      }

      // 初期設定を作成
      // const defaultPreferences: Partial<UserPreferences> = {
      //   userId,
      //   showFavorites: true,
      //   // comparisonMode: true, // TODO: repositoryにメソッドを追加
      //   updatedAt: new Date(),
      // };

      // TODO: createメソッドをrepositoryに追加
      console.warn('initializePreferences not fully implemented yet');
      return null;
    } catch (error) {
      console.error('Failed to initialize user preferences:', error);
      return null;
    }
  }
}
