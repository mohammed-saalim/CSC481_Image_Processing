from flask_cors import CORS
import cv2
import numpy as np
from flask import Flask, request, jsonify, send_file
import tempfile
import os
from openai import OpenAI
import base64
from PIL import Image
import io

# Initialize Flask app
app = Flask(__name__)
CORS(app)

client = OpenAI()

# Image preprocessing function
def preprocess_image(image):
    # Convert image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur for noise reduction
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY_INV, 11, 2
    )
    
    # Morphological operations for noise removal
    kernel = np.ones((3, 3), np.uint8)
    processed_image = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    return processed_image

def to_bool(value):
    return value.lower() == 'true'



# Custom preprocessing function
def custom_preprocess_image(image, params):
    # Helper function to convert strings to booleans
    def to_bool(value):
        return value.lower() == 'true'

    # Apply Gaussian Blur for noise reduction if specified
    if to_bool(params.get('noiseReduction', 'false')):
        blur_kernel_size = int(params.get('blurKernelSize', 5))
        blur_kernel_size = max(1, blur_kernel_size)  # Ensure kernel size is at least 1
        blur_kernel_size = blur_kernel_size + 1 if blur_kernel_size % 2 == 0 else blur_kernel_size  # Ensure kernel size is odd
        image = cv2.GaussianBlur(image, (blur_kernel_size, blur_kernel_size), 0)

    # Apply histogram equalization for contrast adjustment if specified
    if to_bool(params.get('contrastAdjustment', 'false')):
        if len(image.shape) == 3:  # Colored image
            ycrcb = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
            ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
            image = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
        else:  # Grayscale image
            image = cv2.equalizeHist(image)

    # Apply edge detection using Canny if specified
    if to_bool(params.get('edgeDetection', 'false')):
        lower_threshold = int(params.get('lowerThreshold', 100))
        upper_threshold = int(params.get('upperThreshold', 200))
        image = cv2.Canny(image, lower_threshold, upper_threshold)

    # Apply morphological operations if specified
    if to_bool(params.get('morphologicalOperation', 'false')):
        operation = params.get('operationType', 'close')  # 'close' or 'open'
        kernel_size = int(params.get('kernelSize', 3))
        kernel = np.ones((kernel_size, kernel_size), np.uint8)
        if operation == 'close':
            image = cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel)
        elif operation == 'open':
            image = cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel)

    return image



# Text extraction using OpenAI
def extract_text_with_openai(image_path):
    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Extract text from this image."},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/png;base64,{base64_image}"}
                    }
                ]
            }
        ],
        max_tokens=500
    )

    # Extract and return text
    return response.choices[0].message.content

@app.route('/preprocess', methods=['POST'])
def preprocess_route():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    image = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)

    processed_image = preprocess_image(image)

    # Save processed image temporarily
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
    cv2.imwrite(temp_file.name, processed_image)
    
    return send_file(temp_file.name, mimetype='image/png', as_attachment=True, download_name='processed_image.png')

@app.route('/custom_preprocess', methods=['POST'])
def custom_preprocess_route():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    image = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)

    # Apply preprocessing (adjust as needed)
    processed_image = custom_preprocess_image(image, request.form)

    # Save processed image temporarily
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
    cv2.imwrite(temp_file.name, processed_image)

    return send_file(temp_file.name, mimetype='image/png')

@app.route('/extract_text', methods=['POST'])
def extract_text_route():
    if 'file' not in request.files:
        print("No file received in request")
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    image = Image.open(io.BytesIO(file.read()))

    # Create a temporary file for the image
    with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
        image.save(temp_file.name)
        temp_file_path = temp_file.name  # Save path for later use

    try:
        # Perform text extraction
        extracted_text = extract_text_with_openai(temp_file_path)
    finally:
        # Ensure the temporary file is cleaned up
        os.unlink(temp_file_path)

    return jsonify({"extracted_text": extracted_text})

if __name__ == '__main__':
    app.run(debug=True)
