'use client';

import ScanCameraCapture from './ScanCameraCapture';
import ScanImagePreview from './ScanImagePreview';
import ScanResultsList from './ScanResultsList';
import { useScanImageProcessing } from '@/hooks/scan/useScanImageProcessing';
import { useScanOCR } from '@/hooks/scan/useScanOCR';
import { useScanSakeExtraction } from '@/hooks/scan/useScanSakeExtraction';

interface MenuScannerMainProps {
  onSakeFound: (sakeName: string) => Promise<{success: boolean, message: string}>;
  onMultipleSakeFound?: (sakeNames: string[], updateStatus?: (statusMap: Map<string, {status: 'pending' | 'added' | 'not_found' | 'limit_exceeded', message?: string}>) => void) => void;
  onRemoveFromComparison?: (sakeName: string) => Promise<{success: boolean, message: string}>;
  onIndividualAdd?: (sakeName: string) => Promise<{success: boolean, message: string}>;
  onIndividualRemove?: (sakeName: string) => Promise<{success: boolean, message: string}>;
  onClose: () => void;
}

export default function MenuScannerMain({ 
  onSakeFound, 
  onMultipleSakeFound, 
  onRemoveFromComparison, 
  onIndividualAdd,
  onIndividualRemove,
  onClose 
}: MenuScannerMainProps) {
  const {
    image,
    isCameraActive,
    handleImageCaptured,
    handleCameraStart,
    handleCameraStop,
    handleFileSelect,
    resetImage
  } = useScanImageProcessing();

  const {
    isProcessing,
    processingStatus,
    extractedText,
    foundSakeNames,
    processImage,
    resetOCR,
    setFoundSakeNames
  } = useScanOCR();

  const {
    sakeStatus,
    removeSakeStatus,
    setSakeStatus
  } = useScanSakeExtraction();

  const handleReset = () => {
    resetImage();
    resetOCR();
  };

  const handleRemoveSake = (index: number, name: string) => {
    setFoundSakeNames(prev => prev.filter((_, i) => i !== index));
    removeSakeStatus(name);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">メニュースキャン</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {!isCameraActive && !image && (
            <ScanCameraCapture
              isCameraActive={isCameraActive}
              onImageCaptured={handleImageCaptured}
              onCameraStop={handleCameraStop}
              onCameraStart={handleCameraStart}
              onFileSelect={handleFileSelect}
            />
          )}

          {isCameraActive && (
            <ScanCameraCapture
              isCameraActive={isCameraActive}
              onImageCaptured={handleImageCaptured}
              onCameraStop={handleCameraStop}
              onCameraStart={handleCameraStart}
              onFileSelect={handleFileSelect}
            />
          )}

          {image && !isCameraActive && (
            <>
              <ScanImagePreview
                image={image}
                isProcessing={isProcessing}
                processingStatus={processingStatus}
                extractedText={extractedText}
                foundSakeNames={foundSakeNames}
                onProcessImage={() => processImage(image)}
                onReset={handleReset}
              />

              {foundSakeNames.length > 0 && (
                <ScanResultsList
                  foundSakeNames={foundSakeNames}
                  sakeStatus={sakeStatus}
                  onSakeFound={onSakeFound}
                  onMultipleSakeFound={onMultipleSakeFound}
                  onRemoveFromComparison={onRemoveFromComparison}
                  onIndividualAdd={onIndividualAdd}
                  onIndividualRemove={onIndividualRemove}
                  onRemoveSake={handleRemoveSake}
                  setSakeStatus={setSakeStatus}
                />
              )}
            </>
          )}
          
          {(foundSakeNames.length > 0 || extractedText) && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                📊 チャートに戻る
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}