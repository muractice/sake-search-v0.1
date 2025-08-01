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
        data: sakeData.map(sake => ({
          x: sake.sweetness,
          y: sake.richness,
        })),
        backgroundColor: '#FF6B35',
        borderColor: '#FF6B35',
        borderWidth: 0,
        pointRadius: 12,
        pointHoverRadius: 14,
        pointHoverBackgroundColor: '#FF8C42',
        pointHoverBorderColor: '#FF8C42',
        pointHoverBorderWidth: 2,
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
        onSakeClick(sake);
      }
    },
  };

  // カスタム軸線を描画するためのプラグイン
  const customAxesPlugin = {
    id: 'customAxes',
    beforeDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx;
      const chartArea = chart.chartArea;
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      
      ctx.save();
      
      // 太い青い軸線を描画
      ctx.strokeStyle = '#4A90E2';
      ctx.lineWidth = 4;
      
      // X軸（横線）
      ctx.beginPath();
      ctx.moveTo(chartArea.left, centerY);
      ctx.lineTo(chartArea.right, centerY);
      ctx.stroke();
      
      // Y軸（縦線）
      ctx.beginPath();
      ctx.moveTo(centerX, chartArea.top);
      ctx.lineTo(centerX, chartArea.bottom);
      ctx.stroke();
      
      // 矢印を描画
      ctx.fillStyle = '#4A90E2';
      
      // X軸の矢印（右）
      ctx.beginPath();
      ctx.moveTo(chartArea.right, centerY);
      ctx.lineTo(chartArea.right - 15, centerY - 8);
      ctx.lineTo(chartArea.right - 15, centerY + 8);
      ctx.closePath();
      ctx.fill();
      
      // X軸の矢印（左）
      ctx.beginPath();
      ctx.moveTo(chartArea.left, centerY);
      ctx.lineTo(chartArea.left + 15, centerY - 8);
      ctx.lineTo(chartArea.left + 15, centerY + 8);
      ctx.closePath();
      ctx.fill();
      
      // Y軸の矢印（上）
      ctx.beginPath();
      ctx.moveTo(centerX, chartArea.top);
      ctx.lineTo(centerX - 8, chartArea.top + 15);
      ctx.lineTo(centerX + 8, chartArea.top + 15);
      ctx.closePath();
      ctx.fill();
      
      // Y軸の矢印（下）
      ctx.beginPath();
      ctx.moveTo(centerX, chartArea.bottom);
      ctx.lineTo(centerX - 8, chartArea.bottom - 15);
      ctx.lineTo(centerX + 8, chartArea.bottom - 15);
      ctx.closePath();
      ctx.fill();
      
      // ラベルの描画
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif';
      ctx.fillStyle = '#1a202c';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 横軸ラベル
      ctx.fillText('辛い', chartArea.left - 40, centerY);
      ctx.fillText('甘い', chartArea.right + 40, centerY);
      
      // 縦軸ラベル
      ctx.fillText('濃醇', centerX, chartArea.top - 30);
      ctx.fillText('淡麗', centerX, chartArea.bottom + 30);
      
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
      
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">味覚マップの見方</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div>
            <span className="font-medium text-blue-600">右上:</span> 甘口・濃醇（デザート系）
          </div>
          <div>
            <span className="font-medium text-blue-600">左上:</span> 辛口・濃醇（力強い系）
          </div>
          <div>
            <span className="font-medium text-blue-600">左下:</span> 辛口・淡麗（すっきり系）
          </div>
          <div>
            <span className="font-medium text-blue-600">右下:</span> 甘口・淡麗（やわらか系）
          </div>
        </div>
      </div>
    </div>
  );
}