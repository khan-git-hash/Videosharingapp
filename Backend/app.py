from flask import Flask, jsonify, request, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
from pathlib import Path

# App Initialization
app = Flask(__name__)

# Enable CORS with proper configuration
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ["http://localhost:5000", "http://127.0.0.1:5000"]}})

# Define paths
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
DB_FILE = BASE_DIR / "vidshare.db"

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{DB_FILE}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default_secret_key_for_dev')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize database
db = SQLAlchemy(app)

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    user_type = db.Column(db.String(20), nullable=False)  # 'creator' or 'consumer'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Video(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    description = db.Column(db.String(255))
    filepath = db.Column(db.String(255))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    def __repr__(self):
        return f'<Video {self.title}>'

# Routes
@app.route('/')
def serve_index():
    """Serve the main HTML page."""
    return send_from_directory(BASE_DIR.parent / "frontend", "index.html")

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files like CSS and JS."""
    return send_from_directory(BASE_DIR.parent / "frontend", path)

@app.route('/register', methods=['POST'])
def register_user():
    data = request.json
    if not data or 'username' not in data or 'password' not in data or 'type' not in data:
        return jsonify({"message": "Missing data"}), 400
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"message": "User already exists"}), 409
    user = User(username=data['username'], user_type=data['type'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully!"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and user.check_password(data['password']):
        session['user_id'] = user.id
        session['user_type'] = user.user_type
        session.modified = True  # Ensure session persistence
        print("Session after login:", dict(session))  # Debug: Check session content
        return jsonify({"message": "Login successful", "user_type": user.user_type}), 200
    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/upload', methods=['POST'])
def upload_video():
    print("Session data during upload:", session)  # Debug: Print session data
    if 'user_type' not in session or session['user_type'] != 'creator':
        return jsonify({'message': 'Unauthorized'}), 403
    video = request.files['video']
    title = request.form['title']
    description = request.form['description']
    if video:
        filename = secure_filename(video.filename)  # Generate a safe filename
        filepath = UPLOAD_FOLDER / filename
        print(f"Saving video to: {filepath}")  # Debugging
        video.save(filepath)
        new_video = Video(title=title, description=description, filepath=filename, user_id=session['user_id'])
        db.session.add(new_video)
        db.session.commit()
        return jsonify({'message': 'Video uploaded successfully'}), 201
    return jsonify({'message': 'Failed to upload video'}), 500

@app.route('/videos', methods=['GET'])
def list_videos():
    videos = Video.query.all()
    return jsonify([
        {
            'title': video.title,
            'description': video.description,
            'filepath': f'/uploads/{Path(video.filepath).name}'  # Extract only the filename
        }
        for video in videos
    ])


@app.route('/uploads/<filename>')
def serve_video(filename):
    """Serve video files from the uploads folder."""
    print(f"Serving video: {filename}")  # Debugging
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=False, mimetype='video/mp4')


@app.route('/logout', methods=['POST'])
def logout():
    """Clear the session to log the user out."""
    session.clear()  # Clear all session data
    return jsonify({"message": "Logged out successfully!"}), 200


# Main block to initialize the database
if __name__ == '__main__':
    with app.app_context():
        print("Initializing database...")
        db.create_all()
    app.run(debug=True)

print("BASE_DIR:", BASE_DIR)
print("DB_FILE:", DB_FILE)
