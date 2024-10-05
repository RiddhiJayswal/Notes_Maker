import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq

# Initialize the Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Set up the Groq client with your API key
os.environ["GROQ_API_KEY"] = "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"
client = Groq(api_key=os.environ["GROQ_API_KEY"])  # Use the environment variable

# Function to get the definition of a keyword from Groq
def get_keyword_definition(keyword):
    prompt = f'Provide a single-line definition for the keyword: "{keyword}".'
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama3-8b-8192",
        )
        definition = chat_completion.choices[0].message.content
        return definition
    except Exception as e:
        print('Error:', str(e))
        return 'Failed to fetch definition'

# Endpoint to get the definition of a keyword
@app.route('/get-definition', methods=['POST'])
def get_definition():
    data = request.json
    keyword = data.get('keyword')
    
    if not keyword:
        return jsonify({'message': 'Keyword is required'}), 400

    definition = get_keyword_definition(keyword)
    return jsonify({'definition': definition})

if __name__ == '__main__':
    app.run(debug=True)