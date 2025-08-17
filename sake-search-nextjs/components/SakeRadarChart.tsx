'use client';

import { useRef } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { SakeData } from '@/types/sake';
import { CHART_COLORS, CHART_BORDER_COLORS, getColorByIndex } from '@/utils/chartColors';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface SakeRadarChartProps {
  sake: SakeData;
  index: number;
}

export default function SakeRadarChart({ sake, index }: SakeRadarChartProps) {
  const chartRef = useRef<ChartJS<'radar'>>(null);

  // flavorChartがない場合はチャートを表示しない
  if (!sake.flavorChart) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <h3 className="font-bold text-gray-800 mb-1">{sake.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{sake.brewery}</p>
        <p className="text-gray-500 text-sm">味覚データがありません</p>
      </div>
    );
  }

  const { f1, f2, f3, f4, f5, f6 } = sake.flavorChart;

  const data = {
    labels: [
      '華やか度',
      '芳醇度',
      '重厚度',
      '穏やか度',
      'ドライ度',
      '軽快度',
    ],
    datasets: [
      {
        label: sake.name,
        data: [
          f1 * 100, // 0-1を0-100%に変換
          f2 * 100,
          f3 * 100,
          f4 * 100,
          f5 * 100,
          f6 * 100,
        ],
        backgroundColor: getColorByIndex(index, CHART_COLORS).replace('0.8', '0.3'), // 透明度を調整
        borderColor: getColorByIndex(index, CHART_BORDER_COLORS),
        borderWidth: 2,
        pointBackgroundColor: getColorByIndex(index, CHART_BORDER_COLORS),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: getColorByIndex(index, CHART_BORDER_COLORS),
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false, // データラベルを完全に無効化
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: { raw: number }) {
            return `${context.raw.toFixed(1)}%`;
          },
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 12,
        },
        bodyFont: {
          size: 11,
        },
        padding: 8,
        cornerRadius: 4,
      },
    },
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          circular: true,
        },
        pointLabels: {
          font: {
            size: 11,
            weight: 'bold' as const,
          },
          color: '#4b5563',
          padding: 10,
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
          display: false, // 完全に数値を非表示
          showLabelBackdrop: false,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-center mb-3">
        <h3 className="font-bold text-gray-800 text-sm">{sake.name}</h3>
        <p className="text-xs text-gray-600">{sake.brewery}</p>
      </div>
      <div className="h-48">
        <Radar ref={chartRef} data={data} options={options} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1 text-xs">
        <div className="text-gray-600">
          <span className="inline-block w-16">華やか:</span>
          <span className="font-medium">{(f1 * 100).toFixed(0)}%</span>
        </div>
        <div className="text-gray-600">
          <span className="inline-block w-16">芳醇:</span>
          <span className="font-medium">{(f2 * 100).toFixed(0)}%</span>
        </div>
        <div className="text-gray-600">
          <span className="inline-block w-16">重厚:</span>
          <span className="font-medium">{(f3 * 100).toFixed(0)}%</span>
        </div>
        <div className="text-gray-600">
          <span className="inline-block w-16">穏やか:</span>
          <span className="font-medium">{(f4 * 100).toFixed(0)}%</span>
        </div>
        <div className="text-gray-600">
          <span className="inline-block w-16">ドライ:</span>
          <span className="font-medium">{(f5 * 100).toFixed(0)}%</span>
        </div>
        <div className="text-gray-600">
          <span className="inline-block w-16">軽快:</span>
          <span className="font-medium">{(f6 * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}