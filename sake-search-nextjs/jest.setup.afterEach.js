// 各テストの後に、保留中のタイマーやPromiseをクリアする
afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
});