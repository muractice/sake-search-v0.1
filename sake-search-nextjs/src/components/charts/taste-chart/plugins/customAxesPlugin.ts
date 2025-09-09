import { Chart as ChartJS } from 'chart.js';

export const customAxesPlugin = {
  id: 'customAxes',
  beforeDatasetsDraw: (chart: ChartJS) => {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    
    ctx.save();
    
    // 背景のグラデーション効果を追加
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, Math.max(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
    
    // 象限を色分けする微妙な背景
    const quadrantGradients = [
      // 第1象限 (甘口・濃醇)
      { x: centerX, y: chartArea.top, w: chartArea.right - centerX, h: centerY - chartArea.top, color: 'rgba(236, 72, 153, 0.03)' },
      // 第2象限 (辛口・濃醇)
      { x: chartArea.left, y: chartArea.top, w: centerX - chartArea.left, h: centerY - chartArea.top, color: 'rgba(99, 102, 241, 0.03)' },
      // 第3象限 (辛口・淡麗)
      { x: chartArea.left, y: centerY, w: centerX - chartArea.left, h: chartArea.bottom - centerY, color: 'rgba(34, 197, 94, 0.03)' },
      // 第4象限 (甘口・淡麗)
      { x: centerX, y: centerY, w: chartArea.right - centerX, h: chartArea.bottom - centerY, color: 'rgba(245, 101, 101, 0.03)' }
    ];
    
    quadrantGradients.forEach(quad => {
      ctx.fillStyle = quad.color;
      ctx.fillRect(quad.x, quad.y, quad.w, quad.h);
    });
    
    // 軸線の描画
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 3;
    
    // 水平線 (X軸)
    ctx.beginPath();
    ctx.moveTo(chartArea.left, centerY);
    ctx.lineTo(chartArea.right, centerY);
    ctx.stroke();
    
    // 垂直線 (Y軸)  
    ctx.beginPath();
    ctx.moveTo(centerX, chartArea.top);
    ctx.lineTo(centerX, chartArea.bottom);
    ctx.stroke();
    
    // ラベルの描画
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 象限ラベル
    const quadrantLabels = [
      { text: '甘・濃醇', x: centerX + (chartArea.right - centerX) / 2, y: chartArea.top + (centerY - chartArea.top) / 2 },
      { text: '濃醇', x: chartArea.left + (centerX - chartArea.left) / 2, y: chartArea.top + (centerY - chartArea.top) / 2 },
      { text: '辛・淡麗', x: chartArea.left + (centerX - chartArea.left) / 2, y: centerY + (chartArea.bottom - centerY) / 2 },
      { text: '甘・淡麗', x: centerX + (chartArea.right - centerX) / 2, y: centerY + (chartArea.bottom - centerY) / 2 }
    ];
    
    // 4象限内のラベル
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif';
    
    // 第1象限 (右上): 甘口・濃醇
    const quadrant1X = centerX + (chartArea.right - centerX) * 0.5;
    const quadrant1Y = chartArea.top + (centerY - chartArea.top) * 0.3;
    ctx.fillStyle = 'rgba(236, 72, 153, 0.6)';
    ctx.fillText('甘・濃醇', quadrant1X, quadrant1Y);
    
    // 第2象限 (左上): 辛口・濃醇
    const quadrant2X = chartArea.left + (centerX - chartArea.left) * 0.5;
    const quadrant2Y = chartArea.top + (centerY - chartArea.top) * 0.3;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.fillText('辛・濃醇', quadrant2X, quadrant2Y);
    
    // 第3象限 (左下): 辛口・淡麗
    const quadrant3X = chartArea.left + (centerX - chartArea.left) * 0.5;
    const quadrant3Y = centerY + (chartArea.bottom - centerY) * 0.7;
    ctx.fillStyle = 'rgba(34, 197, 94, 0.6)';
    ctx.fillText('辛・淡麗', quadrant3X, quadrant3Y);
    
    // 第4象限 (右下): 甘口・淡麗
    const quadrant4X = centerX + (chartArea.right - centerX) * 0.5;
    const quadrant4Y = centerY + (chartArea.bottom - centerY) * 0.7;
    ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
    ctx.fillText('甘・淡麗', quadrant4X, quadrant4Y);
    
    // 軸ラベル
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif';
    
    // 横軸ラベル（チャートの中、横軸の下）
    const horizontalLabelY = centerY + 15;
    ctx.fillText('甘', chartArea.left + 30, horizontalLabelY);
    ctx.fillText('辛', chartArea.right - 30, horizontalLabelY);
    
    // 縦軸ラベル
    ctx.fillText('濃醇', centerX, chartArea.top - 20);
    ctx.fillText('淡麗', centerX, chartArea.bottom + 25);
    
    ctx.restore();
  },
};