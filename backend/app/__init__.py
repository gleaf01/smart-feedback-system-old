# from flask import Flask
# from flask_sqlalchemy import SQLAlchemy
# from flask_cors import CORS
# import os

# db = SQLAlchemy()

# def create_app():
#     app = Flask(__name__)
#     CORS(app)
#     app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../instance/feedback.db'
#     app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

#     db.init_app(app)

#     from .routes import feedback_bp
#     app.register_blueprint(feedback_bp, url_prefix="/api")

#     with app.app_context():
#         db.create_all()

#     return app



from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

# Initialize SQLAlchemy
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///feedback.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize database with app
    db.init_app(app)

    # Enable CORS for all routes (allow frontend JS requests)
    CORS(app)

    # Import and register routes
    from .routes import feedback_bp
    app.register_blueprint(feedback_bp)

    return app
