
# openai.api_key = 'sk-proj-SjQOosxsCLL-4Ieek0AN3bdSWI2oSXhhgEIg7_58nolWZEizQYLERWqamUTtyIJSWKyvK9qEOlT3BlbkFJbA8OCJymLhYsjlg0ZSWpVWZPhFUJnCyxT0GS1Rd21mxfMwt7B9MJvRzMecjQy5eOwCerUPfrgAEY'

import cv2
import numpy as np
import base64
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key="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")

def encode_image(image_path):
    """Convert image to base64 format for OpenAI API"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def preprocess_image(image_path):
    """Apply image processing techniques for better text extraction."""
    # Read the image
    image = cv2.imread(image_path)

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Noise Reduction using Gaussian Blurring
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Contrast Adjustment using Histogram Equalization
    equalized = cv2.equalizeHist(blurred)

    # Edge Detection using Canny
    edges = cv2.Canny(equalized, 100, 200)

    # Morphological Operations - Dilation followed by Erosion (Closing)
    kernel = np.ones((3, 3), np.uint8)
    dilated = cv2.dilate(edges, kernel, iterations=2)
    processed_image = cv2.erode(dilated, kernel, iterations=2)

    # Save the processed image (for testing/verification purposes)
    cv2.imwrite("processed_image.png", processed_image)

    return "processed_image.png"

def extract_text_with_openai(image_path):
    """Extract text using OpenAI API after preprocessing."""
    # Preprocess the image
    processed_image_path = preprocess_image(image_path)

    # Encode the processed image in base64
    encoded_image = encode_image(processed_image_path)

    # Use OpenAI to extract text
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract text from this image."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{encoded_image}"
                        }
                    }
                ]
            }
        ],
        max_tokens=500
    )

    # Extract and return text
    return response.choices[0].message.content

# Example usage
image_path = "license.webp"  # Replace with the path to your image
extracted_text = extract_text_with_openai(image_path)
print("Extracted Text:", extracted_text)
