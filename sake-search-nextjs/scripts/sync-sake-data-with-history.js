#!/usr/bin/env node

/**
 * さけのわAPIから日本酒データを取得し、差分検出して世代管理付きで同期するスクリプト
 * 
 * 使用方法:
 *   node scripts/sync-sake-data-with-history.js
 *   
 * 環境変数:
 *   SUPABASE_URL: SupabaseプロジェクトのURL
 *   SUPABASE_SERVICE_KEY: Supabaseのサービスキー（管理者権限）
 *   DRY_RUN: "true"の場合、実際の更新を行わない
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 環境変数のチェック
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ 環境変数 SUPABASE_URL と SUPABASE_SERVICE_KEY が必要です');
  process.exit(1);
}

class SakeDataSyncWithHistory {
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
    
    this.isDryRun = process.env.DRY_RUN === 'true';
    this.stats = {
      startTime: new Date(),
      processed: 0,
      inserted: 0,
      updated: 0,
      deleted: 0,
      unchanged: 0,
      errors: []
    };
  }

  async run() {
    let generation = null;
    
    try {
      console.log('🍶 さけのわデータ同期を開始します...');
      if (this.isDryRun) {
        console.log('📝 DRY RUNモード: 実際の更新は行いません');
      }
      
      // 1. 新しい世代を開始
      generation = await this.startNewGeneration();
      console.log(`🔄 世代 #${generation.generation_id} を開始しました`);
      
      // 2. さけのわAPIからデータ取得
      console.log('📥 さけのわAPIからデータを取得中...');
      const apiData = await this.fetchFromSakenowaAPI();
      console.log(`✅ ${apiData.length} 件のデータを取得しました`);
      
      // 3. 現在のマスターデータを取得
      console.log('📊 現在のデータを取得中...');
      const currentData = await this.getCurrentMasterData();
      console.log(`📊 現在のデータ: ${currentData.length} 件`);
      
      // 4. 差分検出
      console.log('🔍 差分を検出中...');
      const changes = await this.detectChanges(apiData, currentData);
      
      console.log(`📊 検出された変更:`, {
        新規: changes.inserts.length,
        更新: changes.updates.length,
        削除: changes.deletes.length,
        変更なし: apiData.length - changes.inserts.length - changes.updates.length
      });
      
      this.stats.unchanged = apiData.length - changes.inserts.length - changes.updates.length;
      
      // 5. 変更を適用（DRY RUNでない場合）
      if (this.hasChanges(changes)) {
        if (!this.isDryRun) {
          console.log('💾 変更を適用中...');
          await this.applyChangesWithHistory(changes, generation);
          
          // 6. 変更サマリーを作成
          await this.createChangeSummary(changes, generation);
        } else {
          console.log('📝 DRY RUN: 以下の変更が適用される予定です:');
          this.printChangesSummary(changes);
        }
      } else {
        console.log('✨ 変更はありません');
      }
      
      // 7. 世代を完了
      if (!this.isDryRun) {
        await this.completeGeneration(generation, changes);
      }
      
      // 8. レポートを生成
      await this.generateReport(generation, changes);
      
      console.log(`✅ 世代 #${generation.generation_id} が完了しました`);
      console.log('📊 最終統計:', this.stats);
      
    } catch (error) {
      console.error('❌ 同期に失敗しました:', error);
      this.stats.errors.push(error.message);
      
      if (generation && !this.isDryRun) {
        await this.failGeneration(generation, error);
      }
      
      // エラーレポートを保存
      await this.saveErrorReport(error);
      
      process.exit(1);
    }
  }

  async startNewGeneration() {
    if (this.isDryRun) {
      return { generation_id: 'DRY_RUN', sync_started_at: new Date() };
    }
    
    const { data, error } = await this.supabase
      .from('sync_generations')
      .insert({
        sync_started_at: new Date(),
        sync_status: 'running'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async fetchFromSakenowaAPI() {
    const [brandsRes, breweriesRes, flavorChartsRes] = await Promise.all([
      fetch('https://muro.sakenowa.com/sakenowa-data/api/brands'),
      fetch('https://muro.sakenowa.com/sakenowa-data/api/breweries'),
      fetch('https://muro.sakenowa.com/sakenowa-data/api/flavor-charts')
    ]);
    
    const [brandsData, breweriesData, flavorChartsData] = await Promise.all([
      brandsRes.json(),
      breweriesRes.json(),
      flavorChartsRes.json()
    ]);
    
    const brands = brandsData.brands || [];
    const breweries = breweriesData.breweries || [];
    const flavorCharts = flavorChartsData.flavorCharts || [];
    
    // データを結合
    const breweriesMap = new Map(breweries.map(b => [b.id, b]));
    const flavorChartsMap = new Map(flavorCharts.map(f => [f.brandId, f]));
    
    const combinedData = [];
    
    for (const brand of brands) {
      const brewery = breweriesMap.get(brand.breweryId);
      const flavorChart = flavorChartsMap.get(brand.id);
      
      if (brewery && flavorChart) {
        // 座標を計算
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
          f6_light: flavorChart.f6,
          flavor_vector: [
            flavorChart.f1,
            flavorChart.f2,
            flavorChart.f3,
            flavorChart.f4,
            flavorChart.f5,
            flavorChart.f6,
            coordinates.sweetness / 3,
            coordinates.richness / 3
          ]
        });
      }
    }
    
    return combinedData;
  }

  convertFlavorToCoordinates(flavorChart) {
    // 甘辛度: 芳醇度を基準に、ドライ度で調整
    const sweetnessRaw = flavorChart.f2 * 2 - flavorChart.f5 * 2;
    const sweetness = Math.max(-3, Math.min(3, sweetnessRaw * 3));
    
    // 淡濃度: 重厚度を基準に、軽快度で調整
    const richnessRaw = flavorChart.f3 * 2 - flavorChart.f6 * 2;
    const richness = Math.max(-3, Math.min(3, richnessRaw * 3));
    
    return { sweetness, richness };
  }

  async getCurrentMasterData() {
    const { data, error } = await this.supabase
      .from('sake_master')
      .select('*')
      .eq('is_active', true);
    
    if (error && error.code !== 'PGRST116') { // テーブルが存在しない場合は無視
      throw error;
    }
    
    return data || [];
  }

  async detectChanges(apiData, currentData) {
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
        // 新規レコード
        changes.inserts.push(apiRecord);
      } else {
        // ハッシュを比較
        const apiHash = this.calculateHash(apiRecord);
        if (apiHash !== current.data_hash) {
          // 変更を検出
          const changedFields = this.getChangedFields(current, apiRecord);
          changes.updates.push({
            old: current,
            new: apiRecord,
            changedFields
          });
        }
        // 処理済みのレコードをマップから削除
        currentMap.delete(apiRecord.brand_id);
      }
    }
    
    // APIに存在しないレコード = 削除対象
    changes.deletes = Array.from(currentMap.values());
    
    return changes;
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

  getChangedFields(oldRecord, newRecord) {
    const fields = [
      'brand_name', 'brewery_name', 'sweetness', 'richness',
      'f1_floral', 'f2_mellow', 'f3_heavy', 'f4_mild', 'f5_dry', 'f6_light'
    ];
    
    const changed = [];
    for (const field of fields) {
      const oldVal = oldRecord[field];
      const newVal = newRecord[field];
      
      // 数値の場合は小数点以下3桁で比較
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

  hasChanges(changes) {
    return changes.inserts.length > 0 || 
           changes.updates.length > 0 || 
           changes.deletes.length > 0;
  }

  async applyChangesWithHistory(changes, generation) {
    const { generation_id } = generation;
    
    // 新規追加
    for (const record of changes.inserts) {
      await this.insertWithHistory(record, generation_id);
      this.stats.inserted++;
    }
    
    // 更新
    for (const update of changes.updates) {
      await this.updateWithHistory(
        update.old,
        update.new,
        update.changedFields,
        generation_id
      );
      this.stats.updated++;
    }
    
    // 削除（論理削除）
    for (const record of changes.deletes) {
      await this.deleteWithHistory(record, generation_id);
      this.stats.deleted++;
    }
  }

  async insertWithHistory(record, generationId) {
    const hash = this.calculateHash(record);
    
    // マスターテーブルに挿入
    const { error: masterError } = await this.supabase
      .from('sake_master')
      .insert({
        ...record,
        generation_id: generationId,
        data_hash: hash,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    
    if (masterError) throw masterError;
    
    // 履歴テーブルに記録
    const { error: historyError } = await this.supabase
      .from('sake_master_history')
      .insert({
        brand_id: record.brand_id,
        generation_id: generationId,
        operation: 'INSERT',
        old_data: null,
        new_data: record,
        changed_fields: Object.keys(record)
      });
    
    if (historyError) throw historyError;
  }

  async updateWithHistory(oldRecord, newRecord, changedFields, generationId) {
    const hash = this.calculateHash(newRecord);
    
    // マスターテーブルを更新
    const { error: masterError } = await this.supabase
      .from('sake_master')
      .update({
        ...newRecord,
        generation_id: generationId,
        data_hash: hash,
        updated_at: new Date()
      })
      .eq('brand_id', newRecord.brand_id);
    
    if (masterError) throw masterError;
    
    // 履歴テーブルに記録
    const { error: historyError } = await this.supabase
      .from('sake_master_history')
      .insert({
        brand_id: newRecord.brand_id,
        generation_id: generationId,
        operation: 'UPDATE',
        old_data: oldRecord,
        new_data: newRecord,
        changed_fields: changedFields
      });
    
    if (historyError) throw historyError;
  }

  async deleteWithHistory(record, generationId) {
    // 論理削除
    const { error: masterError } = await this.supabase
      .from('sake_master')
      .update({
        is_active: false,
        deleted_at: new Date(),
        generation_id: generationId
      })
      .eq('brand_id', record.brand_id);
    
    if (masterError) throw masterError;
    
    // 履歴テーブルに記録
    const { error: historyError } = await this.supabase
      .from('sake_master_history')
      .insert({
        brand_id: record.brand_id,
        generation_id: generationId,
        operation: 'DELETE',
        old_data: record,
        new_data: null,
        changed_fields: []
      });
    
    if (historyError) throw historyError;
  }

  async createChangeSummary(changes, generation) {
    const impact = this.calculateChangeImpact(changes);
    
    const summary = {
      generation_id: generation.generation_id,
      new_brands: changes.inserts.map(r => r.brand_name),
      removed_brands: changes.deletes.map(r => r.brand_name),
      updated_brands: changes.updates.map(u => u.new.brand_name),
      major_changes: {
        total_changes: changes.inserts.length + changes.updates.length + changes.deletes.length,
        details: {
          inserts: changes.inserts.length,
          updates: changes.updates.length,
          deletes: changes.deletes.length
        }
      },
      change_impact: impact
    };
    
    const { error } = await this.supabase
      .from('generation_changes_summary')
      .insert(summary);
    
    if (error) throw error;
  }

  calculateChangeImpact(changes) {
    const total = changes.inserts.length + changes.updates.length + changes.deletes.length;
    
    if (total === 0) return 'none';
    if (total <= 10) return 'minor';
    if (total <= 100) return 'moderate';
    return 'major';
  }

  async completeGeneration(generation, changes) {
    const { error } = await this.supabase
      .from('sync_generations')
      .update({
        sync_completed_at: new Date(),
        sync_status: 'completed',
        total_records: this.stats.processed,
        inserted_count: this.stats.inserted,
        updated_count: this.stats.updated,
        deleted_count: this.stats.deleted,
        unchanged_count: this.stats.unchanged
      })
      .eq('generation_id', generation.generation_id);
    
    if (error) throw error;
  }

  async failGeneration(generation, error) {
    await this.supabase
      .from('sync_generations')
      .update({
        sync_completed_at: new Date(),
        sync_status: 'failed',
        error_message: error.message,
        error_details: { stack: error.stack }
      })
      .eq('generation_id', generation.generation_id);
  }

  printChangesSummary(changes) {
    console.log('\n📝 新規追加される銘柄:');
    changes.inserts.slice(0, 5).forEach(r => {
      console.log(`  - ${r.brand_name} (${r.brewery_name})`);
    });
    if (changes.inserts.length > 5) {
      console.log(`  ... 他 ${changes.inserts.length - 5} 件`);
    }
    
    console.log('\n📝 更新される銘柄:');
    changes.updates.slice(0, 5).forEach(u => {
      console.log(`  - ${u.new.brand_name}: ${u.changedFields.join(', ')}`);
    });
    if (changes.updates.length > 5) {
      console.log(`  ... 他 ${changes.updates.length - 5} 件`);
    }
    
    console.log('\n📝 削除される銘柄:');
    changes.deletes.slice(0, 5).forEach(r => {
      console.log(`  - ${r.brand_name} (${r.brewery_name})`);
    });
    if (changes.deletes.length > 5) {
      console.log(`  ... 他 ${changes.deletes.length - 5} 件`);
    }
  }

  async generateReport(generation, changes) {
    const report = {
      generation_id: generation.generation_id,
      sync_date: new Date().toISOString(),
      duration_ms: Date.now() - this.stats.startTime.getTime(),
      statistics: this.stats,
      changes_summary: {
        inserts: changes.inserts.length,
        updates: changes.updates.length,
        deletes: changes.deletes.length,
        unchanged: this.stats.unchanged
      },
      dry_run: this.isDryRun
    };
    
    // ログディレクトリを作成
    const logsDir = path.join(__dirname, '..', 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    // レポートを保存
    const filename = `sync-report-${Date.now()}.json`;
    const filepath = path.join(logsDir, filename);
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    console.log(`📄 レポートを保存しました: ${filename}`);
  }

  async saveErrorReport(error) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack
      },
      stats: this.stats
    };
    
    const logsDir = path.join(__dirname, '..', 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    const filename = `error-report-${Date.now()}.json`;
    const filepath = path.join(logsDir, filename);
    await fs.writeFile(filepath, JSON.stringify(errorReport, null, 2));
  }
}

// メイン実行
const sync = new SakeDataSyncWithHistory();
sync.run().catch(console.error);