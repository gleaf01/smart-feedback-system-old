from app import create_app, db
from flask import send_from_directory
import os

app = create_app()

# Path to frontend folder (outside backend)
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """
    Serve files from the frontend folder
    """
    if path != "" and os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    else:
        return send_from_directory(FRONTEND_DIR, "index.html")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Database tables ready!")

    app.run(debug=True)
