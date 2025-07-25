# SignalIQ - AI-Powered B2B Lead Generation Platform

## 🚀 Features
Modern B2B lead generation platform with AI-powered lead discovery, signal tracking, and comprehensive CRM integration.
- **AI Lead Generation**: Natural language queries to find companies and contacts
- **Smart Signal Tracking**: AI-generated signals for lead identification
- **Website Analysis**: Automated company research and profiling
- **ICP Management**: Ideal Customer Profile creation and management
- **Real-time Chat**: Interactive AI assistant for lead discovery
- **Export Capabilities**: CSV export for CRM integration
- **Modern UI**: Beautiful, responsive interface built with React + Tailwind
## 🏗️ Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: FastAPI + SQLAlchemy 2.x + AsyncPG
- **Database**: PostgreSQL with async support
- **AI**: OpenAI GPT-4 with structured outputs
- **Authentication**: Supabase Auth with JWT tokens
- **Deployment**: Docker + Railway
## 🛠️ Development Setup
### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose
### Local Development
1. **Clone the repository**
```bash
git clone <repository-url>
cd signaliq
```
2. **Set up environment variables**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials
```
3. **Start with Docker Compose**
```bash
docker-compose up -d
```
4. **Run database migrations**
```bash
cd backend
alembic upgrade head
```
5. **Access the application**
- Frontend: http://localhost:5000
- API Docs: http://localhost:5000/docs
- Database: localhost:5432
### Manual Development Setup
1. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 5000
```
2. **Frontend Setup**
```bash
npm install
npm run dev
```
## 🚀 Deployment
### Railway Deployment
1. **Prepare environment variables in Railway:**
```bash
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=your_postgresql_url
JWT_SECRET_KEY=your_jwt_secret
```
2. **Deploy using Railway CLI:**
```bash
railway login
railway up
```
3. **Or connect your GitHub repository to Railway for automatic deployments**
### Docker Deployment
1. **Build and run with Docker:**
```bash
docker build -t signaliq .
docker run -p 5000:5000 \
  -e DATABASE_URL="your_db_url" \
  -e OPENAI_API_KEY="your_key" \
  signaliq
```
2. **Use Docker Compose for full stack:**
```bash
docker-compose up -d
```
## 📊 Database Schema
The application uses a comprehensive database schema with:
- **Users & Authentication**: User profiles and authentication data
- **Conversations & Messages**: Chat history and AI interactions
- **Lead Management**: Flexible lead storage with dynamic schemas
- **ICP Profiles**: Ideal Customer Profile definitions
- **Signal Tracking**: AI-generated lead identification signals
## 🤖 AI Integration
### OpenAI Templates
The application uses a modular OpenAI template system:
- **Website Analysis**: Extract company information from websites
- **Signal Generation**: Create targeted lead tracking signals
- **Lead Generation**: Natural language lead discovery
### Example API Usage
```python
# Generate lead tracking signals
POST /api/v1/openai/generate-signals
{
  "icp_id": "uuid",
  "company_info": "AI analytics platform"
}
# Analyze company website
POST /api/v1/openai/analyze-website
{
  "website_url": "https://company.com",
  "website_content": "<html>...</html>"
}
```
## 📝 API Documentation
- **Interactive Docs**: `/docs` (Swagger UI)
- **ReDoc**: `/redoc` (Alternative documentation)
- **OpenAPI Schema**: `/openapi.json`
### Key Endpoints
- `POST /api/v1/leads/generate` - Generate leads with AI
- `GET /api/v1/conversations` - List user conversations
- `POST /api/v1/users/icp-profiles` - Create ICP profiles
- `POST /api/v1/openai/generate-signals` - Generate tracking signals
## 🔒 Security
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Pydantic models for request validation
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries
- **Environment Variables**: Secure credential management
## 🧪 Testing
```bash
# Backend tests
cd backend
pytest
# Frontend tests
npm test
# Integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```
## 📈 Monitoring & Logging
- **Health Checks**: `/health` endpoint for monitoring
- **Structured Logging**: JSON logs for production
- **Error Tracking**: Comprehensive error handling
- **Performance Metrics**: Built-in FastAPI metrics
## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request
## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
## 🆘 Support
For support, please open an issue on GitHub or contact the development team.