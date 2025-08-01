'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { SakeData } from '@/types/sake';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface TasteChartProps {
  sakeData: SakeData[];
  onSakeClick: (sake: SakeData) => void;
}

export default function TasteChart({ sakeData, onSakeClick }: TasteChartProps) {
  const chartRef = useRef<ChartJS<'scatter'>>(null);

  const data = {
    datasets: [
      {
        label: '日本酒',
        data: sakeData.map((sake, index) => ({
          x: sake.sweetness,
          y: sake.richness,
        })),
        backgroundColor: sakeData.map((_, index) => {
          // 美しいグラデーションカラーパレット
          const colors = [
            'rgba(99, 102, 241, 0.8)',   // インディゴ
            'rgba(168, 85, 247, 0.8)',   // パープル  
            'rgba(236, 72, 153, 0.8)',   // ピンク
            'rgba(239, 68, 68, 0.8)',    // レッド
            'rgba(245, 101, 101, 0.8)',  // ライトレッド
            'rgba(34, 197, 94, 0.8)',    // グリーン
            'rgba(59, 130, 246, 0.8)',   // ブルー
            'rgba(14, 165, 233, 0.8)',   // スカイブルー
            'rgba(6, 182, 212, 0.8)',    // シアン
            'rgba(16, 185, 129, 0.8)',   // エメラルド
          ];
          return colors[index % colors.length];
        }),
        borderColor: sakeData.map((_, index) => {
          const colors = [
            'rgba(99, 102, 241, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(245, 101, 101, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(14, 165, 233, 1)',
            'rgba(6, 182, 212, 1)',
            'rgba(16, 185, 129, 1)',
          ];
          return colors[index % colors.length];
        }),
        borderWidth: 3,
        pointRadius: 14,
        pointHoverRadius: 18,
        pointHoverBackgroundColor: sakeData.map((_, index) => {
          const colors = [
            'rgba(99, 102, 241, 0.95)',
            'rgba(168, 85, 247, 0.95)',
            'rgba(236, 72, 153, 0.95)',
            'rgba(239, 68, 68, 0.95)',
            'rgba(245, 101, 101, 0.95)',
            'rgba(34, 197, 94, 0.95)',
            'rgba(59, 130, 246, 0.95)',
            'rgba(14, 165, 233, 0.95)',
            'rgba(6, 182, 212, 0.95)',
            'rgba(16, 185, 129, 0.95)',
          ];
          return colors[index % colors.length];
        }),
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 4,
        pointStyle: 'circle',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const sake = sakeData[context.dataIndex];
            if (sake) {
              return [
                sake.name,
                `蔵元: ${sake.brewery}`,
                `甘辛: ${sake.sweetness > 0 ? '甘口' : '辛口'} (${sake.sweetness})`,
                `淡濃: ${sake.richness > 0 ? '濃醇' : '淡麗'} (${sake.richness})`
              ];
            }
            return '';
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleFont: {
          size: 16
        },
        bodyFont: {
          size: 14
        },
        padding: 15,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'center' as const,
        min: -3,
        max: 3,
        title: {
          display: false,
        },
        grid: {
          display: false,
          drawBorder: false,
          drawOnChartArea: false,
          drawTicks: false,
        },
        ticks: {
          display: false,
        },
      },
      y: {
        type: 'linear' as const,
        position: 'center' as const,
        min: -3,
        max: 3,
        title: {
          display: false,
        },
        grid: {
          display: false,
          drawBorder: false,
          drawOnChartArea: false,
          drawTicks: false,
        },
        ticks: {
          display: false,
        },
      },
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const sake = sakeData[index];
        
        // Add visual feedback for click
        const canvas = event.chart.canvas;
        canvas.style.transform = 'scale(0.98)';
        setTimeout(() => {
          canvas.style.transform = 'scale(1)';
        }, 150);
        
        onSakeClick(sake);
      }
    },
  };

  // カスタム軸線とグラデーション背景を描画するプラグイン
  const customAxesPlugin = {
    id: 'customAxes',
    beforeDatasetsDraw: (chart: any) => {
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
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // ラベルに影を追加
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // 横軸ラベル
      ctx.fillStyle = '#ef4444';
      ctx.fillText('辛い', chartArea.left - 35, centerY);
      ctx.fillStyle = '#ec4899';
      ctx.fillText('甘い', chartArea.right + 35, centerY);
      
      // 縦軸ラベル
      ctx.fillStyle = '#22c55e';
      ctx.fillText('濃醇', centerX, chartArea.top - 25);
      ctx.fillStyle = '#3b82f6';
      ctx.fillText('淡麗', centerX, chartArea.bottom + 25);
      
      ctx.restore();
    }
  };

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.options.plugins = {
        ...chartRef.current.options.plugins,
        customAxes: customAxesPlugin,
      };
    }
  }, []);

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
      
      <div className="mt-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center">
          <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></span>
          味覚マップの見方
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-pink-200/50">
            <span className="inline-flex items-center font-semibold text-pink-600 mb-1">
              <span className="w-3 h-3 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full mr-2"></span>
              右上:
            </span>
            <div className="text-gray-700">甘口・濃醇（デザート系）</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-red-200/50">
            <span className="inline-flex items-center font-semibold text-red-600 mb-1">
              <span className="w-3 h-3 bg-gradient-to-r from-red-400 to-red-600 rounded-full mr-2"></span>
              左上:
            </span>
            <div className="text-gray-700">辛口・濃醇（力強い系）</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-green-200/50">
            <span className="inline-flex items-center font-semibold text-green-600 mb-1">
              <span className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full mr-2"></span>
              左下:
            </span>
            <div className="text-gray-700">辛口・淡麗（すっきり系）</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-blue-200/50">
            <span className="inline-flex items-center font-semibold text-blue-600 mb-1">
              <span className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mr-2"></span>
              右下:
            </span>
            <div className="text-gray-700">甘口・淡麗（やわらか系）</div>
          </div>
        </div>
      </div>
    </div>
  );
}