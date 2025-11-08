# routes.py

from flask import Blueprint, request, jsonify, render_template
from .models import User, Feedback
from . import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from .sentiment import analyze_sentiment 

feedback_bp = Blueprint('feedback_bp', __name__)

# =======================================================
# 1. FRONTEND PAGE ROUTES (GET)
# =======================================================

@feedback_bp.route("/", methods=["GET"])
def home():
    """Renders the main index page for the project."""
    return render_template("index.html")

@feedback_bp.route("/register", methods=["GET"])
def register_page():
    """Renders the registration HTML page."""
    return render_template("Register.html") 

@feedback_bp.route("/login", methods=["GET"])
def login_page():
    """Renders the login HTML page."""
    return render_template("Login.html")

@feedback_bp.route("/feedback", methods=["GET"])
def feedback_page():
    """Renders the feedback submission HTML page for guests."""
    return render_template("Feedback.html") 


# --- ADMIN ROUTE ---
@feedback_bp.route("/admin", methods=["GET"])
def admin_page():
    """Renders the administrator dashboard page."""
    return render_template("Admin.html")

# =======================================================
# 2. API ENDPOINTS (POST/GET/DELETE)
# =======================================================

# ---------------------------
# Register (API POST)
# ---------------------------
@feedback_bp.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already exists"}), 400
    hashed_password = generate_password_hash(data['password'])
    user = User(
        name=data['name'],
        email=data['email'],
        password=hashed_password,
        role=data['role']
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

# ---------------------------
# Login (API POST)
# ---------------------------
@feedback_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({"error": "Invalid email or password"}), 401
    return jsonify({
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200

# ---------------------------
# Submit Feedback (API POST)
# ---------------------------
@feedback_bp.route("/api/feedback", methods=["POST"])
def submit_feedback():
    data = request.get_json()
    message = data.get("message")
    user_id = data.get("user_id")

    if not message:
        return jsonify({"error": "Feedback message is required"}), 400

    # VADER Sentiment analysis
    sentiment = analyze_sentiment(message)

    fb = Feedback(message=message, sentiment=sentiment)
    if user_id:
        fb.user_id = user_id
    db.session.add(fb)
    db.session.commit()
    return jsonify({"sentiment": sentiment}), 200


# ---------------------------
# Sentiment Summary for Chart (API GET)
# ---------------------------
@feedback_bp.route("/api/summary", methods=["GET"])
def summary():
    feedbacks = Feedback.query.all()
    summary = {"Positive": 0, "Negative": 0, "Neutral": 0}
    for fb in feedbacks:
        if fb.sentiment in summary:
            summary[fb.sentiment] += 1
    return jsonify(summary)

# ---------------------------
# Admin: Get all feedbacks (API GET) - WITH FILTERING
# ---------------------------
@feedback_bp.route("/api/all_feedback", methods=["GET"])
def get_all_feedback():
    # Get optional sentiment filter from query parameters
    sentiment_filter = request.args.get('sentiment')
    
    query = Feedback.query
    if sentiment_filter and sentiment_filter != 'All':
        query = query.filter_by(sentiment=sentiment_filter)
        
    feedbacks = query.order_by(Feedback.timestamp.desc()).all()
    
    result = []
    for fb in feedbacks:
        # Ensure timestamp is formatted for JSON consumption
        timestamp_str = fb.timestamp.isoformat() if isinstance(fb.timestamp, datetime) else str(fb.timestamp)
        
        result.append({
            "id": fb.id,
            "user_name": fb.user.name if fb.user else "Guest",
            "message": fb.message,
            "sentiment": fb.sentiment,
            "timestamp": timestamp_str
        })
    return jsonify(result)

# ---------------------------
# Admin: Delete feedback (API DELETE)
# ---------------------------
@feedback_bp.route("/api/feedback/<int:feedback_id>", methods=["DELETE"])
def delete_feedback(feedback_id):
    fb = Feedback.query.get(feedback_id)
    if not fb:
        return jsonify({"error": "Feedback not found"}), 404
    db.session.delete(fb)
    db.session.commit()
    return jsonify({"message": "Feedback deleted"})



# ---------------------------
# NEW: User Feedback History (API GET)
# ---------------------------
@feedback_bp.route("/api/feedback/history/<int:user_id>", methods=["GET"])
def get_user_feedback_history(user_id):
    """Retrieves all feedback submitted by a specific user."""
    
    feedbacks = Feedback.query.filter_by(user_id=user_id).order_by(Feedback.timestamp.desc()).all()
    
    result = []
    for fb in feedbacks:
        timestamp_str = fb.timestamp.isoformat() if isinstance(fb.timestamp, datetime) else str(fb.timestamp)
        
        result.append({
            "id": fb.id,
            "message": fb.message,
            "sentiment": fb.sentiment,
            "timestamp": timestamp_str
        })
    return jsonify(result)
# ---------------------------



# --- NEW: User History Page Route ---
@feedback_bp.route("/history", methods=["GET"])
def user_history_page():
    """Renders the user's feedback history page."""
    return render_template("UserHistory.html") 
# ------------------------------------