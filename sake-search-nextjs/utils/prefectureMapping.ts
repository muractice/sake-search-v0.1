// 都道府県マッピング（areaIdから都道府県名）
// Sake NoWaのareaIdと都道府県の対応表

export interface Prefecture {
  id: number;
  name: string;
  region: string;
  code: string; // ISO 3166-2:JP code (JP-01など)
}

export const PREFECTURES: Prefecture[] = [
  { id: 1, name: '北海道', region: '北海道', code: 'JP-01' },
  { id: 2, name: '青森県', region: '東北', code: 'JP-02' },
  { id: 3, name: '岩手県', region: '東北', code: 'JP-03' },
  { id: 4, name: '宮城県', region: '東北', code: 'JP-04' },
  { id: 5, name: '秋田県', region: '東北', code: 'JP-05' },
  { id: 6, name: '山形県', region: '東北', code: 'JP-06' },
  { id: 7, name: '福島県', region: '東北', code: 'JP-07' },
  { id: 8, name: '茨城県', region: '関東', code: 'JP-08' },
  { id: 9, name: '栃木県', region: '関東', code: 'JP-09' },
  { id: 10, name: '群馬県', region: '関東', code: 'JP-10' },
  { id: 11, name: '埼玉県', region: '関東', code: 'JP-11' },
  { id: 12, name: '千葉県', region: '関東', code: 'JP-12' },
  { id: 13, name: '東京都', region: '関東', code: 'JP-13' },
  { id: 14, name: '神奈川県', region: '関東', code: 'JP-14' },
  { id: 15, name: '新潟県', region: '中部', code: 'JP-15' },
  { id: 16, name: '富山県', region: '中部', code: 'JP-16' },
  { id: 17, name: '石川県', region: '中部', code: 'JP-17' },
  { id: 18, name: '福井県', region: '中部', code: 'JP-18' },
  { id: 19, name: '山梨県', region: '中部', code: 'JP-19' },
  { id: 20, name: '長野県', region: '中部', code: 'JP-20' },
  { id: 21, name: '岐阜県', region: '中部', code: 'JP-21' },
  { id: 22, name: '静岡県', region: '中部', code: 'JP-22' },
  { id: 23, name: '愛知県', region: '中部', code: 'JP-23' },
  { id: 24, name: '三重県', region: '近畿', code: 'JP-24' },
  { id: 25, name: '滋賀県', region: '近畿', code: 'JP-25' },
  { id: 26, name: '京都府', region: '近畿', code: 'JP-26' },
  { id: 27, name: '大阪府', region: '近畿', code: 'JP-27' },
  { id: 28, name: '兵庫県', region: '近畿', code: 'JP-28' },
  { id: 29, name: '奈良県', region: '近畿', code: 'JP-29' },
  { id: 30, name: '和歌山県', region: '近畿', code: 'JP-30' },
  { id: 31, name: '鳥取県', region: '中国', code: 'JP-31' },
  { id: 32, name: '島根県', region: '中国', code: 'JP-32' },
  { id: 33, name: '岡山県', region: '中国', code: 'JP-33' },
  { id: 34, name: '広島県', region: '中国', code: 'JP-34' },
  { id: 35, name: '山口県', region: '中国', code: 'JP-35' },
  { id: 36, name: '徳島県', region: '四国', code: 'JP-36' },
  { id: 37, name: '香川県', region: '四国', code: 'JP-37' },
  { id: 38, name: '愛媛県', region: '四国', code: 'JP-38' },
  { id: 39, name: '高知県', region: '四国', code: 'JP-39' },
  { id: 40, name: '福岡県', region: '九州', code: 'JP-40' },
  { id: 41, name: '佐賀県', region: '九州', code: 'JP-41' },
  { id: 42, name: '長崎県', region: '九州', code: 'JP-42' },
  { id: 43, name: '熊本県', region: '九州', code: 'JP-43' },
  { id: 44, name: '大分県', region: '九州', code: 'JP-44' },
  { id: 45, name: '宮崎県', region: '九州', code: 'JP-45' },
  { id: 46, name: '鹿児島県', region: '九州', code: 'JP-46' },
  { id: 47, name: '沖縄県', region: '沖縄', code: 'JP-47' }
];

// areaIdから都道府県名を取得
export function getPrefectureName(areaId: number): string {
  const prefecture = PREFECTURES.find(p => p.id === areaId);
  return prefecture ? prefecture.name : '不明';
}

// areaIdから都道府県オブジェクトを取得
export function getPrefecture(areaId: number): Prefecture | null {
  return PREFECTURES.find(p => p.id === areaId) || null;
}

// 全都道府県のリストを取得
export function getAllPrefectures(): Prefecture[] {
  return PREFECTURES;
}

// 地方別にグループ化
export function getPrefecturesByRegion(): { [region: string]: Prefecture[] } {
  return PREFECTURES.reduce((acc, prefecture) => {
    if (!acc[prefecture.region]) {
      acc[prefecture.region] = [];
    }
    acc[prefecture.region].push(prefecture);
    return acc;
  }, {} as { [region: string]: Prefecture[] });
}

// @react-map/japan のマップコンポーネントで使用するための都道府県コード変換
export function getMapPrefectureCode(areaId: number): string {
  const prefecture = getPrefecture(areaId);
  if (!prefecture) return '';
  
  // @react-map/japanが期待する形式に変換（例：'hokkaido', 'aomori'など）
  // 実際のライブラリの仕様に合わせて調整が必要
  return prefecture.name.replace(/[都道府県]/g, '').toLowerCase();
}