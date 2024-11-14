import React from 'react';

function ExtractedText({ text }) {
  if (!text) return null;

  return (
    <div>
      <h3>Extracted Text</h3>
      <p>{text}</p>
    </div>
  );
}

export default ExtractedText;
