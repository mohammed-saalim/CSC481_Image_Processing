import React, { useEffect, useState } from 'react';

function ImagePreview({ image }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (image) {
      const url = typeof image === 'string' ? image : URL.createObjectURL(image);
      setImageUrl(url);

      // Cleanup function to revoke URL
      return () => {
        if (url && typeof image !== 'string') {
          URL.revokeObjectURL(url);
        }
      };
    }
  }, [image]);

  if (!imageUrl) return null;

  return (
    <div>
      <img src={imageUrl} alt="Preview" width="300" />
    </div>
  );
}

export default ImagePreview;
