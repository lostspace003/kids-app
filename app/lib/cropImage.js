// Turns react-easy-crop's pixel crop into a square PNG Blob via canvas.
export default function getCroppedBlob(imageSrc, cropPixels) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const size = Math.max(1, Math.round(cropPixels.width));
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = Math.max(1, Math.round(cropPixels.height));
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        img,
        cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
        0, 0, canvas.width, canvas.height
      );
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("crop failed"))),
        "image/png",
        0.95
      );
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}
