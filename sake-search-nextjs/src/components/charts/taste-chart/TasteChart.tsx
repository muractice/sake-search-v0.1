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
import { customAxesPlugin } from './plugins/customAxesPlugin';
import { CHART_CONFIG, CHART_COLORS } from './constants';
import {
  createChartDataset,
  createTooltipCallbacks,
  createDataLabelsConfig,
  debugSakeData
} from './utils/chartUtils';

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

export default function TasteChart({ sakeData, onSakeClick }: TasteChartProps) {
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
        min: -3,
        max: 3,
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
        <div className="mt-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></span>
            日本酒一覧
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {validSakeData.map((sake, index) => (
              <button
                key={sake.id}
                onClick={() => onSakeClick(sake)}
                className="w-full text-left p-3 rounded-lg border border-purple-200/50 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 flex items-center space-x-3 bg-white/60 backdrop-blur-sm"
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                  style={{ backgroundColor: CHART_COLORS.solidColors[index % CHART_COLORS.solidColors.length] }}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{sake.name}</div>
                  <div className="text-sm text-gray-600">{sake.brewery}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    甘辛: {sake.sweetness > 0 ? '甘' : '辛'} ({sake.sweetness.toFixed(1)}) | 
                    淡濃: {sake.richness > 0 ? '濃醇' : '淡麗'} ({sake.richness.toFixed(1)})
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}