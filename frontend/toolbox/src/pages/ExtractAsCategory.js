import React, { useState } from 'react';
import { Button, Box, Typography, Select, MenuItem } from '@mui/material';
import { applyCategoryPreprocessing, extractTextPreprocessed } from '../services/api';

function ExtractAsCategoryPage({ image }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [processedImage, setProcessedImage] = useState(null);
  const [originalText, setOriginalText] = useState('');
  const [preprocessedText, setPreprocessedText] = useState('');
  const [qualitativeFeedback, setQualitativeFeedback] = useState('');

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
          // Parse response and set state for original text, preprocessed text, and feedback
          setOriginalText(response.data.original_text || 'No text extracted from original image');
          setPreprocessedText(response.data.preprocessed_text || 'No text extracted from preprocessed image');
          setQualitativeFeedback(response.data.qualitative_feedback || 'No feedback available');
        })
        .catch((error) => console.error('Error during text extraction from processed image:', error));
    } else {
      alert('Ensure both original and processed images are available for extraction');
    }
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
          </Select>

          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyPreprocessing}
            sx={{ marginBottom: 3 }}
          >
            Apply Preprocessing
          </Button>

          <img src={URL.createObjectURL(image)} alt="Original" width="100%" style={{ marginBottom: '1rem' }} />

          {processedImage && (
            <>
              <Typography variant="h5">Processed Image</Typography>
              <img src={processedImage} alt="Processed" width="100%" />
              <Button
                variant="contained"
                color="secondary"
                onClick={handleExtractTextFromProcessed}
                sx={{ marginTop: 3 }}
              >
                Extract Text from Processed Image
              </Button>
            </>
          )}

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
        </>
      ) : (
        <Typography>No image selected. Please upload an image.</Typography>
      )}
    </Box>
  );
}

export default ExtractAsCategoryPage;
