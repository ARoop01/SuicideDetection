from flask import Flask, request, jsonify, render_template
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

# Configure system for TensorFlow
import warnings
warnings.filterwarnings('ignore')

# Set up constants before importing TensorFlow
max_length = 100
padding_type = 'post'
trunc_type = 'post'

# Try to import TensorFlow with error handling
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import tokenizer_from_json

# Load tokenizer
with open("tokenizer.json", "r", encoding="utf-8") as f:
    json_file = f.read()
tokenizer = tokenizer_from_json(json_file)

# Load model
BiLSTM1L_Model = tf.keras.models.load_model('Bidirectional-LSTM-1-Layers.keras')

# Define prediction function using the actual model
def predict_suicide_risk(message):
    twt = [message]
    twt = tokenizer.texts_to_sequences(twt)
    twt = pad_sequences(twt, maxlen=max_length, padding=padding_type, truncating=trunc_type)
    prediction = BiLSTM1L_Model.predict(twt)
    return prediction[0][0]

print("Successfully loaded TensorFlow and model!")
    

app = Flask(__name__)

# Configure Gemini API
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables. Please add it to your .env file.")

genai.configure(api_key=gemini_api_key)
model = genai.GenerativeModel('gemini-2.0-flash')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    
    if not message:
        return jsonify({"error": "No message provided"}), 400
    
    # Get prediction
    prediction_score = predict_suicide_risk(message)
    
    # Determine message type
    if prediction_score >= 0.5:
        message_type = "Potential Suicide Post"
    else:
        message_type = "Non Suicide Post"
    
    # Create prompt for Gemini based on prediction
    if message_type == "Potential Suicide Post":
        prompt = f"""
        The user has sent a message that may indicate suicidal thoughts: "{message}"
        
        Please provide a compassionate and supportive response. Include information about India's suicide prevention helpline and encourage them to reach out for help.
        
        Important: Include the AASRA suicide prevention helpline for India: 91-9820466726 and mention that they can also visit http://www.aasra.info/ for additional resources.
        
        Keep your response empathetic, non-judgmental, and focused on helping them find immediate support.
        """
    else:
        prompt = f"""
        The user has sent the following message: "{message}"
        
        Please provide a helpful and supportive response.
        """
    
    # Get response from Gemini
    response = model.generate_content(prompt)
    
    return jsonify({
        "message_type": message_type,
        "response": response.text,
        "original_message": message
    })

if __name__ == '__main__':
    # Use environment variable for debug mode if available, default to True
    debug_mode = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    app.run(debug=debug_mode)