#!/usr/bin/env node

/**
 * バッチ同期のDRY RUNテストスクリプト
 * 
 * 実際のデータ更新は行わず、以下を確認:
 * 1. さけのわAPIからのデータ取得
 * 2. 差分検出の動作
 * 3. ハッシュ計算の正確性
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ 環境変数 SUPABASE_URL と SUPABASE_SERVICE_KEY が必要です');
  console.error('設定方法:');
  console.error('export SUPABASE_URL="your-project-url"');
  console.error('export SUPABASE_SERVICE_KEY="your-service-key"');
  process.exit(1);
}

class SyncTestRunner {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  async run() {
    console.log('🧪 バッチ同期のDRY RUNテストを開始します...\n');
    
    try {
      // 1. データベース接続テスト
      await this.testDatabaseConnection();
      
      // 2. さけのわAPIテスト
      const apiData = await this.testSakenowaAPI();
      
      // 3. ハッシュ計算テスト
      await this.testHashCalculation(apiData);
      
      // 4. 差分検出テスト
      await this.testDifferenceDetection(apiData);
      
      console.log('\n✅ 全てのテストが正常に完了しました！');
      console.log('🚀 本番実行の準備ができています。');
      
    } catch (error) {
      console.error('\n❌ テストに失敗しました:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  async testDatabaseConnection() {
    console.log('1️⃣ データベース接続テスト...');
    
    try {
      // 基本的な接続テスト
      const { data, error } = await this.supabase
        .from('sake_master')
        .select('count(*)')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log('⚠️ sake_masterテーブルが存在しません（初回実行時は正常）');
      } else if (error) {
        throw error;
      } else {
        console.log(`✅ データベース接続成功`);
        if (data && data.length > 0) {
          console.log(`   現在のレコード数: ${data[0].count || 0}件`);
        }
      }
      
      // 世代管理テーブルの確認
      const { data: genData, error: genError } = await this.supabase
        .from('sync_generations')
        .select('count(*)')
        .limit(1);
      
      if (genError && genError.code === 'PGRST116') {
        console.log('⚠️ sync_generationsテーブルが存在しません');
        console.log('   先にデータベースセットアップを実行してください:');
        console.log('   node scripts/setup-database.js');
      } else if (genError) {
        throw genError;
      } else {
        console.log('✅ 世代管理テーブル確認完了');
      }
      
    } catch (error) {
      console.error('❌ データベース接続に失敗:', error.message);
      throw error;
    }
  }

  async testSakenowaAPI() {
    console.log('\n2️⃣ さけのわAPIテスト...');
    
    try {
      console.log('   📥 APIからデータを取得中...');
      
      const [brandsRes, breweriesRes, flavorChartsRes] = await Promise.all([
        fetch('https://muro.sakenowa.com/sakenowa-data/api/brands'),
        fetch('https://muro.sakenowa.com/sakenowa-data/api/breweries'),
        fetch('https://muro.sakenowa.com/sakenowa-data/api/flavor-charts')
      ]);
      
      if (!brandsRes.ok) throw new Error(`Brands API error: ${brandsRes.status}`);
      if (!breweriesRes.ok) throw new Error(`Breweries API error: ${breweriesRes.status}`);
      if (!flavorChartsRes.ok) throw new Error(`FlavorCharts API error: ${flavorChartsRes.status}`);
      
      const [brandsData, breweriesData, flavorChartsData] = await Promise.all([
        brandsRes.json(),
        breweriesRes.json(),
        flavorChartsRes.json()
      ]);
      
      const brands = brandsData.brands || [];
      const breweries = breweriesData.breweries || [];
      const flavorCharts = flavorChartsData.flavorCharts || [];
      
      console.log(`✅ API取得成功:`);
      console.log(`   銘柄数: ${brands.length}件`);
      console.log(`   蔵元数: ${breweries.length}件`);
      console.log(`   フレーバーチャート数: ${flavorCharts.length}件`);
      
      // データの結合テスト
      const combinedData = this.combineApiData(brands, breweries, flavorCharts);
      console.log(`   結合後データ数: ${combinedData.length}件`);
      
      // サンプルデータの表示
      if (combinedData.length > 0) {
        const sample = combinedData[0];
        console.log(`   サンプル: ${sample.brand_name} (${sample.brewery_name})`);
        console.log(`   座標: sweetness=${sample.sweetness}, richness=${sample.richness}`);
      }
      
      return combinedData;
      
    } catch (error) {
      console.error('❌ さけのわAPI取得に失敗:', error.message);
      throw error;
    }
  }

  combineApiData(brands, breweries, flavorCharts) {
    const breweriesMap = new Map(breweries.map(b => [b.id, b]));
    const flavorChartsMap = new Map(flavorCharts.map(f => [f.brandId, f]));
    
    const combinedData = [];
    
    for (const brand of brands.slice(0, 10)) { // テスト用に最初の10件のみ
      const brewery = breweriesMap.get(brand.breweryId);
      const flavorChart = flavorChartsMap.get(brand.id);
      
      if (brewery && flavorChart) {
        const coordinates = this.convertFlavorToCoordinates(flavorChart);
        
        combinedData.push({
          id: `sake_${brand.id}`,
          brand_id: brand.id,
          brand_name: brand.name,
          brewery_id: brand.breweryId,
          brewery_name: brewery.name,
          sweetness: coordinates.sweetness,
          richness: coordinates.richness,
          f1_floral: flavorChart.f1,
          f2_mellow: flavorChart.f2,
          f3_heavy: flavorChart.f3,
          f4_mild: flavorChart.f4,
          f5_dry: flavorChart.f5,
          f6_light: flavorChart.f6
        });
      }
    }
    
    return combinedData;
  }

  convertFlavorToCoordinates(flavorChart) {
    const sweetnessRaw = flavorChart.f2 * 2 - flavorChart.f5 * 2;
    const sweetness = Math.max(-3, Math.min(3, sweetnessRaw * 3));
    
    const richnessRaw = flavorChart.f3 * 2 - flavorChart.f6 * 2;
    const richness = Math.max(-3, Math.min(3, richnessRaw * 3));
    
    return { sweetness, richness };
  }

  async testHashCalculation(apiData) {
    console.log('\n3️⃣ ハッシュ計算テスト...');
    
    if (apiData.length === 0) {
      console.log('⚠️ テスト用データがありません');
      return;
    }
    
    try {
      const sample = apiData[0];
      const hash1 = this.calculateHash(sample);
      
      console.log(`✅ ハッシュ計算成功:`);
      console.log(`   データ: ${sample.brand_name}`);
      console.log(`   ハッシュ: ${hash1.substring(0, 16)}...`);
      
      // 同じデータで再計算（一致するはず）
      const hash2 = this.calculateHash(sample);
      if (hash1 === hash2) {
        console.log('✅ ハッシュの一貫性確認OK');
      } else {
        throw new Error('ハッシュの一貫性エラー');
      }
      
      // データを少し変更してハッシュが変わることを確認
      const modified = { ...sample, sweetness: sample.sweetness + 0.1 };
      const hash3 = this.calculateHash(modified);
      
      if (hash1 !== hash3) {
        console.log('✅ データ変更検出OK');
      } else {
        throw new Error('データ変更が検出されませんでした');
      }
      
    } catch (error) {
      console.error('❌ ハッシュ計算テストに失敗:', error.message);
      throw error;
    }
  }

  async testDifferenceDetection(apiData) {
    console.log('\n4️⃣ 差分検出テスト...');
    
    try {
      // 現在のデータを取得（空の場合もある）
      const { data: currentData, error } = await this.supabase
        .from('sake_master')
        .select('*')
        .eq('is_active', true)
        .limit(5);
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      const current = currentData || [];
      console.log(`   現在のデータ: ${current.length}件`);
      console.log(`   APIデータ: ${apiData.length}件`);
      
      // 差分検出のシミュレーション
      const changes = this.detectChanges(apiData, current);
      
      console.log(`✅ 差分検出完了:`);
      console.log(`   新規: ${changes.inserts.length}件`);
      console.log(`   更新: ${changes.updates.length}件`);
      console.log(`   削除: ${changes.deletes.length}件`);
      
      // 詳細情報の表示
      if (changes.inserts.length > 0) {
        console.log(`   新規例: ${changes.inserts[0].brand_name}`);
      }
      
      if (changes.updates.length > 0) {
        const update = changes.updates[0];
        console.log(`   更新例: ${update.new.brand_name} (変更: ${update.changedFields.join(', ')})`);
      }
      
    } catch (error) {
      console.error('❌ 差分検出テストに失敗:', error.message);
      throw error;
    }
  }

  calculateHash(record) {
    const dataForHash = {
      brand_name: record.brand_name,
      brewery_name: record.brewery_name,
      sweetness: Math.round(record.sweetness * 1000) / 1000,
      richness: Math.round(record.richness * 1000) / 1000,
      f1: record.f1_floral,
      f2: record.f2_mellow,
      f3: record.f3_heavy,
      f4: record.f4_mild,
      f5: record.f5_dry,
      f6: record.f6_light
    };
    
    const dataString = JSON.stringify(dataForHash);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  detectChanges(apiData, currentData) {
    const currentMap = new Map(
      currentData.map(r => [r.brand_id, r])
    );
    
    const changes = {
      inserts: [],
      updates: [],
      deletes: []
    };
    
    // 新規・更新の検出
    for (const apiRecord of apiData) {
      const current = currentMap.get(apiRecord.brand_id);
      
      if (!current) {
        changes.inserts.push(apiRecord);
      } else {
        const apiHash = this.calculateHash(apiRecord);
        if (apiHash !== current.data_hash) {
          const changedFields = this.getChangedFields(current, apiRecord);
          changes.updates.push({
            old: current,
            new: apiRecord,
            changedFields
          });
        }
        currentMap.delete(apiRecord.brand_id);
      }
    }
    
    // 削除の検出
    changes.deletes = Array.from(currentMap.values());
    
    return changes;
  }

  getChangedFields(oldRecord, newRecord) {
    const fields = [
      'brand_name', 'brewery_name', 'sweetness', 'richness',
      'f1_floral', 'f2_mellow', 'f3_heavy', 'f4_mild', 'f5_dry', 'f6_light'
    ];
    
    const changed = [];
    for (const field of fields) {
      const oldVal = oldRecord[field];
      const newVal = newRecord[field];
      
      if (typeof oldVal === 'number' && typeof newVal === 'number') {
        if (Math.abs(oldVal - newVal) > 0.001) {
          changed.push(field);
        }
      } else if (oldVal !== newVal) {
        changed.push(field);
      }
    }
    
    return changed;
  }
}

// 実行
const tester = new SyncTestRunner();
tester.run().catch(console.error);