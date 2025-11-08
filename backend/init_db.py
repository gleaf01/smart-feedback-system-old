from app import create_app, db

# Step 1: Create Flask app
app = create_app()

# Step 2: Create tables inside app context
with app.app_context():
    db.create_all()
    print("Database tables created successfully!")
