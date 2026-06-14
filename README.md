# AI Career Path Recommender

An intelligent career advisor powered by Google's Gemini AI that analyzes your skills and interests to generate personalized career recommendations, custom learning pathways, and track your professional growth.

## 🌟 Features

- **AI-Powered Recommendations**: Uses Google Gemini to analyze your skills and interests, providing intelligent career path suggestions
- **Personalized Learning Paths**: Generates custom learning pathways tailored to recommended career roles
- **Progress Tracking**: Track your progress on recommended learning topics and mark completed items
- **Multi-role Support**: Explore multiple recommended career paths simultaneously
- **Persistent Storage**: Save and retrieve your recommendations and progress history
- **Dark Mode Support**: Modern UI with light and dark mode options
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework for building APIs
- **Uvicorn** - ASGI server for running FastAPI applications
- **Google Genai** - Integration with Google's Gemini AI model
- **SQLAlchemy** - SQL toolkit and Object Relational Mapper (ORM)
- **PostgreSQL** - Relational database for storing recommendations and user data
- **Pydantic** - Data validation using Python type annotations

### Frontend
- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript (Vanilla)** - Interactive client-side functionality
- **Font Awesome** - Icon library

### Deployment
- **Vercel** - Serverless hosting platform

## 📋 Prerequisites

- Python 3.8 or higher
- PostgreSQL database
- Google Gemini API key
- pip (Python package manager)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/AmjadKhan88/ai-career-recommender.git
cd ai-career-recommender
```

### 2. Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/career_recommender
GOOGLE_GENAI_API_KEY=your_gemini_api_key_here
```

### 5. Initialize Database
The database tables are automatically initialized when the application starts.

### 6. Run the Application
```bash
# Using Uvicorn directly
uvicorn api.index:app --reload

# Or use FastAPI CLI
fastapi run api/index.py --reload
```

The application will be available at `http://localhost:8000`

## 📁 Project Structure

```
ai-career-recommender/
├── api/
│   ├── index.py              # Main FastAPI application
│   ├── database.py           # Database configuration and utilities
│   ├── models.py             # SQLAlchemy database models
│   ├── gemini.py             # Gemini AI integration
│   └── __init__.py
├── static/
│   ├── index.html            # Main HTML file
│   ├── style.css             # Custom styles
│   └── app.js                # Frontend JavaScript logic
├── requirements.txt          # Python dependencies
├── vercel.json              # Vercel deployment configuration
└── README.md                # This file
```

## 🔌 API Endpoints

### POST `/api/recommend`
Generates career recommendations based on skills and interests.

**Request Body:**
```json
{
  "skills": ["Python", "Javascript", "SQL"],
  "interests": ["Artificial Intelligence", "Web Development"]
}
```

**Response:**
```json
{
  "recommendation_id": "uuid",
  "roles": [
    {
      "role_name": "Machine Learning Engineer",
      "description": "...",
      "learning_path": [
        {
          "topic_title": "Advanced Python Programming",
          "description": "...",
          "is_completed": false
        }
      ]
    }
  ],
  "created_at": "2024-06-14T10:30:00Z"
}
```

### GET `/api/recommendations`
Retrieve all saved recommendations.

### POST `/api/progress`
Update progress on a specific learning topic.

**Request Body:**
```json
{
  "recommendation_id": "uuid",
  "role_name": "Machine Learning Engineer",
  "topic_title": "Advanced Python Programming",
  "is_completed": true
}
```

## 🗄️ Database Models

### Recommendation
- `id` - Unique identifier (UUID)
- `skills` - List of user skills
- `interests` - List of user interests
- `roles` - JSON array of recommended roles
- `created_at` - Timestamp of creation
- `updated_at` - Timestamp of last update

### Progress
- `id` - Unique identifier (UUID)
- `recommendation_id` - Reference to recommendation
- `role_name` - Name of the career role
- `topic_title` - Learning topic title
- `is_completed` - Completion status
- `created_at` - Timestamp of creation

## 🤖 Using Google Gemini AI

The application integrates with Google's Gemini AI to generate intelligent career recommendations. The AI analyzes:
- Your technical and professional skills
- Your career interests and preferences
- Industry trends and role requirements
- Personalized learning paths for each recommended role

### Setting Up Gemini API
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `GOOGLE_GENAI_API_KEY`

## 🌐 Deployment on Vercel

### Prerequisites
- Vercel account
- GitHub repository connected to Vercel

### Steps
1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `GOOGLE_GENAI_API_KEY`
4. Deploy!

Vercel will automatically:
- Build the FastAPI application
- Serve static files
- Route API requests appropriately

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GOOGLE_GENAI_API_KEY` | Google Gemini API key | Yes |

## 🔧 Development

### Running Tests
```bash
pytest
```

### Code Quality
```bash
# Format code
black api/ static/

# Lint code
flake8 api/

# Type checking
mypy api/
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Amjad Khan** - Initial work - [AmjadKhan88](https://github.com/AmjadKhan88)

## 📞 Support

For support, email support@example.com or open an issue on GitHub.

## 🙏 Acknowledgments

- Google Gemini AI for powering intelligent recommendations
- FastAPI community for excellent documentation
- Tailwind CSS for beautiful styling
- Internee.pk for the platform

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Google Gemini API Docs](https://ai.google.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

**Made with ❤️ by Amjad Khan**
