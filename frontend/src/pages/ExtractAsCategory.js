import React, { useState } from 'react';
import { Button, Box, Typography, Select, MenuItem, Modal } from '@mui/material';
import { applyCategoryPreprocessing, extractTextPreprocessed } from '../services/api';

function ExtractAsCategoryPage({ image }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [processedImage, setProcessedImage] = useState(null);
  const [originalText, setOriginalText] = useState('');
  const [preprocessedText, setPreprocessedText] = useState('');
  const [qualitativeFeedback, setQualitativeFeedback] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleApplyPreprocessing = () => {
    if (image && selectedCategory) {
      const formData = new FormData();
      formData.append('file', image);

      applyCategoryPreprocessing(formData, selectedCategory)
        .then((response) => {
          const imageUrl = URL.createObjectURL(response.data);
          setProcessedImage(imageUrl);
          alert(`Preprocessing for ${selectedCategory} applied`);
        })
        .catch((error) => {
          console.error(`Error during preprocessing for ${selectedCategory}:`, error);
          setProcessedImage(null);
        });
    } else {
      alert('Please select a category and upload an image');
    }
  };

  const handleExtractTextFromProcessed = () => {
    if (image && processedImage) {
      const formData = new FormData();
      formData.append('original_image', image);

      fetch(processedImage)
        .then(response => response.blob())
        .then(blob => {
          const processedFile = new File([blob], 'processed_image.png', { type: blob.type });
          formData.append('preprocessed_image', processedFile);

          return extractTextPreprocessed(formData);
        })
        .then((response) => {
          setOriginalText(response.data.original_text || 'No text extracted from original image');
          setPreprocessedText(response.data.preprocessed_text || 'No text extracted from preprocessed image');
          setQualitativeFeedback(response.data.qualitative_feedback || 'No feedback available');
        })
        .catch((error) => console.error('Error during text extraction from processed image:', error));
    } else {
      alert('Ensure both original and processed images are available for extraction');
    }
  };

  const handleImageClick = (src) => {
    setModalImageSrc(src);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 3,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Extract Text Based on Category
      </Typography>
      {image ? (
        <>
          <Typography variant="h6">Select Preprocessing Category:</Typography>
          <Select
            value={selectedCategory}
            onChange={handleCategoryChange}
            displayEmpty
            sx={{ marginBottom: 2, minWidth: 200 }}
          >
            <MenuItem value="" disabled>
              Select Category
            </MenuItem>
            <MenuItem value="license-plate">License Plate</MenuItem>
            <MenuItem value="dark-background">Dark Background</MenuItem>
            <MenuItem value="far-away-text">Far Away Text</MenuItem>
            <MenuItem value="table-image">Tables</MenuItem>
            <MenuItem value="pill-bottle">Pill Bottle</MenuItem>
            <MenuItem value="id-card">ID Card</MenuItem>
          </Select>

          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyPreprocessing}
            sx={{ marginBottom: 3 }}
          >
            Apply Preprocessing
          </Button>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 2,
              width: '100%',
              maxWidth: '800px',
              margin: 'auto',
              marginTop: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" align="center">Original Image</Typography>
              <img
                src={URL.createObjectURL(image)}
                alt="Original"
                style={{ maxWidth: '100%', cursor: 'pointer' }}
                onClick={() => handleImageClick(URL.createObjectURL(image))}
              />
            </Box>

            {processedImage && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" align="center">Processed Image</Typography>
                <img
                  src={processedImage}
                  alt="Processed"
                  style={{ maxWidth: '100%', cursor: 'pointer' }}
                  onClick={() => handleImageClick(processedImage)}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleExtractTextFromProcessed}
                  sx={{ marginTop: 2 }}
                >
                  Extract Text from Processed Image
                </Button>
              </Box>
            )}
          </Box>

          {originalText && (
            <Box sx={{ marginTop: 3 }}>
              <Typography variant="h6">Extracted Text from Original Image:</Typography>
              <Typography variant="body1">{originalText}</Typography>
            </Box>
          )}

          {preprocessedText && (
            <Box sx={{ marginTop: 3 }}>
              <Typography variant="h6">Text Extracted from Preprocessed Image:</Typography>
              <Typography variant="body1">{preprocessedText}</Typography>
            </Box>
          )}

          {qualitativeFeedback && (
            <Box sx={{ marginTop: 3 }}>
              <Typography variant="h6">Qualitative Feedback on Preprocessing Impact:</Typography>
              <Typography variant="body1">{qualitativeFeedback}</Typography>
            </Box>
          )}

          {/* Modal for image pop-out */}
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
              <img src={modalImageSrc} alt="Enlarged" style={{ width: '100%', height: 'auto' }} />
            </Box>
          </Modal>
        </>
      ) : (
        <Typography>No image selected. Please upload an image.</Typography>
      )}
    </Box>
  );
}

export default ExtractAsCategoryPage;
