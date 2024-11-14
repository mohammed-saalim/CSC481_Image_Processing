import React, { useState } from 'react';
import { Button, Box, Typography } from '@mui/material';
import PreprocessingControls from '../components/PreprocessingControls';
import { applyCustomPreprocessing, extractTextPreprocessed } from '../services/api'; // Use the new function
import { Link } from 'react-router-dom';
import ImagePreview from '../components/ImagePreview'; // Import ImagePreview

function CustomPreprocessingPage({ image }) {
  const [processedImage, setProcessedImage] = useState(null);
  const [preprocessingError, setPreprocessingError] = useState('');
  const [comparisonText, setComparisonText] = useState('');

  const handleCustomPreprocess = (params) => {
    if (image) {
      const formData = new FormData();
      formData.append('file', image); // Ensure `image` is a valid file object

      // Add custom parameters to form data
      if (params && typeof params === 'object') {
        for (const [key, value] of Object.entries(params)) {
          formData.append(key, value);
        }
      }

      applyCustomPreprocessing(formData)
        .then((response) => {
          const imageUrl = URL.createObjectURL(response.data);
          console.log('Processed image URL:', imageUrl); // Log the URL of the processed image
          setProcessedImage(imageUrl);
          setPreprocessingError(''); // Clear any previous errors
          alert('Custom Preprocessing Applied');
        })
        .catch((error) => {
          console.error('Error during custom preprocessing:', error);
          setProcessedImage(null); // Clear any previous processed image
          setPreprocessingError('Custom Preprocessing Failed. Please try again.');
        });
    } else {
      alert('No image selected for preprocessing');
    }
  };

  const handleExtractPreprocessedText = () => {
    if (image && processedImage) {
      // Fetch the processed image from the URL to get the Blob
      fetch(processedImage)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch processed image.');
          }
          return response.blob();
        })
        .then(blob => {
          // Convert the blob to a File object (if necessary)
          const processedFile = new File([blob], 'processed_image.png', { type: blob.type });
          const formData = new FormData();
          formData.append('original_image', image);
          formData.append('preprocessed_image', processedFile);

          // Debugging output
          console.log('Sending FormData with original and processed images to backend:', formData);

          // Send the FormData to the backend
          extractTextPreprocessed(formData)
            .then(response => {
              console.log('Text extraction comparison response:', response.data);
              setComparisonText(response.data);
            })
            .catch(error => {
              console.error('Error during text extraction from original and preprocessed images:', error);
              setComparisonText('Failed to extract comparison text.');
            });
        })
        .catch(error => {
          console.error('Error converting processed image to Blob:', error);
        });
    } else {
      alert('Ensure both original and preprocessed images are available for extraction');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        padding: 2,
      }}
    >
      <Box
        sx={{
          flex: 1,
          paddingRight: 5,
          borderRight: '1px solid #ccc',
          maxWidth: '280px',
          marginRight: 2
        }}
      >
        <PreprocessingControls onPreprocess={handleCustomPreprocess} />
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/"
          sx={{ marginTop: 2 }}
        >
          Back to Main Page
        </Button>
      </Box>
      <Box
        sx={{
          flex: 2,
          paddingLeft: 3,
          marginLeft: 2,
        }}
      >
        {image ? (
          <div>
            <Typography variant="h5" gutterBottom>
              Original Image
            </Typography>
            <ImagePreview image={image} /> {/* Use ImagePreview for the original image */}
            {processedImage ? (
              <>
                <Typography variant="h5" gutterBottom>
                  Processed Image
                </Typography>
                <ImagePreview image={processedImage} /> {/* Use ImagePreview for the processed image */}

                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleExtractPreprocessedText}
                  sx={{ marginTop: 2 }}
                >
                  Extract Text from Original and Processed Images
                </Button>

              </>
            ) : preprocessingError ? (
              <Typography color="error">{preprocessingError}</Typography>
            ) : (
              <Typography variant="body2">
                Click "Apply Preprocessing" to see the result.
              </Typography>
            )}
            {comparisonText && (
              <Box sx={{ marginTop: 2 }}>
                <Typography variant="h6">Preprocessed vs Original Text Comparison:</Typography>
                <Typography variant="body1">{JSON.stringify(comparisonText, null, 2)}</Typography>
              </Box>
            )}
          </div>
        ) : (
          <Typography>No image selected for preprocessing.</Typography>
        )}
      </Box>
    </Box>
  );
}

export default CustomPreprocessingPage;
