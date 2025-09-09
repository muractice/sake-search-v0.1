'use client';

import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartEvent,
  ActiveElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Scatter } from 'react-chartjs-2';
import { SakeData } from '@/types/sake';
import { customAxesPlugin } from './taste-chart/plugins/customAxesPlugin';
import { CHART_CONFIG } from './taste-chart/constants/chartConfig';
import {
  createChartDataset,
  createTooltipCallbacks,
  createDataLabelsConfig,
  debugSakeData
} from './taste-chart/utils/chartUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface TasteChartProps {
  sakeData: SakeData[];
  onSakeClick: (sake: SakeData) => void;
}

import TasteChartComponent from './taste-chart/TasteChart';

export default function TasteChart({ sakeData, onSakeClick }: TasteChartProps) {
  return (
    <TasteChartComponent 
      sakeData={sakeData}
      onSakeClick={onSakeClick}
    />
  );
}

// Keep the legacy implementation for now but mark as deprecated
function _LegacyTasteChart({ sakeData, onSakeClick }: TasteChartProps) {
  const chartRef = useRef<ChartJS<'scatter'>>(null);

  // デバッグ: ブラウザのコンソールでwindow.debugSakeDataで確認可能にする
  debugSakeData(sakeData);
  
  // 検証を一時的に無効化 - すべてのデータを表示
  const validSakeData = sakeData;

  const data = {
    datasets: [createChartDataset(validSakeData)],
  };

  const options = {
    ...CHART_CONFIG,
    plugins: {
      ...CHART_CONFIG.plugins,
      tooltip: {
        ...CHART_CONFIG.plugins.tooltip,
        callbacks: createTooltipCallbacks(validSakeData),
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleFont: {
          size: 16
        },
        bodyFont: {
          size: 14
        },
        padding: 15,
        cornerRadius: 8
      },
      datalabels: createDataLabelsConfig()
    },
    scales: {
      x: {
        ...CHART_CONFIG.scales.x,
        position: 'center' as const,
      },
      y: {
        ...CHART_CONFIG.scales.y,
        position: 'center' as const,
        min: -3.5,
        max: 3.5,
      },
    },
    onClick: (_event: ChartEvent, elements: ActiveElement[], chart: ChartJS) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const sake = validSakeData[index];
        
        if (sake) {
          // Add visual feedback for click
          const canvas = chart.canvas;
          canvas.style.transform = 'scale(0.98)';
          setTimeout(() => {
            canvas.style.transform = 'scale(1)';
          }, 150);
          
          onSakeClick(sake);
        }
      }
    },
  };

  // カスタム軸線とグラデーション背景を描画するプラグイン
  const customAxesPlugin = {
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
        { x: chartArea.left, y: chartArea.top, w: centerX - chartArea.left, h: centerY - chartArea.top, color: 'rgba(239, 68, 68, 0.03)' },
        // 第3象限 (辛口・淡麗)
        { x: chartArea.left, y: centerY, w: centerX - chartArea.left, h: chartArea.bottom - centerY, color: 'rgba(34, 197, 94, 0.03)' },
        // 第4象限 (甘口・淡麗)
        { x: centerX, y: centerY, w: chartArea.right - centerX, h: chartArea.bottom - centerY, color: 'rgba(99, 102, 241, 0.03)' }
      ];
      
      quadrantGradients.forEach(quad => {
        ctx.fillStyle = quad.color;
        ctx.fillRect(quad.x, quad.y, quad.w, quad.h);
      });
      
      // 美しいグラデーション軸線
      const axisGradient = ctx.createLinearGradient(chartArea.left, centerY, chartArea.right, centerY);
      axisGradient.addColorStop(0, '#ef4444');
      axisGradient.addColorStop(0.5, '#6366f1');
      axisGradient.addColorStop(1, '#ec4899');
      
      // X軸（横線）- グラデーション
      ctx.strokeStyle = axisGradient;
      ctx.lineWidth = 5;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.3)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(chartArea.left, centerY);
      ctx.lineTo(chartArea.right, centerY);
      ctx.stroke();
      
      // Y軸（縦線）- グラデーション
      const yAxisGradient = ctx.createLinearGradient(centerX, chartArea.top, centerX, chartArea.bottom);
      yAxisGradient.addColorStop(0, '#22c55e');
      yAxisGradient.addColorStop(0.5, '#6366f1');
      yAxisGradient.addColorStop(1, '#3b82f6');
      
      ctx.strokeStyle = yAxisGradient;
      ctx.beginPath();
      ctx.moveTo(centerX, chartArea.top);
      ctx.lineTo(centerX, chartArea.bottom);
      ctx.stroke();
      
      // リセット
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      // スタイリッシュな矢印
      const drawArrow = (x: number, y: number, direction: 'up' | 'down' | 'left' | 'right', color: string) => {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        const size = 12;
        
        switch (direction) {
          case 'right':
            ctx.moveTo(x, y);
            ctx.lineTo(x - size, y - size/2);
            ctx.lineTo(x - size, y + size/2);
            break;
          case 'left':
            ctx.moveTo(x, y);
            ctx.lineTo(x + size, y - size/2);
            ctx.lineTo(x + size, y + size/2);
            break;
          case 'up':
            ctx.moveTo(x, y);
            ctx.lineTo(x - size/2, y + size);
            ctx.lineTo(x + size/2, y + size);
            break;
          case 'down':
            ctx.moveTo(x, y);
            ctx.lineTo(x - size/2, y - size);
            ctx.lineTo(x + size/2, y - size);
            break;
        }
        
        ctx.closePath();
        ctx.fill();
      };
      
      // カラフルな矢印
      drawArrow(chartArea.right, centerY, 'right', '#ec4899');
      drawArrow(chartArea.left, centerY, 'left', '#ef4444');
      drawArrow(centerX, chartArea.top, 'up', '#22c55e');
      drawArrow(centerX, chartArea.bottom, 'down', '#3b82f6');
      
      // 美しいラベル
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // ラベルに影を追加
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // 横軸ラベル（チャート内、横軸の下に配置）
      ctx.fillStyle = '#ef4444';
      ctx.fillText('辛', chartArea.left + 20, centerY + 15);
      ctx.fillStyle = '#ec4899';
      ctx.fillText('甘', chartArea.right - 20, centerY + 15);
      
      // 縦軸ラベル
      ctx.fillStyle = '#22c55e';
      ctx.fillText('濃醇', centerX, chartArea.top - 25);
      ctx.fillStyle = '#3b82f6';
      ctx.fillText('淡麗', centerX, chartArea.bottom + 25);
      
      // 象限の背景テキストを追加
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif';
      
      // 第1象限 (右上): 甘口・濃醇
      const quadrant1X = centerX + (chartArea.right - centerX) * 0.5;
      const quadrant1Y = chartArea.top + (centerY - chartArea.top) * 0.3;
      ctx.fillStyle = 'rgba(236, 72, 153, 0.6)';
      ctx.fillText('甘・濃醇', quadrant1X, quadrant1Y);
      
      // 第2象限 (左上): 辛口・濃醇
      const quadrant2X = chartArea.left + (centerX - chartArea.left) * 0.5;
      const quadrant2Y = chartArea.top + (centerY - chartArea.top) * 0.3;
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.fillText('辛・濃醇', quadrant2X, quadrant2Y);
      
      // 第3象限 (左下): 辛口・淡麗
      const quadrant3X = chartArea.left + (centerX - chartArea.left) * 0.5;
      const quadrant3Y = centerY + (chartArea.bottom - centerY) * 0.7;
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif';
      ctx.fillStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.fillText('辛・淡麗', quadrant3X, quadrant3Y);
      
      // 第4象限 (右下): 甘口・淡麗
      const quadrant4X = centerX + (chartArea.right - centerX) * 0.5;
      const quadrant4Y = centerY + (chartArea.bottom - centerY) * 0.7;
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif';
      ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.fillText('甘・淡麗', quadrant4X, quadrant4Y);
      
      ctx.restore();
    }
  };



  return (
    <div className="relative">
      <div className="h-96 md:h-[500px]">
        <Scatter 
          ref={chartRef}
          data={data} 
          options={options} 
          plugins={[customAxesPlugin]}
        />
      </div>
      
      
      {validSakeData.length > 0 && (
        <div className="mt-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></span>
            日本酒一覧
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {validSakeData.map((sake, index) => {
              // 対応する色を取得
              const colors = [
                'rgba(99, 102, 241, 1)',   // インディゴ
                'rgba(168, 85, 247, 1)',   // パープル  
                'rgba(236, 72, 153, 1)',   // ピンク
                'rgba(239, 68, 68, 1)',    // レッド
                'rgba(245, 101, 101, 1)',  // ライトレッド
                'rgba(34, 197, 94, 1)',    // グリーン
                'rgba(59, 130, 246, 1)',   // ブルー
                'rgba(14, 165, 233, 1)',   // スカイブルー
                'rgba(6, 182, 212, 1)',    // シアン
                'rgba(16, 185, 129, 1)',   // エメラルド
              ];
              const color = colors[index % colors.length];
              
              return (
                <div key={sake.id} className="flex items-center bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-purple-200/50">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                      style={{ backgroundColor: color }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{sake.name}</div>
                      <div className="text-sm text-gray-600">{sake.brewery}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
    </div>
  );
}