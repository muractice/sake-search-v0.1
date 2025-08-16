export interface ImageOptimizationOptions {
  maxDimension?: number;
  outputFormat?: 'png' | 'jpeg';
  quality?: number;
  applyEnhancement?: boolean;
}

export async function optimizeImageForScan(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      const originalWidth = img.width;
      const originalHeight = img.height;
      const maxDimension = Math.max(originalWidth, originalHeight);
      
      const isLargeImage = maxDimension > 1400;
      
      let width = originalWidth;
      let height = originalHeight;
      let outputFormat: 'png' | 'jpeg' = 'png';
      let quality = 1.0;
      let applyEnhancement = true;

      if (isLargeImage) {
        const maxSize = 800;
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        outputFormat = 'jpeg';
        quality = 0.7;
        applyEnhancement = false;
        console.log(`Large image detected (${maxDimension}px), using compressed mode`);
      } else {
        const maxSize = 1200;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        console.log(`Small image detected (${maxDimension}px), using high quality mode`);
      }

      canvas.width = width;
      canvas.height = height;
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      if (applyEnhancement) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const enhanced = brightness > 128 ? Math.min(255, brightness * 1.15) : Math.max(0, brightness * 0.85);
          
          data[i] = enhanced;
          data[i + 1] = enhanced;
          data[i + 2] = enhanced;
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
      
      const result = outputFormat === 'png' 
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', quality);
      
      const sizeKB = Math.round(result.length * 0.75 / 1024);
      const sizeMB = (sizeKB / 1024).toFixed(2);
      
      console.log(`Image optimized: ${sizeKB}KB (${sizeMB}MB) - Mode: ${isLargeImage ? 'compressed' : 'high-quality'}`);
      
      if (sizeKB > 4500) {
        console.warn('Image size exceeds 4.5MB limit, may cause issues on Vercel');
      }
      
      resolve(result);
    };
    img.src = imageUrl;
  });
}

export async function preprocessImageForOCR(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      const scale = Math.min(3000 / img.width, 3000 / img.height, 3);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.imageSmoothingEnabled = false;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        const threshold = 140;
        const value = gray > threshold ? 255 : 0;
        
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = imageUrl;
  });
}