import { useState } from 'react';
import { 
  processWithGeminiVision, 
  processWithTesseract,
  extractSakeNames,
  normalizeOCRText,
  OCRResult 
} from '@/lib/scanOCRProviders';

export function useScanOCR() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [foundSakeNames, setFoundSakeNames] = useState<string[]>([]);
  const [useHighPerformanceOCR] = useState(true);

  const processImage = async (image: string) => {
    if (!image) return;

    setIsProcessing(true);
    setProcessingStatus('画像を処理中...');
    setExtractedText('');
    setFoundSakeNames([]);

    try {
      let result: OCRResult;
      
      if (useHighPerformanceOCR) {
        result = await processWithGeminiVision(image, setProcessingStatus);
      } else {
        result = await processWithTesseract(image, setProcessingStatus);
      }

      let text = result.text || '';
      let sakeNames = [];
      
      console.log('=== Final Processing Stage ===');
      console.log('OCR生結果:', text);
      console.log('Text length:', text.length);
      console.log('使用プロバイダー:', result.provider);
      
      if (text && text.length > 0) {
        console.log('Character analysis (first 20 chars):');
        for (let i = 0; i < Math.min(20, text.length); i++) {
          const char = text[i];
          const code = char.charCodeAt(0);
          console.log(`  Position ${i}: "${char}" (Unicode: ${code}, Hex: 0x${code.toString(16)})`);
        }
      }
      
      if (result.error) {
        setExtractedText('');
        setFoundSakeNames([]);
        console.log('OCR処理が全て失敗しました');
        return;
      }
      
      if (result.sake_names && result.sake_names.length > 0) {
        sakeNames = result.sake_names;
        setFoundSakeNames(sakeNames);
        setExtractedText(text);
        
        console.log('AI抽出された日本酒名:', sakeNames);
      } else {
        text = normalizeOCRText(text);
        
        console.log('OCR結果（正規化前）:', result.text);
        console.log('OCR結果（正規化後）:', text);
        
        setExtractedText(text);

        sakeNames = extractSakeNames(text);
        setFoundSakeNames(sakeNames);
      }
    } catch (error) {
      console.error('=== OCR処理エラー Debug ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Full error:', error);
      
      const errorMessage = error instanceof Error ? error.message : '文字認識に失敗しました';
      setProcessingStatus(`❌ ${errorMessage}`);
      
      console.error('About to show alert with message:', errorMessage);
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetOCR = () => {
    setExtractedText('');
    setFoundSakeNames([]);
    setProcessingStatus('');
  };

  return {
    isProcessing,
    processingStatus,
    extractedText,
    foundSakeNames,
    processImage,
    resetOCR,
    setFoundSakeNames
  };
}