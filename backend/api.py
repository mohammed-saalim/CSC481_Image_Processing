from flask_cors import CORS
import cv2
import numpy as np
from flask import Flask, request, jsonify, send_file
import tempfile
import os
from openai import OpenAI
import base64
from PIL import Image
from difflib import SequenceMatcher
import io
import openai

# Initialize Flask app
app = Flask(__name__)
CORS(app)


# Image preprocessing function
def preprocess_image(image):
    # Convert image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur for noise reduction with a configurable kernel size
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)  # Reduced kernel size for a balance between smoothing and retaining edges

    # Apply adaptive thresholding for better contrast in varying lighting conditions
    # Switch to Otsu's thresholding if adaptive isn't effective
    _, otsu_thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    adaptive_thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 11, 2
    )

    # Choose thresholding method based on image characteristics
    if cv2.countNonZero(adaptive_thresh) < cv2.countNonZero(otsu_thresh) * 0.5:
        processed_image = otsu_thresh  # Use Otsu if adaptive is too sparse
    else:
        processed_image = adaptive_thresh

    # Apply morphological operations
    kernel = np.ones((2, 2), np.uint8)
    processed_image = cv2.morphologyEx(processed_image, cv2.MORPH_CLOSE, kernel)

    # Apply edge detection for images with unclear boundaries (Optional)
    edges = cv2.Canny(processed_image, 50, 150)
    processed_image = cv2.bitwise_or(processed_image, edges)

    return processed_image


def preprocess_license_plate(image):
    """
    Preprocessing specifically for license plate images.
    Focuses on enhancing edges and contrast with a balanced approach.
    """
    # Convert image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Histogram equalization to improve contrast
    equalized = cv2.equalizeHist(gray)
    
    # Apply a mild Gaussian blur to reduce noise while preserving edges
    blurred = cv2.GaussianBlur(equalized, (3, 3), 0)
    
    # Adaptive thresholding for better text segmentation
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY_INV, 11, 2
    )
    
    # Morphological operations to enhance text structure and remove small noise
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))  # Smaller kernel size for fine details
    processed_image = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    return processed_image


def preprocess_table_image(image):
    """
    Preprocessing for table images.
    Focuses on enhancing gridlines and removing noise.
    """
    # Convert image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Thresholding to binarize the image
    _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Morphological operation to remove noise and enhance gridlines
    kernel = np.ones((2, 2), np.uint8)
    processed_image = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    
    return processed_image

def preprocess_dark_background_image(image):
    """
    Preprocessing for images with dark backgrounds (e.g., nighttime).
    Focuses on brightening and reducing noise.
    """
    # Convert image to LAB color space
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    
    # Merge channels and convert back to BGR
    lab = cv2.merge((l, a, b))
    brightened_image = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    
    # Denoising
    processed_image = cv2.fastNlMeansDenoisingColored(brightened_image, None, 10, 10, 7, 21)
    
    return processed_image

def preprocess_far_away_text(image):
    """
    Preprocessing for images with text that is far away.
    Focuses on enhancing text edges and sharpening.
    """
    # Convert image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Resize image to make text appear larger (scaling up)
    scale_percent = 150  # Scale up by 150%
    width = int(gray.shape[1] * scale_percent / 100)
    height = int(gray.shape[0] * scale_percent / 100)
    dim = (width, height)
    resized = cv2.resize(gray, dim, interpolation=cv2.INTER_CUBIC)
    
    # Apply sharpening filter
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(resized, -1, kernel)
    
    # Binarization using adaptive thresholding
    processed_image = cv2.adaptiveThreshold(
        sharpened, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 11, 2
    )
    
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

def read_image_from_request(file):
    """
    Helper function to read and decode an uploaded image file from the request.
    """
    image = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)
    return image


def execute_generated_code(image, generated_code):
    """
    Executes the generated OpenCV code to preprocess the input image.
    """
    # Define a local context for executing the code
    local_context = {'cv2': cv2, 'np': np, 'input_image': image, 'processed_image': None}

    try:
        # Execute the generated code within a controlled scope
        exec(generated_code, {}, local_context)
        processed_image = local_context.get('processed_image')

        if processed_image is None:
            raise ValueError("Generated code did not produce a processed image.")
    except Exception as e:
        print("Error executing generated code:", str(e))
        processed_image = None

    return processed_image


def encode_image_to_base64(image):
    """
    Converts an OpenCV image (numpy array) to a base64-encoded string.
    
    Parameters:
    - image: An OpenCV image (numpy array).
    
    Returns:
    - A base64-encoded string of the image.
    """
    # Convert the OpenCV image to a PIL Image
    pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    
    # Save the PIL image to a bytes buffer
    buffer = io.BytesIO()
    pil_image.save(buffer, format="PNG")
    image_bytes = buffer.getvalue()
    
    # Encode the bytes to a base64 string
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    return base64_image

def generate_opencv_code_with_image(image):
    # Convert the image (NumPy array) to a PIL Image
    image_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

    # Save the PIL Image to a BytesIO buffer and encode it as base64
    buffer = io.BytesIO()
    image_pil.save(buffer, format="PNG")
    base64_image = base64.b64encode(buffer.getvalue()).decode('utf-8')

    # Construct the prompt
    prompt_text = (
        "You are a Python and OpenCV expert. Given a base64-encoded image, generate Python code "
        "using OpenCV that preprocesses the image to enhance text extraction for OCR. The code "
        "should be valid Python and may include techniques like noise reduction, contrast enhancement, "
        "Canny edge detection, binarization, and morphological operations."
        "Please provide only the code without explanation."
    )

    # Make a request to the OpenAI API
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": prompt_text
            }
        ],
        max_tokens=200
    )

    # Correctly accessing the content
    generated_code = response.choices[0].message.content.strip()
    print("Generated OpenCV Code:\n", generated_code)

    return generated_code




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

# Updated function for extracting and comparing text
@app.route('/extract_text_preprocessed', methods=['POST'])
def extract_text_preprocessed():
    if 'original_image' not in request.files or 'preprocessed_image' not in request.files:
        return jsonify({"error": "Both original and preprocessed images must be uploaded"}), 400

    original_file = request.files['original_image']
    preprocessed_file = request.files['preprocessed_image']

    # Load original image
    original_image = Image.open(io.BytesIO(original_file.read()))
    with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as original_temp:
        original_image.save(original_temp.name)
        original_path = original_temp.name

    # Load preprocessed image
    preprocessed_image = Image.open(io.BytesIO(preprocessed_file.read()))
    with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as preprocessed_temp:
        preprocessed_image.save(preprocessed_temp.name)
        preprocessed_path = preprocessed_temp.name

    try:
        # Extract text from both images
        original_text = extract_text_with_openai(original_path)
        preprocessed_text = extract_text_with_openai(preprocessed_path)

        # Calculate similarity/accuracy percentage using SequenceMatcher
        similarity_ratio = SequenceMatcher(None, original_text, preprocessed_text).ratio()
        accuracy_percentage = similarity_ratio * 100

        # Determine if accuracy increased or decreased
        if accuracy_percentage > 100:
            accuracy_summary = "Accuracy percentage increased."
        elif accuracy_percentage < 100:
            accuracy_summary = "Accuracy percentage decreased."
        else:
            accuracy_summary = "No change in accuracy percentage."

        # Get qualitative feedback from OpenAI on how preprocessing impacted text extraction
        feedback_prompt = (
            f"Given the text extracted from the original image: '{original_text}' "
            f"and the text extracted from the preprocessed image: '{preprocessed_text}', "
            "please provide a brief analysis on whether preprocessing improved or worsened the OCR accuracy."
        )

        feedback_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": feedback_prompt}],
            max_tokens=200
        )
        qualitative_feedback = feedback_response.choices[0].message.content

    finally:
        # Ensure the temporary files are cleaned up
        os.unlink(original_path)
        os.unlink(preprocessed_path)

    return jsonify({
        "original_text": original_text,
        "preprocessed_text": preprocessed_text,
        "accuracy_percentage": accuracy_percentage,
        "accuracy_summary": accuracy_summary,
        "qualitative_feedback": qualitative_feedback
    })


@app.route('/category_preprocess/<category>', methods=['POST'])
def category_preprocess(category):
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    image = read_image_from_request(file)

    # Handle different preprocessing categories, including AI-driven
    if category == "license-plate":
        processed_image = preprocess_license_plate(image)
    elif category == "table-image":
        processed_image = preprocess_table_image(image)
    elif category == "dark-background":
        processed_image = preprocess_dark_background_image(image)
    elif category == "far-away-text":
        processed_image = preprocess_far_away_text(image)
    elif category == "ai-preprocessing":
        # Generate OpenCV code with AI
        generated_code = generate_opencv_code_with_image(image)

        # Execute the generated code
        processed_image = execute_generated_code(image, generated_code)

        if processed_image is None:
            return jsonify({"error": "AI-generated preprocessing failed"}), 500
    else:
        return jsonify({"error": f"Unknown category '{category}'"}), 400

    # Save and return the processed image
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
    cv2.imwrite(temp_file.name, processed_image)

    return send_file(temp_file.name, mimetype='image/png', as_attachment=True, download_name='processed_image.png')


@app.route('/')
def home():
    return "CSC 481 Image Processing !"

print(app.url_map)

if __name__ == '__main__':
    app.run(debug=True)
