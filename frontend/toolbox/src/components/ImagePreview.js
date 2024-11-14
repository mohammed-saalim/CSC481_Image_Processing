import React, { useEffect, useState } from 'react';
import { Modal, Box } from '@mui/material';

function ImagePreview({ image }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [openModal, setOpenModal] = useState(false);

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

  const handleImageClick = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  return (
    <div>
      <img
        src={imageUrl}
        alt="Preview"
        width="300"
        style={{ cursor: 'pointer' }}
        onClick={handleImageClick}
      />
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90vw',
            maxHeight: '90vh',
            outline: 'none',
          }}
        >
          <img src={imageUrl} alt="Enlarged Preview" style={{ width: '100%', height: 'auto' }} />
        </Box>
      </Modal>
    </div>
  );
}

export default ImagePreview;
