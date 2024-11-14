import React, { useState } from 'react';
import { Container, Typography, Button, Card, CardContent, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import UploadImage from './components/UploadImage';
import ImagePreview from './components/ImagePreview';
import ExtractedText from './components/ExtractedText';
import CustomPreprocessingPage from './pages/CustomPreprocessingPage';
import ExtractAsCategoryPage from './pages/ExtractAsCategory';
import { preprocessImage, extractText, extractTextPreprocessed } from './services/api';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preprocessedImage, setPreprocessedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [preprocessedText, setPreprocessedText] = useState('');
  const [qualitativeFeedback, setQualitativeFeedback] = useState('');

  const handleImageUpload = (file) => {
    setSelectedImage(file);
  };

  const handlePreprocess = () => {
    if (selectedImage) {
      preprocessImage(selectedImage)
        .then((response) => {
          const imageUrl = URL.createObjectURL(response.data);
          setPreprocessedImage(imageUrl);
          alert('Preprocessing Applied');
        })
        .catch((error) => {
          console.error('Error during preprocessing:', error);
        });
    } else {
      alert('No image selected for preprocessing');
    }
  };

  const handleExtractText = () => {
    if (selectedImage) {
      extractText(selectedImage)
        .then((response) => setExtractedText(response.data.extracted_text))
        .catch((error) => console.error('Error:', error));
    } else {
      alert('No image selected for text extraction');
    }
  };

  const handleExtractPreprocessedText = () => {
    if (selectedImage && preprocessedImage) {
      const formData = new FormData();
      formData.append('original_image', selectedImage);

      fetch(preprocessedImage)
        .then(response => response.blob())
        .then(blob => {
          const processedFile = new File([blob], 'processed_image.png', { type: blob.type });
          formData.append('preprocessed_image', processedFile);

          return extractTextPreprocessed(formData);
        })
        .then((response) => {
          console.log('Extract preprocessed text response:', response.data);
          setExtractedText(response.data.original_text || 'No text extracted from original image');
          setPreprocessedText(response.data.preprocessed_text || 'No text extracted from preprocessed image');
          setQualitativeFeedback(response.data.qualitative_feedback || 'No feedback available');
        })
        .catch((error) => console.error('Error during preprocessed text extraction:', error));
    } else {
      alert('No preprocessed image available for text extraction');
    }
  };

  return (
    <Router>
      <Container
        maxWidth="md"
        sx={{
          marginTop: '2rem',
          padding: '2rem',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px'
        }}
      >
        <Typography
          variant="h3"
          align="center"
          component={RouterLink}
          to="/"
          sx={{
            textDecoration: 'none',
            color: 'primary.main',
            cursor: 'pointer',
            marginBottom: '1rem',
          }}
        >
          CSC481 Image Processing
        </Typography>

        <Routes>
          <Route
            path="/"
            element={
              <>
                <Card style={{ marginBottom: '1rem' }}>
                  <CardContent>
                    <UploadImage onImageUpload={handleImageUpload} />
                  </CardContent>
                </Card>
                {selectedImage && <ImagePreview image={selectedImage} />}
                {preprocessedImage && <ImagePreview image={preprocessedImage} />}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: '1rem' }}>
                  {selectedImage && (
                    <Button variant="contained" color="primary" onClick={handlePreprocess}>
                      Preprocess Image
                    </Button>
                  )}
                  {selectedImage && (
                    <Button variant="contained" color="primary" component={Link} to="/custom-preprocessing">
                      Custom Preprocessing
                    </Button>
                  )}
                  {selectedImage && (
                    <Button variant="contained" color="secondary" onClick={handleExtractText}>
                      Extract Text
                    </Button>
                  )}
                  {selectedImage && preprocessedImage && (
                    <Button variant="contained" color="secondary" onClick={handleExtractPreprocessedText}>
                      Extract Preprocessed Text
                    </Button>
                  )}
                  {selectedImage && (
                    <Button variant="contained" color="primary" component={Link} to="/extract-as-category">
                      Extract Based on Category
                    </Button>
                  )}
                </Box>
                <ExtractedText text={extractedText} />
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
            }
          />
          <Route path="/custom-preprocessing" element={<CustomPreprocessingPage image={selectedImage} />} />
          <Route path="/extract-as-category" element={<ExtractAsCategoryPage image={selectedImage} />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
