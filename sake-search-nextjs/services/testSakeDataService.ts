import { SakeData } from '@/types/sake';

export class TestSakeDataService {
  private static instance: TestSakeDataService;
  
  static getInstance(): TestSakeDataService {
    if (!TestSakeDataService.instance) {
      TestSakeDataService.instance = new TestSakeDataService();
    }
    return TestSakeDataService.instance;
  }

  /**
   * テスト用の充実した日本酒データを返す
   */
  async getAllSakes(): Promise<SakeData[]> {
    // 少し遅延を入れて実際のAPI呼び出しをシミュレート
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: 'dassai-50',
        brandId: 1,
        name: '獺祭 純米大吟醸 50',
        brewery: '旭酒造',
        breweryId: 1,
        sweetness: 1,
        richness: -2,
        description: '山口県の銘酒。フルーティーで洗練された味わいの純米大吟醸',
        flavorChart: {
          brandId: 1,
          f1: 0.8, f2: 0.6, f3: 0.3, f4: 0.7, f5: 0.6, f6: 0.8
        }
      },
      {
        id: 'aramasa-no6',
        brandId: 2,
        name: '新政 No.6',
        brewery: '新政酒造',
        breweryId: 2,
        sweetness: 0,
        richness: -1,
        description: '秋田県の革新的な純米酒。独特の酸味と爽やかさが特徴',
        flavorChart: {
          brandId: 2,
          f1: 0.9, f2: 0.4, f3: 0.2, f4: 0.5, f5: 0.8, f6: 0.9
        }
      },
      {
        id: 'juyondai',
        brandId: 3,
        name: '十四代 本丸',
        brewery: '高木酒造',
        breweryId: 3,
        sweetness: 2,
        richness: 1,
        description: '山形県の幻の銘酒。濃厚な旨味と上品な甘みのバランスが絶妙',
        flavorChart: {
          brandId: 3,
          f1: 0.7, f2: 0.9, f3: 0.7, f4: 0.8, f5: 0.3, f6: 0.4
        }
      },
      {
        id: 'sharaku',
        brandId: 4,
        name: '写楽 純米吟醸',
        brewery: '宮泉銘醸',
        breweryId: 4,
        sweetness: -1,
        richness: 0,
        description: '福島県の人気銘柄。バランスの良い辛口で食事との相性抜群',
        flavorChart: {
          brandId: 4,
          f1: 0.5, f2: 0.5, f3: 0.5, f4: 0.6, f5: 0.7, f6: 0.6
        }
      },
      {
        id: 'hiroki',
        brandId: 5,
        name: '飛露喜 特別純米',
        brewery: '廣木酒造',
        breweryId: 5,
        sweetness: 0,
        richness: 1,
        description: '福島県の希少銘柄。深い味わいと長い余韻が印象的',
        flavorChart: {
          brandId: 5,
          f1: 0.6, f2: 0.7, f3: 0.6, f4: 0.7, f5: 0.5, f6: 0.5
        }
      },
      {
        id: 'jikon',
        brandId: 6,
        name: '而今 特別純米',
        brewery: '木屋正酒造',
        breweryId: 6,
        sweetness: 1,
        richness: 0,
        description: '三重県の人気銘柄。フレッシュで華やかな香りが魅力',
        flavorChart: {
          brandId: 6,
          f1: 0.8, f2: 0.6, f3: 0.4, f4: 0.6, f5: 0.6, f6: 0.7
        }
      },
      {
        id: 'kamoshibito',
        brandId: 7,
        name: '醸し人九平次 純米大吟醸',
        brewery: '萬乗醸造',
        breweryId: 7,
        sweetness: -1,
        richness: -1,
        description: '愛知県の国際的銘柄。ワインのような優雅で洗練された味わい',
        flavorChart: {
          brandId: 7,
          f1: 0.7, f2: 0.4, f3: 0.3, f4: 0.5, f5: 0.8, f6: 0.8
        }
      },
      {
        id: 'kokuryu',
        brandId: 8,
        name: '黒龍 石田屋',
        brewery: '黒龍酒造',
        breweryId: 8,
        sweetness: 0,
        richness: 2,
        description: '福井県の最高峰。深遠な味わいと複雑さを兼ね備えた逸品',
        flavorChart: {
          brandId: 8,
          f1: 0.5, f2: 0.8, f3: 0.8, f4: 0.7, f5: 0.4, f6: 0.3
        }
      },
      {
        id: 'denshu',
        brandId: 9,
        name: '田酒 特別純米',
        brewery: '西田酒造店',
        breweryId: 9,
        sweetness: 1,
        richness: 1,
        description: '青森県の銘酒。米の旨味を活かした王道の味わい',
        flavorChart: {
          brandId: 9,
          f1: 0.6, f2: 0.7, f3: 0.6, f4: 0.8, f5: 0.4, f6: 0.5
        }
      },
      {
        id: 'isojiman',
        brandId: 10,
        name: '磯自慢 純米吟醸',
        brewery: '磯自慢酒造',
        breweryId: 10,
        sweetness: -2,
        richness: -1,
        description: '静岡県の代表銘柄。キレのある辛口で魚料理との相性が抜群',
        flavorChart: {
          brandId: 10,
          f1: 0.4, f2: 0.3, f3: 0.3, f4: 0.4, f5: 0.9, f6: 0.8
        }
      },
      {
        id: 'kubota',
        brandId: 11,
        name: '久保田 萬寿',
        brewery: '朝日酒造',
        breweryId: 11,
        sweetness: -1,
        richness: 0,
        description: '新潟県の代表銘柄。端麗辛口の王道を行く味わい',
        flavorChart: {
          brandId: 11,
          f1: 0.5, f2: 0.4, f3: 0.4, f4: 0.6, f5: 0.8, f6: 0.7
        }
      },
      {
        id: 'hakkaisan',
        brandId: 12,
        name: '八海山 純米吟醸',
        brewery: '八海醸造',
        breweryId: 12,
        sweetness: -1,
        richness: -1,
        description: '新潟県の定番銘柄。軽快でクリーンな飲み口',
        flavorChart: {
          brandId: 12,
          f1: 0.4, f2: 0.3, f3: 0.3, f4: 0.5, f5: 0.8, f6: 0.9
        }
      },
      {
        id: 'dewazakura',
        brandId: 13,
        name: '出羽桜 桜花吟醸',
        brewery: '出羽桜酒造',
        breweryId: 13,
        sweetness: 0,
        richness: 0,
        description: '山形県の名門蔵。華やかで上品な吟醸香が特徴',
        flavorChart: {
          brandId: 13,
          f1: 0.8, f2: 0.5, f3: 0.4, f4: 0.6, f5: 0.6, f6: 0.7
        }
      },
      {
        id: 'takagi',
        brandId: 14,
        name: '高木 十四代 龍泉',
        brewery: '高木酒造',
        breweryId: 3,
        sweetness: 2,
        richness: 2,
        description: '十四代の最高峰。極上の甘みと深いコクが調和',
        flavorChart: {
          brandId: 14,
          f1: 0.9, f2: 0.9, f3: 0.8, f4: 0.8, f5: 0.2, f6: 0.3
        }
      },
      {
        id: 'yamada',
        brandId: 15,
        name: '山田錦 純米大吟醸',
        brewery: '神戸酒心館',
        breweryId: 15,
        sweetness: 1,
        richness: 0,
        description: '兵庫県の酒米の王様を使用。まろやかで上品な味わい',
        flavorChart: {
          brandId: 15,
          f1: 0.7, f2: 0.7, f3: 0.5, f4: 0.7, f5: 0.5, f6: 0.6
        }
      },
      {
        id: 'urakasumi',
        brandId: 16,
        name: '浦霞 禅',
        brewery: '佐浦',
        breweryId: 16,
        sweetness: 0,
        richness: 1,
        description: '宮城県の老舗蔵。穏やかで奥深い味わい',
        flavorChart: {
          brandId: 16,
          f1: 0.5, f2: 0.6, f3: 0.6, f4: 0.7, f5: 0.5, f6: 0.5
        }
      },
      {
        id: 'koshi',
        brandId: 17,
        name: '越乃寒梅 特撰',
        brewery: '石本酒造',
        breweryId: 17,
        sweetness: -1,
        richness: 0,
        description: '新潟県の代表銘柄。淡麗辛口の先駆け',
        flavorChart: {
          brandId: 17,
          f1: 0.4, f2: 0.4, f3: 0.4, f4: 0.6, f5: 0.7, f6: 0.8
        }
      },
      {
        id: 'dewatsuru',
        brandId: 18,
        name: '出羽鶴 純米',
        brewery: '出羽鶴酒造',
        breweryId: 18,
        sweetness: 0,
        richness: 1,
        description: '秋田県の地酒。米の旨味がしっかりと感じられる',
        flavorChart: {
          brandId: 18,
          f1: 0.5, f2: 0.6, f3: 0.6, f4: 0.7, f5: 0.4, f6: 0.5
        }
      },
      {
        id: 'daishichi',
        brandId: 19,
        name: '大七 生酛純米',
        brewery: '大七酒造',
        breweryId: 19,
        sweetness: 1,
        richness: 2,
        description: '福島県の伝統蔵。生酛造りによる深い味わい',
        flavorChart: {
          brandId: 19,
          f1: 0.6, f2: 0.8, f3: 0.8, f4: 0.7, f5: 0.3, f6: 0.4
        }
      },
      {
        id: 'kamotsuru',
        brandId: 20,
        name: '賀茂鶴 特選ゴールド',
        brewery: '賀茂鶴酒造',
        breweryId: 20,
        sweetness: 0,
        richness: 0,
        description: '広島県の名門蔵。バランスの取れた上品な味わい',
        flavorChart: {
          brandId: 20,
          f1: 0.6, f2: 0.5, f3: 0.5, f4: 0.6, f5: 0.6, f6: 0.6
        }
      }
    ];
  }

  async getAvailableSakes(userId: string): Promise<SakeData[]> {
    const allSakes = await this.getAllSakes();
    // テスト用にランダムに一部を除外（お気に入り済みとして）
    return allSakes.filter((_, index) => index % 3 !== 0);
  }

  async getTrendingSakes(limit: number = 10): Promise<SakeData[]> {
    const allSakes = await this.getAllSakes();
    // 人気の高い順（適当にソート）
    return allSakes
      .sort((a, b) => b.name.length - a.name.length)
      .slice(0, limit);
  }

  async getPopularByCategory() {
    const allSakes = await this.getAllSakes();
    
    return {
      sweet: allSakes.filter(s => s.sweetness > 0).slice(0, 5),
      dry: allSakes.filter(s => s.sweetness < 0).slice(0, 5),
      rich: allSakes.filter(s => s.richness > 0).slice(0, 5),
      light: allSakes.filter(s => s.richness < 0).slice(0, 5),
    };
  }
}