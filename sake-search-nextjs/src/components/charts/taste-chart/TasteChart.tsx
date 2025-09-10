'use client';

import { useRef, useState, useEffect } from 'react';
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
import { SakeList } from './components/SakeList';
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
  onRemoveSake?: (sake: SakeData) => void;
}

export default function TasteChart({ sakeData, onSakeClick, onRemoveSake }: TasteChartProps) {
  const chartRef = useRef<ChartJS<'scatter'>>(null);
  const [localSakeData, setLocalSakeData] = useState(sakeData);

  // sakeDataが変更されたら更新
  useEffect(() => {
    console.log('🔍 sakeData changed, length:', sakeData.length);
    console.log('🔍 Previous localSakeData length:', localSakeData.length);
    setLocalSakeData(sakeData);
  }, [sakeData]);

  // デバッグ: ブラウザのコンソールでwindow.debugSakeDataで確認可能にする
  debugSakeData(localSakeData);
  
  // 検証を一時的に無効化 - すべてのデータを表示
  const validSakeData = localSakeData;

  // ローカル削除ハンドラー
  const handleRemoveSake = (sake: SakeData) => {
    console.log('🔍 handleRemoveSake called:', sake.name);
    console.log('🔍 onRemoveSake exists:', !!onRemoveSake);
    console.log('🔍 Current localSakeData length:', localSakeData.length);
    
    if (onRemoveSake) {
      console.log('🔍 Calling onRemoveSake');
      onRemoveSake(sake);
      // 親から削除されるので、ローカルでも削除
      setLocalSakeData(prev => {
        const filtered = prev.filter(s => s.id !== sake.id);
        console.log('🔍 Local data after removal:', filtered.length);
        return filtered;
      });
    } else {
      // onRemoveSakeが提供されていない場合はローカルで削除
      console.log('🔍 Removing locally only');
      setLocalSakeData(prev => prev.filter(s => s.id !== sake.id));
    }
  };

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
          <SakeList
            sakeData={validSakeData}
            onSakeClick={onSakeClick}
            onRemove={handleRemoveSake}
            showRemoveButton={true}
            showDescription={true}
            showActions={true}
            recordButtonLabel="飲んだ"
          />
        </div>
      )}
    </div>
  );
}