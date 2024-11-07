import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Ensure your Flask server runs on this address

export const preprocessImage = (image) => {
  const formData = new FormData();
  formData.append('file', image);
  return axios.post(`${API_BASE_URL}/preprocess`, formData, {
    responseType: 'blob', // Important to receive image response
  });
};

export const applyCustomPreprocessing = (params) => {
  return axios.post(`${API_BASE_URL}/apply_preprocessing`, params);
};

export const extractText = (image) => {
    const formData = new FormData();
    formData.append('file', image);
    return axios.post(`${API_BASE_URL}/extract_text`, formData);
  };
  