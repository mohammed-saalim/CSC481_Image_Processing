import React, { useState } from 'react';
import { Button, Box, Typography } from '@mui/material';
import PreprocessingControls from '../components/PreprocessingControls';
import { applyCustomPreprocessing, extractText } from '../services/api';
import { Link } from 'react-router-dom';

function CustomPreprocessingPage({ image }) {
  const [processedImage, setProcessedImage] = useState(null);
  const [preprocessingError, setPreprocessingError] = useState('');
  const [extractedText, setExtractedText] = useState(''); 

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

  const handleExtractText = () => {
    if (processedImage) {
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
          const file = new File([blob], 'processed_image.png', { type: blob.type });
          const formData = new FormData();
          formData.append('file', file);
  
          // Debugging output
          console.log('Sending FormData to backend:', formData);
  
          // Send the FormData to the backend
          extractText(formData)
            .then(response => {
              console.log('Text extraction response:', response.data);
              setExtractedText(response.data.extracted_text);
            })
            .catch(error => {
              console.error('Error during text extraction:', error);
              setExtractedText('Failed to extract text.');
            });
        })
        .catch(error => {
          console.error('Error converting processed image to Blob:', error);
        });
    } else {
      alert('No processed image available for text extraction');
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
            <img
              src={URL.createObjectURL(image)}
              alt="Original"
              width="100%"
              style={{ marginBottom: '1rem' }}
            />
            {processedImage ? (
              <>
                <Typography variant="h5" gutterBottom>
                  Processed Image
                </Typography>
                <img src={processedImage} alt="Processed" width="100%" />

                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleExtractText}
                  sx={{ marginTop: 2 }}
                >
                  Extract Text from Processed Image
                </Button>

              </>
            ) : preprocessingError ? (
              <Typography color="error">{preprocessingError}</Typography>
            ) : (
              <Typography variant="body2">
                Click "Apply Preprocessing" to see the result.
              </Typography>
            )}
             {extractedText && (
              <Box sx={{ marginTop: 2 }}>
                <Typography variant="h6">Extracted Text:</Typography>
                <Typography variant="body1">{extractedText}</Typography>
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
