'use client';

import { useRef } from 'react';
import { optimizeImageForScan } from '@/lib/scanImageOptimizer';

interface ScanCameraCaptureProps {
  isCameraActive: boolean;
  onImageCaptured: (image: string) => void;
  onCameraStop: () => void;
  onCameraStart: () => void;
  onFileSelect: (image: string) => void;
}

export default function ScanCameraCapture({
  isCameraActive,
  onImageCaptured,
  onCameraStop,
  onCameraStart,
  onFileSelect
}: ScanCameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        onCameraStart();
      }
    } catch (error) {
      console.error('カメラアクセスエラー:', error);
      alert('カメラにアクセスできません');
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataURL = canvasRef.current.toDataURL('image/jpeg', 0.8);
        const optimized = await optimizeImageForScan(dataURL);
        onImageCaptured(optimized);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    onCameraStop();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const optimized = await optimizeImageForScan(dataUrl);
        onFileSelect(optimized);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isCameraActive) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={capturePhoto}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📷 撮影
          </button>
          <button
            onClick={stopCamera}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-center">
        メニューの写真を撮影するか、ギャラリーから画像を選択してください
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={startCamera}
          className="flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          📷 カメラで撮影
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          📁 ギャラリーから選択
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}