import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000'; // Ensure your Flask server runs on this address

export const preprocessImage = (image) => {
  const formData = new FormData();
  formData.append('file', image);
  return axios.post(`${API_BASE_URL}/preprocess`, formData, {
    responseType: 'blob', // Important to receive image response
  });
};

export const applyCustomPreprocessing = (formData) => {
  return axios.post(`${API_BASE_URL}/custom_preprocess`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // Make sure this header is not set manually
    },
    responseType: 'blob', // Important if you expect image data in response
  });
};

export const extractText = (image) => {
  const formData = new FormData();
  formData.append('file', image);
  return axios.post(`${API_BASE_URL}/extract_text`, formData);
};

export const extractTextPreprocessed = (formData) => {
  return axios.post(`${API_BASE_URL}/extract_text_preprocessed`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};


export const applyCategoryPreprocessing = (formData, category) => {
  return axios.post(`${API_BASE_URL}/category_preprocess/${category}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob',
  });
};



