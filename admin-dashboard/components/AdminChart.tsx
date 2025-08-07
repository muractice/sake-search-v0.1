'use client';

import { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

interface AdminSakeData {
  id: number;
  brandId: number;
  name: string;
  breweryName: string;
  prefecture?: string;
  sweetness: number;
  richness: number;
  originalData: {
    f1: number;
    f2: number;
    f3: number;
    f4: number;
    f5: number;
    f6: number;
  };
}

interface AdminChartProps {
  sakeData: AdminSakeData[];
  sweetnessOffset?: number;
  richnessOffset?: number;
}

export default function AdminChart({ 
  sakeData, 
  sweetnessOffset = 0, 
  richnessOffset = 0 
}: AdminChartProps) {
  const chartRef = useRef<ChartJS<'scatter'>>(null);

  // 4象限に分類
  const quadrantData = {
    quadrant1: [], // 甘口・濃醇
    quadrant2: [], // 辛口・濃醇
    quadrant3: [], // 辛口・淡麗
    quadrant4: [], // 甘口・淡麗
  };

  sakeData.forEach((sake) => {
    const adjustedSweetness = sake.sweetness + sweetnessOffset;
    const adjustedRichness = sake.richness + richnessOffset;
    
    const point = {
      x: adjustedSweetness,
      y: adjustedRichness,
      sake: sake
    };

    if (adjustedSweetness > 0 && adjustedRichness > 0) {
      quadrantData.quadrant1.push(point);
    } else if (adjustedSweetness <= 0 && adjustedRichness > 0) {
      quadrantData.quadrant2.push(point);
    } else if (adjustedSweetness <= 0 && adjustedRichness <= 0) {
      quadrantData.quadrant3.push(point);
    } else {
      quadrantData.quadrant4.push(point);
    }
  });

  const data = {
    datasets: [
      {
        label: '甘口・濃醇',
        data: quadrantData.quadrant1,
        backgroundColor: 'rgba(236, 72, 153, 0.6)',
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 1,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: '辛口・濃醇',
        data: quadrantData.quadrant2,
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: '辛口・淡麗',
        data: quadrantData.quadrant3,
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: '甘口・淡麗',
        data: quadrantData.quadrant4,
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const sake = context.raw.sake;
            return [
              sake.name,
              `蔵元: ${sake.breweryName}`,
              sake.prefecture ? `都道府県: ${sake.prefecture}` : '',
              `甘辛: ${sake.sweetness.toFixed(2)}`,
              `淡濃: ${sake.richness.toFixed(2)}`,
              '',
              '元データ:',
              `f1: ${sake.originalData.f1.toFixed(3)}`,
              `f2: ${sake.originalData.f2.toFixed(3)}`,
              `f3: ${sake.originalData.f3.toFixed(3)}`,
              `f4: ${sake.originalData.f4.toFixed(3)}`,
              `f5: ${sake.originalData.f5.toFixed(3)}`,
              `f6: ${sake.originalData.f6.toFixed(3)}`,
            ].filter(Boolean);
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 12,
        },
        padding: 12,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'center' as const,
        min: -3.5,
        max: 3.5,
        title: {
          display: true,
          text: '甘辛度',
          font: {
            size: 14,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          lineWidth: 1,
        },
      },
      y: {
        type: 'linear' as const,
        position: 'center' as const,
        min: -3.5,
        max: 3.5,
        title: {
          display: true,
          text: '淡濃度',
          font: {
            size: 14,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          lineWidth: 1,
        },
      },
    },
  };

  // カスタム背景描画プラグイン
  const backgroundPlugin = {
    id: 'adminBackground',
    beforeDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx;
      const chartArea = chart.chartArea;
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      
      ctx.save();
      
      // 4象限の背景色
      const quadrantColors = [
        { x: centerX, y: chartArea.top, w: chartArea.right - centerX, h: centerY - chartArea.top, color: 'rgba(236, 72, 153, 0.05)' },
        { x: chartArea.left, y: chartArea.top, w: centerX - chartArea.left, h: centerY - chartArea.top, color: 'rgba(239, 68, 68, 0.05)' },
        { x: chartArea.left, y: centerY, w: centerX - chartArea.left, h: chartArea.bottom - centerY, color: 'rgba(34, 197, 94, 0.05)' },
        { x: centerX, y: centerY, w: chartArea.right - centerX, h: chartArea.bottom - centerY, color: 'rgba(99, 102, 241, 0.05)' }
      ];
      
      quadrantColors.forEach(quad => {
        ctx.fillStyle = quad.color;
        ctx.fillRect(quad.x, quad.y, quad.w, quad.h);
      });
      
      // 軸線を強調
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2;
      
      // X軸
      ctx.beginPath();
      ctx.moveTo(chartArea.left, centerY);
      ctx.lineTo(chartArea.right, centerY);
      ctx.stroke();
      
      // Y軸
      ctx.beginPath();
      ctx.moveTo(centerX, chartArea.top);
      ctx.lineTo(centerX, chartArea.bottom);
      ctx.stroke();
      
      // ラベル
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillStyle = '#ef4444';
      ctx.fillText('辛口', chartArea.left + 40, centerY - 20);
      ctx.fillStyle = '#ec4899';
      ctx.fillText('甘口', chartArea.right - 40, centerY - 20);
      
      ctx.fillStyle = '#22c55e';
      ctx.fillText('濃醇', centerX + 30, chartArea.top + 20);
      ctx.fillStyle = '#3b82f6';
      ctx.fillText('淡麗', centerX + 30, chartArea.bottom - 20);
      
      ctx.restore();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        4象限分布チャート
      </h2>
      <div className="h-[600px]">
        <Scatter 
          ref={chartRef}
          data={data} 
          options={options}
          plugins={[backgroundPlugin]}
        />
      </div>
      
      {/* 象限別の件数表示 */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-pink-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-pink-800">甘口・濃醇</h3>
          <p className="text-2xl font-bold text-pink-900">{quadrantData.quadrant1.length}件</p>
          <p className="text-xs text-pink-600 mt-1">
            {((quadrantData.quadrant1.length / sakeData.length) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800">辛口・濃醇</h3>
          <p className="text-2xl font-bold text-red-900">{quadrantData.quadrant2.length}件</p>
          <p className="text-xs text-red-600 mt-1">
            {((quadrantData.quadrant2.length / sakeData.length) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-800">辛口・淡麗</h3>
          <p className="text-2xl font-bold text-green-900">{quadrantData.quadrant3.length}件</p>
          <p className="text-xs text-green-600 mt-1">
            {((quadrantData.quadrant3.length / sakeData.length) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-indigo-800">甘口・淡麗</h3>
          <p className="text-2xl font-bold text-indigo-900">{quadrantData.quadrant4.length}件</p>
          <p className="text-xs text-indigo-600 mt-1">
            {((quadrantData.quadrant4.length / sakeData.length) * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}