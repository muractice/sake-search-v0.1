/**
 * 簡易E2Eテストスクリプト
 * Node.jsの標準モジュールのみで実装
 */

const http = require('http');

const tests = [
  {
    name: 'ホームページアクセス',
    path: '/',
    expectedStatus: 200,
  },
  // 検索はServer Actions/RSC経由に統一したため、HTTPの旧エンドポイントテストは削除
  {
    name: 'Gemini Vision APIエンドポイント',
    path: '/api/gemini-vision',
    expectedStatus: 405, // GETは許可されていない
  },
];

async function runTest(test) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: test.path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const passed = res.statusCode === test.expectedStatus;
        console.log(`${passed ? '✅' : '❌'} ${test.name}: ${res.statusCode} ${passed ? 'OK' : `(期待値: ${test.expectedStatus})`}`);
        resolve(passed);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${test.name}: エラー - ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

async function runAllTests() {
  console.log('🧪 E2Eテスト開始...\n');
  
  let passedCount = 0;
  let failedCount = 0;

  for (const test of tests) {
    const passed = await runTest(test);
    if (passed) {
      passedCount++;
    } else {
      failedCount++;
    }
    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 結果:');
  console.log(`✅ 成功: ${passedCount}`);
  console.log(`❌ 失敗: ${failedCount}`);
  console.log(`合計: ${tests.length}`);

  process.exit(failedCount > 0 ? 1 : 0);
}

// サーバーが起動するまで少し待つ
console.log('⏳ サーバー起動を待っています...');
setTimeout(runAllTests, 2000);
