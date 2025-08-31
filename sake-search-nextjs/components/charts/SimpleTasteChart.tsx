'use client';

import { useRef } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartEvent,
  ActiveElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Scatter } from 'react-chartjs-2';
import { SakeData } from '@/types/sake';
import { CHART_COLORS, CHART_BORDER_COLORS, CHART_HOVER_COLORS, getColorByIndex } from '@/utils/chartColors';

ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface SimpleTasteChartProps {
  sakeData: SakeData[];
  onSakeClick: (sake: SakeData) => void;
}

export default function SimpleTasteChart({ sakeData, onSakeClick }: SimpleTasteChartProps) {
  const chartRef = useRef<ChartJS<'scatter'>>(null);

  const data = {
    datasets: [
      {
        label: '日本酒',
        data: sakeData.map((sake) => ({
          x: sake.sweetness,
          y: sake.richness,
        })),
        backgroundColor: sakeData.map((_, index) => getColorByIndex(index, CHART_COLORS)),
        borderColor: sakeData.map((_, index) => getColorByIndex(index, CHART_BORDER_COLORS)),
        borderWidth: 2,
        pointRadius: 10,
        pointHoverRadius: 14,
        pointHoverBackgroundColor: sakeData.map((_, index) => getColorByIndex(index, CHART_HOVER_COLORS)),
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
        pointStyle: 'circle',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 40,
        bottom: 40,
        left: 50,
        right: 50
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: { dataIndex: number }): string | string[] {
            const sake = sakeData[context.dataIndex];
            if (sake && typeof sake.name === 'string') {
              return [
                sake.name,
                `蔵元: ${sake.brewery}`,
                `甘辛: ${sake.sweetness > 0 ? '甘口' : '辛口'} (${sake.sweetness.toFixed(1)})`,
                `淡濃: ${sake.richness > 0 ? '濃醇' : '淡麗'} (${sake.richness.toFixed(1)})`
              ];
            }
            return '';
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 12
        },
        padding: 12,
        cornerRadius: 6
      },
      datalabels: {
        display: true,
        color: '#ffffff',
        font: {
          weight: 'bold' as const,
          size: 16,
          family: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif'
        },
        formatter: (_value: unknown, context: { dataIndex: number }) => {
          return context.dataIndex + 1;
        },
        anchor: 'center' as const,
        align: 'center' as const,
        textStrokeColor: '#000000',
        textStrokeWidth: 4
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        min: -3,
        max: 3,
        title: {
          display: true,
          text: '← 辛口　　　　　　　　　　　　　　甘口 →',
          font: {
            size: 14,
            weight: 'bold' as const
          },
          color: '#4b5563'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: true,
          borderColor: '#d1d5db',
          borderWidth: 2,
          drawOnChartArea: true,
          drawTicks: true,
        },
        ticks: {
          stepSize: 1,
          color: '#6b7280',
          font: {
            size: 11
          },
          callback: function(value: string | number) {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            if (numValue === 0) return '0';
            if (numValue === -3) return '-3';
            if (numValue === 3) return '+3';
            return numValue > 0 ? `+${numValue}` : `${numValue}`;
          }
        },
      },
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        min: -3,
        max: 3,
        title: {
          display: true,
          text: '↑ 濃醇',
          font: {
            size: 14,
            weight: 'bold' as const
          },
          color: '#4b5563',
          padding: { bottom: 10 }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: true,
          borderColor: '#d1d5db',
          borderWidth: 2,
          drawOnChartArea: true,
          drawTicks: true,
        },
        ticks: {
          stepSize: 1,
          color: '#6b7280',
          font: {
            size: 11
          },
          callback: function(value: string | number) {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            if (numValue === 0) return '0';
            if (numValue === -3) return '-3';
            if (numValue === 3) return '+3';
            return numValue > 0 ? `+${numValue}` : `${numValue}`;
          }
        },
      },
    },
    onClick: (_event: ChartEvent, elements: ActiveElement[], chart: ChartJS) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const sake = sakeData[index];
        
        if (sake) {
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

  // シンプルな軸線とラベルを描画するプラグイン
  const simpleAxesPlugin = {
    id: 'simpleAxes',
    afterDatasetsDraw: (chart: ChartJS) => {
      const ctx = chart.ctx;
      const chartArea = chart.chartArea;
      
      ctx.save();
      
      // Y軸の下部ラベル
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif';
      ctx.fillStyle = '#4b5563';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('↓ 淡麗', chartArea.left - 35, chartArea.bottom + 10);
      
      // 原点（0,0）を強調
      const xScale = chart.scales.x;
      const yScale = chart.scales.y;
      const centerX = xScale.getPixelForValue(0);
      const centerY = yScale.getPixelForValue(0);
      
      // 原点に十字線を描画
      ctx.strokeStyle = 'rgba(107, 114, 128, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      // 横線
      ctx.beginPath();
      ctx.moveTo(chartArea.left, centerY);
      ctx.lineTo(chartArea.right, centerY);
      ctx.stroke();
      
      // 縦線
      ctx.beginPath();
      ctx.moveTo(centerX, chartArea.top);
      ctx.lineTo(centerX, chartArea.bottom);
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // 原点にラベル
      ctx.fillStyle = 'rgba(107, 114, 128, 0.7)';
      ctx.font = 'normal 11px -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('(0,0)', centerX + 5, centerY - 5);
      
      ctx.restore();
    }
  };

  return (
    <div className="relative">
      <div className="h-96 md:h-[450px]">
        <Scatter 
          ref={chartRef}
          data={data} 
          options={options} 
          plugins={[simpleAxesPlugin]}
        />
      </div>
      
      {sakeData.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
            日本酒一覧
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sakeData.map((sake, index) => {
              const color = getColorByIndex(index, CHART_BORDER_COLORS);
              
              return (
                <div key={sake.id} className="flex items-center bg-white rounded p-2 border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: color }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-800">{sake.name}</div>
                      <div className="text-xs text-gray-600">{sake.brewery}</div>
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