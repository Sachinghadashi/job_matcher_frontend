from flask import Flask, request, jsonify
from flask_cors import CORS
from model import get_job_recommendations

app = Flask(__name__)
# Enable CORS so React/Node can communicate with this service easily
CORS(app)

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({"status": "ML Service is running"})

@app.route('/recommend-jobs', methods=['POST'])
def recommend():
    try:
        data = request.json
        if not data or 'skills' not in data:
            return jsonify({"error": "Please provide a 'skills' list in the request body."}), 400
        
        user_skills = data['skills']
        if not isinstance(user_skills, list):
            return jsonify({"error": "'skills' must be a list of strings."}), 400

        recommendations = get_job_recommendations(user_skills, top_n=5)
        return jsonify({
            "message": "Recommendations generated successfully",
            "matches": recommendations
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run the Flask app on the port provided by the environment, default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
