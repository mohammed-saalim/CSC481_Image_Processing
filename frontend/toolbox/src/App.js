import React, { useState } from 'react';
import { Container, Typography, Button, Card, CardContent, Box } from '@mui/material';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'; // Updated import
import UploadImage from './components/UploadImage';
import ImagePreview from './components/ImagePreview';
import ExtractedText from './components/ExtractedText';
import CustomPreprocessingPage from './pages/CustomPreprocessingPage'; // New component for custom preprocessing
import { preprocessImage, extractText } from './services/api';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preprocessedImage, setPreprocessedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');

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
  
  

  return (
    <Router>
  <Container maxWidth="md" style={{ marginTop: '2rem' }}>
    <Typography variant="h1" align="center">CSC481 Image Processing</Typography>
    <Typography variant="body1" align="center" gutterBottom>
      A tool to preprocess and extract text from images using advanced image processing techniques.
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
            <ImagePreview image={selectedImage} title="Original Image" />
            {preprocessedImage && <ImagePreview image={preprocessedImage} title="Preprocessed Image" />}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: '1rem' }}>
              {selectedImage && (
                <Button
                  variant="contained"
                  color="primary" // Use primary color
                  onClick={handlePreprocess}
                  style={{ marginRight: '0.5rem' }}
                >
                  Preprocess Image
                </Button>
              )}
              {selectedImage && (
                <Button
                  variant="contained"
                  color="primary" // Use primary color
                  component={Link}
                  to="/custom-preprocessing"
                  style={{ marginRight: '0.5rem' }}
                >
                  Custom Preprocessing
                </Button>
              )}
              {selectedImage && (
                <Button
                  variant="contained"
                  color="secondary" // Use secondary color for Extract Text
                  onClick={handleExtractText}
                >
                  Extract Text
                </Button>
              )}
            </Box>
            <ExtractedText text="The text extracted from the image is: **BJ5**" />
          </>
        } 
      />
      <Route path="/custom-preprocessing" element={<CustomPreprocessingPage image={selectedImage} />} />
    </Routes>
  </Container>
</Router>


  );
}

export default App;
