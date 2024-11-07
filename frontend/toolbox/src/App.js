import React, { useState } from 'react';
import { Container, Typography, Button, Card, CardContent } from '@mui/material';
import UploadImage from './components/UploadImage';
import ImagePreview from './components/ImagePreview';
import PreprocessingControls from './components/PreprocessingControls';
import ExtractedText from './components/ExtractedText';
import { preprocessImage, applyCustomPreprocessing, extractText } from './services/api';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preprocessedImage, setPreprocessedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [showCustomControls, setShowCustomControls] = useState(false);

  const handleImageUpload = (file) => {
    setSelectedImage(file);
  };

  const handlePreprocess = () => {
    if (selectedImage) {
      preprocessImage(selectedImage)
        .then((response) => {
          // Create a URL for the returned image blob
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

  const handleCustomPreprocess = (params) => {
    applyCustomPreprocessing(params)
      .then(() => alert('Custom Preprocessing Applied'))
      .catch((error) => console.error('Error:', error));
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
    <Container maxWidth="md" style={{ marginTop: '2rem' }}>
      <Typography variant="h1" align="center">CSC481 Image Processing</Typography>
      <Typography variant="body1" align="center" gutterBottom>
        A tool to preprocess and extract text from images using advanced image processing techniques.
      </Typography>
      <Card style={{ marginBottom: '1rem' }}>
        <CardContent>
          <UploadImage onImageUpload={handleImageUpload} />
        </CardContent>
      </Card>
      <ImagePreview image={selectedImage} title="Original Image" />
      {preprocessedImage && <ImagePreview image={preprocessedImage} title="Preprocessed Image" />}
      {selectedImage && (
        <Button
          variant="contained"
          color="secondary"
          onClick={handlePreprocess}
          style={{ marginTop: '1rem', marginRight: '1rem' }}
        >
          Preprocess Image
        </Button>
      )}
      {selectedImage && (
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowCustomControls(true)}
          style={{ marginTop: '1rem' }}
        >
          Custom Preprocessing
        </Button>
      )}
      {showCustomControls && (
        <PreprocessingControls onPreprocess={handleCustomPreprocess} />
      )}
      {selectedImage && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleExtractText}
          style={{ marginTop: '1rem' }}
        >
          Extract Text
        </Button>
      )}
      <ExtractedText text={extractedText} />
    </Container>
  );
}

export default App;
