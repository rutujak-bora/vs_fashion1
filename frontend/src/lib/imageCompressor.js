/**
 * Client-Side HTML5 Canvas Image Compressor for VS Fashion
 * Reduces product image file size drastically while preserving crisp visual quality.
 */

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const compressImageWithCanvas = (file, options = {}) => {
  return new Promise((resolve) => {
    const {
      targetMaxBytes = 2.5 * 1024 * 1024, // 2.5 MB target
      maxDimension = 2200,                // Max px width or height
      initialQuality = 0.90,              // High quality starting point
      minQuality = 0.55                   // Quality floor to avoid blur
    } = options;

    const originalSize = file.size;

    // If file is not an image, return original
    if (!file.type.startsWith('image/')) {
      resolve({
        file,
        originalSize,
        compressedSize: originalSize,
        percentSaved: 0,
        previewUrl: URL.createObjectURL(file),
        wasCompressed: false
      });
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // 1. Proportional downscale if dimensions exceed maxDimension
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // 2. Iterative canvas drawing and quality compression
      const tryCompress = (w, h, quality) => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // High quality bicubic resampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw white background in case of transparent PNG/WebP
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              const fallbackUrl = URL.createObjectURL(file);
              resolve({
                file,
                originalSize,
                compressedSize: originalSize,
                percentSaved: 0,
                previewUrl: fallbackUrl,
                wasCompressed: false
              });
              return;
            }

            // If size is under target or we hit quality floor, finalize
            if (blob.size <= targetMaxBytes || quality <= minQuality) {
              const safeName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
              const compressedFile = new File([blob], safeName, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              const compressedSize = blob.size;
              const percentSaved = originalSize > compressedSize
                ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
                : 0;

              const previewUrl = URL.createObjectURL(blob);

              resolve({
                file: compressedFile,
                originalSize,
                compressedSize,
                percentSaved,
                previewUrl,
                width: w,
                height: h,
                wasCompressed: originalSize !== compressedSize
              });
            } else if (quality > 0.65) {
              // Iteratively step down quality
              tryCompress(w, h, parseFloat((quality - 0.06).toFixed(2)));
            } else {
              // Quality floor reached: downscale dimensions slightly (15%) and retry
              const nextW = Math.round(w * 0.85);
              const nextH = Math.round(h * 0.85);
              if (nextW < 500 || nextH < 500) {
                // Too small, keep current
                const safeName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
                const compressedFile = new File([blob], safeName, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                const compressedSize = blob.size;
                const percentSaved = originalSize > compressedSize
                  ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
                  : 0;
                resolve({
                  file: compressedFile,
                  originalSize,
                  compressedSize,
                  percentSaved,
                  previewUrl: URL.createObjectURL(blob),
                  width: w,
                  height: h,
                  wasCompressed: true
                });
              } else {
                tryCompress(nextW, nextH, 0.78);
              }
            }
          },
          'image/jpeg',
          quality
        );
      };

      tryCompress(width, height, initialQuality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        file,
        originalSize,
        compressedSize: originalSize,
        percentSaved: 0,
        previewUrl: URL.createObjectURL(file),
        wasCompressed: false
      });
    };

    img.src = objectUrl;
  });
};
