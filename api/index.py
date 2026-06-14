import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Import database utilities and models
from api.database import get_db, init_db
from api import models
from api.gemini import get_gemini_recommendations

app = FastAPI(
    title="AI Career Path Recommender API",
    description="Backend API for generating and tracking career recommendations.",
    version="1.0.0"
)

# Enable CORS for all domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Run database table initialization on startup
@app.on_event("startup")
def on_startup():
    print("Initializing database tables...")
    init_db()

# Pydantic schemas for requests/responses
class RecommendationRequest(BaseModel):
    skills: List[str] = Field(..., example=["Python", "Javascript", "SQL"])
    interests: List[str] = Field(..., example=["Artificial Intelligence", "Web Development"])

class ProgressToggleRequest(BaseModel):
    recommendation_id: str
    role_name: str
    topic_title: str
    is_completed: bool

@app.post("/api/recommend", status_code=status.HTTP_201_CREATED)
def create_recommendation(payload: RecommendationRequest, db: Session = Depends(get_db)):
    """
    Generates a career recommendation using Gemini, saves it to the database,
    and initializes completion tracking records for every learning topic.
    """
    if not payload.skills or not payload.interests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Skills and Interests list cannot be empty."
        )

    # 1. Call Gemini integration to get recommendation JSON structure
    career_suggestions = get_gemini_recommendations(payload.skills, payload.interests)
    
    # 2. Save recommendation details to database
    db_recommendation = models.Recommendation(
        skills=payload.skills,
        interests=payload.interests,
        career_data=career_suggestions
    )
    db.add(db_recommendation)
    db.commit()
    db.refresh(db_recommendation)
    
    # 3. Pre-populate TopicProgress table for each topic in the generated career paths
    try:
        roles = career_suggestions.get("recommended_roles", [])
        for role in roles:
            role_name = role.get("job_role")
            learning_path = role.get("learning_path", [])
            for topic in learning_path:
                topic_title = topic.get("title")
                db_progress = models.TopicProgress(
                    recommendation_id=db_recommendation.id,
                    role_name=role_name,
                    topic_title=topic_title,
                    is_completed=False
                )
                db.add(db_progress)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding topic progress details: {str(e)}")
        # We continue even if seeding fails so the user gets their recommendation
        
    return {
        "id": db_recommendation.id,
        "skills": db_recommendation.skills,
        "interests": db_recommendation.interests,
        "created_at": db_recommendation.created_at,
        "career_data": career_suggestions
    }

@app.get("/api/recommendations")
def list_recommendations(db: Session = Depends(get_db)):
    """Lists past recommendations with timestamps and basic summary metadata."""
    recommendations = db.query(models.Recommendation).order_by(models.Recommendation.created_at.desc()).all()
    
    result = []
    for r in recommendations:
        # Calculate completion percentage for each recommendation
        total_topics = db.query(models.TopicProgress).filter_by(recommendation_id=r.id).count()
        completed_topics = db.query(models.TopicProgress).filter_by(recommendation_id=r.id, is_completed=True).count()
        
        progress_percentage = 0
        if total_topics > 0:
            progress_percentage = int((completed_topics / total_topics) * 100)
            
        # Extract role names
        roles = []
        if r.career_data and isinstance(r.career_data, dict):
            roles = [role.get("job_role") for role in r.career_data.get("recommended_roles", [])]

        result.append({
            "id": r.id,
            "skills": r.skills,
            "interests": r.interests,
            "created_at": r.created_at,
            "roles": roles,
            "progress_percentage": progress_percentage
        })
        
    return result

@app.get("/api/recommendations/{rec_id}")
def get_recommendation_details(rec_id: str, db: Session = Depends(get_db)):
    """Retrieves a single recommendation, merging the actual checked states from database into the learning path."""
    rec = db.query(models.Recommendation).filter_by(id=rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    # Get all progress records for this recommendation
    progress_records = db.query(models.TopicProgress).filter_by(recommendation_id=rec_id).all()
    
    # Map progress to a quick lookup dictionary: (role_name, topic_title) -> is_completed
    progress_lookup = {
        (p.role_name, p.topic_title): p.is_completed for p in progress_records
    }
    
    # Merge completion states directly into the response payload
    career_data_copy = dict(rec.career_data)
    roles = career_data_copy.get("recommended_roles", [])
    
    updated_roles = []
    for role in roles:
        role_name = role.get("job_role")
        learning_path = role.get("learning_path", [])
        
        updated_path = []
        for topic in learning_path:
            topic_title = topic.get("title")
            # Look up completion, defaulting to False if not found
            is_completed = progress_lookup.get((role_name, topic_title), False)
            
            topic_copy = dict(topic)
            topic_copy["is_completed"] = is_completed
            updated_path.append(topic_copy)
            
        role_copy = dict(role)
        role_copy["learning_path"] = updated_path
        updated_roles.append(role_copy)
        
    career_data_copy["recommended_roles"] = updated_roles
    
    return {
        "id": rec.id,
        "skills": rec.skills,
        "interests": rec.interests,
        "created_at": rec.created_at,
        "career_data": career_data_copy
    }

@app.post("/api/progress/toggle")
def toggle_progress(payload: ProgressToggleRequest, db: Session = Depends(get_db)):
    """Toggles completion status for a specific learning path topic."""
    progress_record = db.query(models.TopicProgress).filter_by(
        recommendation_id=payload.recommendation_id,
        role_name=payload.role_name,
        topic_title=payload.topic_title
    ).first()
    
    if not progress_record:
        # Create record if not pre-populated (robustness fallback)
        progress_record = models.TopicProgress(
            recommendation_id=payload.recommendation_id,
            role_name=payload.role_name,
            topic_title=payload.topic_title,
            is_completed=payload.is_completed
        )
        db.add(progress_record)
    else:
        progress_record.is_completed = payload.is_completed
        progress_record.updated_at = datetime.utcnow()
        
    try:
        db.commit()
        return {"status": "success", "is_completed": progress_record.is_completed}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}")

# Mount static files. Root mounting must be the last route to prevent overriding api routes.
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    print(f"WARNING: Static files directory not found at: {static_dir}. Frontend will not be served locally.")
