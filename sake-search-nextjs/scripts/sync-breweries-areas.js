/**
 * Sake NoWaから蔵元・地域データを取得してSupabaseに同期するスクリプト
 * 
 * 使用方法:
 * node scripts/sync-breweries-areas.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

// Supabaseクライアントの初期化
// SUPABASE_SERVICE_KEY（.env.localに存在）を使用
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Sake NoWa APIベースURL
const SAKENOWA_API_BASE = 'https://muro.sakenowa.com/sakenowa-data/api';

/**
 * APIからデータを取得
 */
async function fetchFromSakenowaAPI(endpoint) {
  try {
    const response = await fetch(`${SAKENOWA_API_BASE}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
}

/**
 * 地域データを同期
 */
async function syncAreas() {
  console.log('📍 地域データの同期を開始...');
  
  try {
    // Sake NoWaから地域データを取得
    const response = await fetchFromSakenowaAPI('areas');
    const areas = response.areas || [];
    
    console.log(`  取得した地域数: ${areas.length}`);
    
    // 既存データを削除（全置換方式）
    const { error: deleteError } = await supabase
      .from('areas')
      .delete()
      .neq('id', 0); // すべて削除（idが0でないもの）
    
    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error('既存地域データの削除エラー:', deleteError);
    }
    
    // データを挿入
    const { data, error } = await supabase
      .from('areas')
      .insert(areas)
      .select();
    
    if (error) {
      console.error('地域データの挿入エラー:', error);
      return false;
    }
    
    console.log(`✅ ${data.length}件の地域データを同期しました`);
    return true;
    
  } catch (error) {
    console.error('❌ 地域データの同期に失敗:', error);
    return false;
  }
}

/**
 * 蔵元データを同期
 */
async function syncBreweries() {
  console.log('🏭 蔵元データの同期を開始...');
  
  try {
    // Sake NoWaから蔵元データを取得
    const response = await fetchFromSakenowaAPI('breweries');
    const breweries = response.breweries || [];
    
    console.log(`  取得した蔵元数: ${breweries.length}`);
    
    // データ整形（areaIdをarea_idに変換）
    const formattedBreweries = breweries.map(brewery => ({
      id: brewery.id,
      name: brewery.name,
      area_id: brewery.areaId || null
    }));
    
    // 既存データを削除（全置換方式）
    const { error: deleteError } = await supabase
      .from('breweries')
      .delete()
      .neq('id', 0); // すべて削除（idが0でないもの）
    
    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error('既存蔵元データの削除エラー:', deleteError);
    }
    
    // バッチサイズを設定（一度に大量のデータを送信するとエラーになる可能性があるため）
    const batchSize = 500;
    let insertedCount = 0;
    
    for (let i = 0; i < formattedBreweries.length; i += batchSize) {
      const batch = formattedBreweries.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('breweries')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`蔵元データの挿入エラー (バッチ ${i / batchSize + 1}):`, error);
        continue;
      }
      
      insertedCount += data.length;
      console.log(`  バッチ ${i / batchSize + 1}: ${data.length}件挿入`);
    }
    
    console.log(`✅ ${insertedCount}件の蔵元データを同期しました`);
    return true;
    
  } catch (error) {
    console.error('❌ 蔵元データの同期に失敗:', error);
    return false;
  }
}

/**
 * 統計情報を表示
 */
async function showStatistics() {
  console.log('\n📊 統計情報を取得中...');
  
  try {
    // 地域数を取得
    const { count: areaCount, error: areaError } = await supabase
      .from('areas')
      .select('*', { count: 'exact', head: true });
    
    if (areaError) throw areaError;
    
    // 蔵元数を取得
    const { count: breweryCount, error: breweryError } = await supabase
      .from('breweries')
      .select('*', { count: 'exact', head: true });
    
    if (breweryError) throw breweryError;
    
    // 地域別蔵元数を取得
    const { data: areaStats, error: statsError } = await supabase
      .from('breweries')
      .select('area_id, areas!inner(name)')
      .order('area_id');
    
    if (statsError) throw statsError;
    
    // 地域別集計
    const areaCounts = {};
    areaStats.forEach(brewery => {
      const areaName = brewery.areas?.name || '不明';
      areaCounts[areaName] = (areaCounts[areaName] || 0) + 1;
    });
    
    console.log('\n=== 同期結果 ===');
    console.log(`地域数: ${areaCount}`);
    console.log(`蔵元数: ${breweryCount}`);
    console.log('\n地域別蔵元数（上位10）:');
    
    const sortedAreas = Object.entries(areaCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    
    sortedAreas.forEach(([area, count]) => {
      console.log(`  ${area}: ${count}蔵`);
    });
    
  } catch (error) {
    console.error('統計情報の取得に失敗:', error);
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🍶 Sake NoWa データ同期スクリプト');
  console.log('================================\n');
  
  // 環境変数チェック
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    console.error('❌ 環境変数 SUPABASE_URL が設定されていません');
    process.exit(1);
  }
  
  if (!serviceKey) {
    console.error('❌ Supabaseのサービスキーが設定されていません（SUPABASE_SERVICE_KEY）');
    process.exit(1);
  }
  
  console.log('✅ サービスキーを使用してデータを同期します');
  
  const startTime = Date.now();
  
  try {
    // 1. 地域データを同期（蔵元より先に実行する必要がある）
    const areaSuccess = await syncAreas();
    if (!areaSuccess) {
      console.error('地域データの同期に失敗したため、処理を中止します');
      process.exit(1);
    }
    
    // 2. 蔵元データを同期
    const brewerySuccess = await syncBreweries();
    if (!brewerySuccess) {
      console.error('蔵元データの同期に失敗しました');
    }
    
    // 3. 統計情報を表示
    await showStatistics();
    
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✨ 同期完了（処理時間: ${elapsedTime}秒）`);
    
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
main().catch(console.error);