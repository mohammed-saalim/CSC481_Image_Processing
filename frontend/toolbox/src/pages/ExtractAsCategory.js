import React, { useState } from 'react';
import { Button, Box, Typography, Select, MenuItem } from '@mui/material';
import { applyCategoryPreprocessing, extractTextPreprocessed } from '../services/api';

function ExtractAsCategoryPage({ image }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [processedImage, setProcessedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [comparisonText, setComparisonText] = useState('');

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleApplyPreprocessing = () => {
    if (image && selectedCategory) {
      const formData = new FormData();
      formData.append('file', image);

      applyCategoryPreprocessing(formData, selectedCategory) // Pass selectedCategory as argument
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
        .then((response) => setComparisonText(response.data))
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
            <MenuItem value="tables">Tables</MenuItem>
            <MenuItem value="pill-bottle">Pill Bottle</MenuItem>
            <MenuItem value="ai-preprocessing">AI Preprocessing</MenuItem> {/* New AI Preprocessing category */}
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

          {comparisonText && (
            <Box sx={{ marginTop: 3 }}>
              <Typography variant="h6">Comparison of Original vs Preprocessed Text:</Typography>
              <Typography variant="body1">{comparisonText}</Typography>
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
