import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from api.database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    skills = Column(JSON, nullable=False)  # Stores list of skills as JSON array
    interests = Column(JSON, nullable=False)  # Stores list of interests as JSON array
    career_data = Column(JSON, nullable=False)  # Stores the full Gemini JSON recommendation response
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to progress tracking records
    progress = relationship("TopicProgress", back_populates="recommendation", cascade="all, delete-orphan")

class TopicProgress(Base):
    __tablename__ = "topic_progress"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(String(36), ForeignKey("recommendations.id", ondelete="CASCADE"), nullable=False)
    role_name = Column(String(255), nullable=False)
    topic_title = Column(String(255), nullable=False)
    is_completed = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship back to recommendation
    recommendation = relationship("Recommendation", back_populates="progress")
