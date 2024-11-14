import React, { useState } from 'react';
import { Box, Checkbox, FormControlLabel, Slider, Typography, Button } from '@mui/material';

function PreprocessingControls({ onPreprocess }) {
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [blurKernelSize, setBlurKernelSize] = useState(5); // For Gaussian blur kernel size
  const [contrastAdjustment, setContrastAdjustment] = useState(false);
  const [edgeDetection, setEdgeDetection] = useState(false);
  const [edgeThreshold, setEdgeThreshold] = useState(50);
  const [morphologicalOperation, setMorphologicalOperation] = useState(false);
  const [dilation, setDilation] = useState(false);
  const [erosion, setErosion] = useState(false);
  const [thresholding, setThresholding] = useState(false);
  const [dilationKernelSize, setDilationKernelSize] = useState(3);
  const [erosionKernelSize, setErosionKernelSize] = useState(3);

  // Function to handle changes in slider
  const handleBlurChange = (event, newValue) => {
    setBlurKernelSize(newValue);
  };

  const handleEdgeThresholdChange = (event, newValue) => {
    setEdgeThreshold(newValue);
  };

  const handleDilationKernelChange = (event, newValue) => {
    setDilationKernelSize(newValue);
  };

  const handleErosionKernelChange = (event, newValue) => {
    setErosionKernelSize(newValue);
  };

  const handleSubmit = () => {
    onPreprocess({
      noiseReduction,
      blurKernelSize: Math.max(1, blurKernelSize),
      contrastAdjustment,
      edgeDetection,
      edgeThreshold,
      morphologicalOperation,
      dilation,
      dilationKernelSize,
      erosion,
      erosionKernelSize,
      thresholding
    });
  };

  return (
    <Box
      sx={{
        padding: 2,
        border: '1px solid #ccc',
        borderRadius: 2,
        maxHeight: '500px', // Set a fixed height for scrollability
        overflowY: 'auto', // Enable scrolling
        width: '100%'
      }}
    >
      <Typography variant="h5" gutterBottom>
        Preprocessing Options
      </Typography>

      {/* Noise Reduction Option */}
      <FormControlLabel
        control={
          <Checkbox
            checked={noiseReduction}
            onChange={(e) => setNoiseReduction(e.target.checked)}
            color="primary"
          />
        }
        label="Noise Reduction (Gaussian Blur)"
      />
      {noiseReduction && (
        <Box sx={{ marginTop: 2 }}>
          <Typography id="blur-kernel-size-slider" gutterBottom>
            Blur Kernel Size
          </Typography>
          <Slider
            value={blurKernelSize}
            onChange={handleBlurChange}
            aria-labelledby="blur-kernel-size-slider"
            valueLabelDisplay="auto"
            step={2}
            min={1}
            max={31} // Ensure odd values
            marks
          />
        </Box>
      )}

      {/* Contrast Adjustment Option */}
      <FormControlLabel
        control={
          <Checkbox
            checked={contrastAdjustment}
            onChange={(e) => setContrastAdjustment(e.target.checked)}
            color="primary"
          />
        }
        label="Contrast Adjustment"
        sx={{ marginTop: 2 }}
      />

      {/* Edge Detection Option */}
      <FormControlLabel
        control={
          <Checkbox
            checked={edgeDetection}
            onChange={(e) => setEdgeDetection(e.target.checked)}
            color="primary"
          />
        }
        label="Edge Detection (Canny)"
        sx={{ marginTop: 2 }}
      />
      {edgeDetection && (
        <Box sx={{ marginTop: 2 }}>
          <Typography id="edge-threshold-slider" gutterBottom>
            Edge Detection Threshold
          </Typography>
          <Slider
            value={edgeThreshold}
            onChange={handleEdgeThresholdChange}
            aria-labelledby="edge-threshold-slider"
            valueLabelDisplay="auto"
            step={1}
            min={0}
            max={255} // Canny edge detection threshold range
          />
        </Box>
      )}

      {/* Morphological Operations Option */}
      <FormControlLabel
        control={
          <Checkbox
            checked={morphologicalOperation}
            onChange={(e) => setMorphologicalOperation(e.target.checked)}
            color="primary"
          />
        }
        label="Morphological Operations"
        sx={{ marginTop: 2 }}
      />

      {/* Dilation Option */}
      <FormControlLabel
        control={
          <Checkbox
            checked={dilation}
            onChange={(e) => setDilation(e.target.checked)}
            color="primary"
          />
        }
        label="Dilation"
        sx={{ marginTop: 2 }}
      />
      {dilation && (
        <Box sx={{ marginTop: 2 }}>
          <Typography id="dilation-kernel-size-slider" gutterBottom>
            Dilation Kernel Size
          </Typography>
          <Slider
            value={dilationKernelSize}
            onChange={handleDilationKernelChange}
            aria-labelledby="dilation-kernel-size-slider"
            valueLabelDisplay="auto"
            step={1}
            min={1}
            max={15} // Adjust as needed
          />
        </Box>
      )}

      {/* Erosion Option */}
      <FormControlLabel
        control={
          <Checkbox
            checked={erosion}
            onChange={(e) => setErosion(e.target.checked)}
            color="primary"
          />
        }
        label="Erosion"
        sx={{ marginTop: 2 }}
      />
      {erosion && (
        <Box sx={{ marginTop: 2 }}>
          <Typography id="erosion-kernel-size-slider" gutterBottom>
            Erosion Kernel Size
          </Typography>
          <Slider
            value={erosionKernelSize}
            onChange={handleErosionKernelChange}
            aria-labelledby="erosion-kernel-size-slider"
            valueLabelDisplay="auto"
            step={1}
            min={1}
            max={15} // Adjust as needed
          />
        </Box>
      )}

      {/* Thresholding Option */}
      <FormControlLabel
        control={
          <Checkbox
            checked={thresholding}
            onChange={(e) => setThresholding(e.target.checked)}
            color="primary"
          />
        }
        label="Thresholding"
        sx={{ marginTop: 2 }}
      />

      {/* Submit Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ marginTop: 2 }}
      >
        Apply Preprocessing
      </Button>
    </Box>
  );
}

export default PreprocessingControls;
