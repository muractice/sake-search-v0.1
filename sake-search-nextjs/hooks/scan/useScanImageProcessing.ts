import { useState } from 'react';

export function useScanImageProcessing() {
  const [image, setImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleImageCaptured = (capturedImage: string) => {
    setImage(capturedImage);
  };

  const handleCameraStart = () => {
    setIsCameraActive(true);
  };

  const handleCameraStop = () => {
    setIsCameraActive(false);
  };

  const handleFileSelect = (selectedImage: string) => {
    setImage(selectedImage);
  };

  const resetImage = () => {
    setImage(null);
    setIsCameraActive(false);
  };

  return {
    image,
    isCameraActive,
    handleImageCaptured,
    handleCameraStart,
    handleCameraStop,
    handleFileSelect,
    resetImage,
    setImage
  };
}