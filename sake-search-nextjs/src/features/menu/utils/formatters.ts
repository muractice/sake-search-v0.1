/**
 * メニュー表示用のフォーマッター関数群
 */

/**
 * メニュー表示用の情報インターフェース
 */
export interface MenuDisplayInfo {
  name: string;
  location?: string | null;
  sakeCount: number;
  createdAt: string | Date;
}

/**
 * メニューオプションのラベルをフォーマット
 * @param info メニュー表示情報
 * @returns フォーマットされたラベル文字列
 * @example
 * formatMenuOptionLabel({
 *   name: "日本酒バー",
 *   location: "東京",
 *   sakeCount: 5,
 *   createdAt: "2025-01-08"
 * })
 * // => "日本酒バー (東京) - 5件 - 2025/1/8"
 */
export function formatMenuOptionLabel(info: MenuDisplayInfo): string {
  const parts: string[] = [info.name];
  
  // 場所がある場合は括弧で囲んで追加
  if (info.location) {
    parts.push(` (${info.location})`);
  }
  
  // 日本酒の件数を追加
  parts.push(` - ${info.sakeCount}件`);
  
  // 作成日を追加
  const date = info.createdAt instanceof Date 
    ? info.createdAt 
    : new Date(info.createdAt);
  parts.push(` - ${date.toLocaleDateString()}`);
  
  return parts.join('');
}

/**
 * 日付をメニュー表示用にフォーマット
 * @param date 日付文字列またはDateオブジェクト
 * @returns フォーマットされた日付文字列
 */
export function formatMenuDate(date: string | Date): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString();
}