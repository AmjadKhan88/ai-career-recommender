import os
from typing import List
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Schema definitions for Gemini Structured JSON output
class LearningTopic(BaseModel):
    title: str = Field(..., description="Title of the topic to learn")
    description: str = Field(..., description="Details about what should be learned in this topic")
    estimated_weeks: int = Field(..., description="Number of weeks to spend on this topic")

class CareerPath(BaseModel):
    job_role: str = Field(..., description="Name of the recommended job role")
    description: str = Field(..., description="Why this role fits the user's profile and what their daily tasks look like")
    difficulty_level: str = Field(..., description="Difficulty level: Beginner, Intermediate, or Advanced")
    learning_path: List[LearningTopic] = Field(..., description="Step-by-step sequential learning path topics (aim for 4-6 topics)")
    estimated_time_total: str = Field(..., description="Total time to learn this path (e.g. '3 months', '6 months')")

class CareerRecommendations(BaseModel):
    recommended_roles: List[CareerPath] = Field(..., description="List of 3 to 5 career path recommendations")

def get_mock_recommendations(skills: List[str], interests: List[str]) -> dict:
    """Fallback mock recommendation generator for demo purposes if no API key is provided."""
    skills_str = ", ".join(skills)
    interests_str = ", ".join(interests)
    
    # Custom mock based on common tech skills
    mock_data = {
        "recommended_roles": [
            {
                "job_role": "Full Stack Web Developer",
                "description": f"Since you are interested in {interests_str or 'technology'} and have skills in {skills_str or 'coding'}, a Full Stack Web Developer role is a great fit. You will work on both frontend interfaces and backend APIs/databases.",
                "difficulty_level": "Intermediate",
                "learning_path": [
                    {
                        "title": "Advanced Javascript & Frontend Frameworks",
                        "description": "Master React or Vue.js, along with modern CSS frameworks like Tailwind CSS, to build highly responsive, stateful client-side apps.",
                        "estimated_weeks": 4
                    },
                    {
                        "title": "Backend Development & APIs",
                        "description": "Learn to write server-side code using Node.js or Python (FastAPI/Django) and construct secure RESTful and GraphQL APIs.",
                        "estimated_weeks": 4
                    },
                    {
                        "title": "Database Systems & Design",
                        "description": "Understand relational databases (PostgreSQL) and non-relational databases (MongoDB), database schema design, and indexing.",
                        "estimated_weeks": 3
                    },
                    {
                        "title": "DevOps, Deployment, & Cloud Services",
                        "description": "Learn to containerize applications with Docker, deploy to platforms like Vercel or AWS, and manage CI/CD pipelines.",
                        "estimated_weeks": 3
                    }
                ],
                "estimated_time_total": "14 Weeks (approx. 3.5 months)"
            },
            {
                "job_role": "AI / ML Integration Engineer",
                "description": f"Your skills in {skills_str or 'problem-solving'} coupled with interests in AI can make you a highly valued AI Integration Engineer. Instead of training raw models, you'll focus on building apps powered by LLMs (like Gemini) and fine-tuning prompts/RAG architectures.",
                "difficulty_level": "Advanced",
                "learning_path": [
                    {
                        "title": "Python & Data Processing Foundations",
                        "description": "Strengthen Python fundamentals, scientific libraries (NumPy, Pandas), and data preparation techniques.",
                        "estimated_weeks": 3
                    },
                    {
                        "title": "LLM APIs & Prompt Engineering",
                        "description": "Learn to utilize Google GenAI SDK, manage context windows, and implement advanced prompt engineering patterns.",
                        "estimated_weeks": 3
                    },
                    {
                        "title": "Vector Databases & Retrieval Augmented Generation (RAG)",
                        "description": "Implement database vector searches (Pinecone, pgvector) to inject private knowledge bases into LLM responses.",
                        "estimated_weeks": 4
                    },
                    {
                        "title": "AI Agent Orchestration Frameworks",
                        "description": "Develop autonomous agents using LangChain or CrewAI, integrating tools like web search, code interpreters, and calculators.",
                        "estimated_weeks": 4
                    }
                ],
                "estimated_time_total": "14 Weeks (approx. 3.5 months)"
            },
            {
                "job_role": "UI/UX Developer",
                "description": f"Leveraging your interest in {interests_str or 'design'}, this role sits at the intersection of coding and visual design. You will translate wireframes and user research into high-fidelity interactive user interfaces.",
                "difficulty_level": "Beginner",
                "learning_path": [
                    {
                        "title": "UI/UX Design Foundations & Figma",
                        "description": "Master user research, wireframing, typography, color theory, and prototyping inside Figma.",
                        "estimated_weeks": 4
                    },
                    {
                        "title": "Modern Styling & Tailwind CSS",
                        "description": "Build modern layouts using CSS Grid, Flexbox, Tailwind CSS v4, and create custom micro-animations.",
                        "estimated_weeks": 3
                    },
                    {
                        "title": "Responsive Layouts & Interactive JS",
                        "description": "Learn JavaScript DOM manipulation to build interactive carousels, slide-outs, and dark/light toggles dynamically.",
                        "estimated_weeks": 3
                    }
                ],
                "estimated_time_total": "10 Weeks (approx. 2.5 months)"
            }
        ]
    }
    return mock_data

def get_gemini_recommendations(skills: List[str], interests: List[str]) -> dict:
    """Generates career suggestions using Google Gemini 2.5 Flash API with structured JSON output."""
    api_key = os.getenv("GEMINI_API_KEY")
    
    # Check if API key is missing or is the placeholder template string
    if not api_key or api_key.strip() == "" or api_key == "your_gemini_api_key_here":
        print("[Gemini Integration] GEMINI_API_KEY not configured. Returning mock recommendations.")
        return get_mock_recommendations(skills, interests)
        
    try:
        # Initialize Google GenAI client
        # In google-genai, we pass api_key to Client or let it pick up GEMINI_API_KEY from environment
        client = genai.Client()
        
        prompt = f"""
        You are an expert career advisor and technical recruiter.
        Analyze the user's profile below and recommend 3 to 5 realistic, high-demand career paths or job roles that align with their skills and interests.
        
        User Profile:
        - Skills: {", ".join(skills)}
        - Interests: {", ".join(interests)}
        
        For each career path, provide:
        1. Recommended job role name.
        2. A description of why it fits their profile and what they'll do.
        3. A difficulty level: 'Beginner', 'Intermediate', or 'Advanced'.
        4. A sequential, step-by-step learning path of 4-6 topics. Each topic must have a title, detailed description of what to learn, and estimated weeks to learn it.
        5. Estimated total time to learn the entire career path (e.g., '12 Weeks (approx. 3 months)').
        
        Ensure suggestions are practical, clear, and actionable.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=CareerRecommendations,
                temperature=0.3
            )
        )
        
        # In google-genai, the response text contains the JSON string
        import json
        return json.loads(response.text)
        
    except Exception as e:
        print(f"[Gemini Integration] API Error: {str(e)}. Falling back to mock recommendations.")
        # Fallback to mock in case of API failure (e.g., network error or invalid key)
        return get_mock_recommendations(skills, interests)
