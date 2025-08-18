#!/usr/bin/env node

/**
 * Supabaseデータベースのセットアップスクリプト
 * 
 * 1. pgvector拡張の有効化
 * 2. 世代管理テーブルの作成
 * 3. 初期データの確認
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ 環境変数 SUPABASE_URL と SUPABASE_SERVICE_KEY が必要です');
  process.exit(1);
}

class DatabaseSetup {
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

  async setup() {
    console.log('🗄️ Supabaseデータベースのセットアップを開始します...');
    
    try {
      // 1. pgvector拡張の確認・有効化
      await this.enablePgVector();
      
      // 2. マイグレーションファイルの実行
      await this.runMigrations();
      
      // 3. データベース構造の確認
      await this.verifyTables();
      
      console.log('✅ データベースセットアップが完了しました！');
      
    } catch (error) {
      console.error('❌ セットアップに失敗しました:', error);
      process.exit(1);
    }
  }

  async enablePgVector() {
    console.log('📦 pgvector拡張を確認中...');
    
    try {
      // pgvector拡張の状態を確認
      const { data: extensions, error } = await this.supabase
        .from('pg_extension')
        .select('extname')
        .eq('extname', 'vector');
      
      if (error && error.code === 'PGRST116') {
        // pg_extensionテーブルにアクセスできない場合（権限不足）
        console.log('⚠️ 拡張確認のための権限が不足しています。手動でpgvectorを有効化してください。');
        console.log('Supabase Dashboard > SQL Editor で以下を実行:');
        console.log('CREATE EXTENSION IF NOT EXISTS vector;');
        return;
      }
      
      if (error) throw error;
      
      if (extensions && extensions.length > 0) {
        console.log('✅ pgvector拡張は既に有効です');
      } else {
        // pgvectorを有効化
        const { error: enableError } = await this.supabase.rpc('enable_pgvector');
        if (enableError) {
          console.log('⚠️ pgvectorの自動有効化に失敗しました。手動で有効化してください:');
          console.log('CREATE EXTENSION IF NOT EXISTS vector;');
        } else {
          console.log('✅ pgvector拡張を有効化しました');
        }
      }
    } catch (error) {
      console.log('⚠️ pgvector確認中にエラーが発生しました:', error.message);
      console.log('手動でpgvectorを有効化してください:');
      console.log('CREATE EXTENSION IF NOT EXISTS vector;');
    }
  }

  async runMigrations() {
    console.log('📜 マイグレーションを実行中...');
    
    // マイグレーションファイルを読み込み
    const migrationPath = path.join(__dirname, '..', 'migrations', '002_create_history_tables.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    
    // SQLを実行可能な形に分割
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (!statement) continue;
      
      try {
        console.log(`実行中: ${statement.substring(0, 50)}...`);
        const { error } = await this.supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // テーブルが既に存在する場合は無視
          if (error.message.includes('already exists')) {
            console.log(`⚠️ 既に存在: ${statement.substring(0, 30)}...`);
            continue;
          }
          throw error;
        }
        
      } catch (error) {
        console.warn(`⚠️ SQL実行でエラー: ${error.message}`);
        console.log('手動でマイグレーションを実行してください。');
        // マイグレーションファイルの内容を表示
        console.log('\n=== マイグレーションSQL ===');
        console.log(migrationSQL);
        console.log('=========================\n');
        break;
      }
    }
  }

  async verifyTables() {
    console.log('🔍 テーブル構造を確認中...');
    
    const tables = [
      'sake_master',
      'sync_generations', 
      'sake_master_history',
      'generation_changes_summary'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: 正常`);
        }
      } catch (error) {
        console.log(`❌ ${table}: ${error.message}`);
      }
    }
  }
}

// 実行
const setup = new DatabaseSetup();
setup.setup().catch(console.error);