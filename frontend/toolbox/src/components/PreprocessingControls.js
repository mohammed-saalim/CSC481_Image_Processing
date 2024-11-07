import React, { useState } from 'react';

function PreprocessingControls({ onPreprocess }) {
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [contrastAdjustment, setContrastAdjustment] = useState(false);

  const handleSubmit = () => {
    onPreprocess({ noiseReduction, contrastAdjustment });
  };

  return (
    <div>
      <h3>Preprocessing Options</h3>
      <label>
        <input
          type="checkbox"
          checked={noiseReduction}
          onChange={(e) => setNoiseReduction(e.target.checked)}
        />
        Noise Reduction
      </label>
      <label>
        <input
          type="checkbox"
          checked={contrastAdjustment}
          onChange={(e) => setContrastAdjustment(e.target.checked)}
        />
        Contrast Adjustment
      </label>
      <button onClick={handleSubmit}>Apply Preprocessing</button>
    </div>
  );
}

export default PreprocessingControls;
