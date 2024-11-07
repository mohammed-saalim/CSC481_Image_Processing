# from flask_cors import CORS
# import cv2
# import numpy as np
# from flask import Flask, request, jsonify, send_file
# import tempfile
# import os
# from openai import OpenAI
# import base64
# from PIL import Image
# import io

# # Initialize Flask app
# app = Flask(__name__)
# CORS(app)

# # Initialize OpenAI client (make sure your API key is properly set up in your environment)
# client = OpenAI(api_key="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")

# # Image preprocessing function
# def preprocess_image(image):
#     # Convert image to grayscale
#     gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
#     # Apply Gaussian blur for noise reduction
#     blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
#     # Apply adaptive thresholding
#     thresh = cv2.adaptiveThreshold(
#         blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
#         cv2.THRESH_BINARY_INV, 11, 2
#     )
    
#     # Morphological operations for noise removal
#     kernel = np.ones((3, 3), np.uint8)
#     processed_image = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
#     return processed_image

# # Text extraction using OpenAI
# def extract_text_with_openai(image_path):
#     with open(image_path, "rb") as image_file:
#         base64_image = base64.b64encode(image_file.read()).decode('utf-8')
    

#     response = client.chat.completions.create(
#         model="gpt-4o-mini",
#         messages=[
#             {
#                 "role": "user",
#                 "content": [
#                     {
#                         "type": "text",
#                         "text": "Extract text from this image."
#                     },
#                     {
#                         "type": "image_url",
#                         "image_url": {
#                             "url": f"data:image/png;base64,{base64_image}"
#                         }
#                     }
#                 ]
#             }
#         ],
#         max_tokens=500
#     )

#     # Extract and return text
#     return response.choices[0].message.content

# @app.route('/preprocess', methods=['POST'])
# def preprocess_route():
#     if 'file' not in request.files:
#         return jsonify({"error": "No file uploaded"}), 400
    
#     file = request.files['file']
#     image = cv2.imdecode(np.fromstring(file.read(), np.uint8), cv2.IMREAD_COLOR)

#     processed_image = preprocess_image(image)

#     # Save processed image temporarily
#     temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
#     cv2.imwrite(temp_file.name, processed_image)
    
#     return send_file(temp_file.name, mimetype='image/png', as_attachment=True, download_name='processed_image.png')

# @app.route('/extract_text', methods=['POST'])
# def extract_text_route():
#     if 'file' not in request.files:
#         return jsonify({"error": "No file uploaded"}), 400

#     file = request.files['file']
#     image = Image.open(io.BytesIO(file.read()))

#     # Create a temporary file and immediately close it after writing
#     with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
#         image.save(temp_file.name)
#         temp_file_path = temp_file.name  # Save path for later use

#     try:
#         # Perform text extraction
#         extracted_text = extract_text_with_openai(temp_file_path)
#     finally:
#         # Ensure the temporary file is cleaned up
#         os.unlink(temp_file_path)

#     return jsonify({"extracted_text": extracted_text})


# if __name__ == '__main__':
#     app.run(debug=True)


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

# Initialize OpenAI client (ensure API key is configured securely)
client = OpenAI(api_key="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")

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

@app.route('/extract_text', methods=['POST'])
def extract_text_route():
    if 'file' not in request.files:
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
