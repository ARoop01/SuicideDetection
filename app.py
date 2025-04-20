from flask import Flask, request, jsonify, render_template, redirect, url_for, session
import os
import json
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
try:
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
except Exception as e:
    print(f"Error loading TensorFlow or model: {e}")
    # Fallback function if model fails to load
    def predict_suicide_risk(message):
        print("Using fallback prediction function")
        return 0.0  # Default to non-suicide post

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "default_secret_key_for_sessions")

# Path to users JSON file
USERS_FILE = "users.json"

# Helper function to read users from JSON file
def read_users():
    try:
        if os.path.exists(USERS_FILE):
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        else:
            return {"users": []}
    except Exception as e:
        print(f"Error reading users file: {e}")
        return {"users": []}

# Helper function to write users to JSON file
def write_users(users_data):
    try:
        with open(USERS_FILE, 'w') as f:
            json.dump(users_data, f, indent=4)
        return True
    except Exception as e:
        print(f"Error writing to users file: {e}")
        return False

# Configure Gemini API
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables. Please add it to your .env file.")

genai.configure(api_key=gemini_api_key)
model = genai.GenerativeModel('gemini-2.0-flash')

# Route for index page - should check login status
@app.route('/')
def home():
    # Check if user is logged in
    if 'logged_in' in session and session['logged_in']:
        return render_template('index.html')
    else:
        return redirect(url_for('login'))

# Route for registration page
@app.route('/register')
def register():
    return render_template('register.html')

# Route for login page
@app.route('/login')
def login():
    return render_template('login.html')

# API for registration (saves user data to JSON file)
@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.json
    email = data.get('email')
    mobile = data.get('mobile')
    password = data.get('password')
    dob = data.get('dob')
    
    if not all([email, mobile, password, dob]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    # Get existing users
    users_data = read_users()
    
    # Check if user already exists
    for user in users_data["users"]:
        if user["email"] == email or user["mobile"] == mobile:
            return jsonify({"success": False, "message": "User already exists with that email or mobile number"}), 400
    
    # Add new user
    users_data["users"].append({
        "email": email,
        "mobile": mobile,
        "password": password,  # In a real app, you would hash this
        "dob": dob
    })
    
    # Save updated users
    if write_users(users_data):
        return jsonify({"success": True, "message": "Registration successful"})
    else:
        return jsonify({"success": False, "message": "Error saving user data"}), 500

# API for login (checks against JSON file)
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json
    identifier = data.get('identifier')  # Email or mobile
    password = data.get('password')
    
    if not all([identifier, password]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    # Get existing users
    users_data = read_users()
    
    # Check credentials
    for user in users_data["users"]:
        if (user["email"] == identifier or user["mobile"] == identifier) and user["password"] == password:
            # Set session data
            session['logged_in'] = True
            session['user_email'] = user["email"]
            return jsonify({"success": True, "message": "Login successful"})
    
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

# Route for logout
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# The original chat API endpoint
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
        
        Please provide a helpful and supportive response that should be concise and a single best response.
        """
    
    # Get response from Gemini
    response = model.generate_content(prompt)
    
    return jsonify({
        "message_type": message_type,
        "response": response.text,
        "original_message": message
    })

if __name__ == '__main__':
    # Make sure the users file exists
    if not os.path.exists(USERS_FILE):
        write_users({"users": []})
    
    # Use environment variable for debug mode if available, default to True
    debug_mode = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    app.run(debug=debug_mode)