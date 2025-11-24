# Study Tracker Web

## 1. Introduction
**Study Tracker** is an innovative web application specifically designed to empower students in managing their academic time effectively through the powerful combination of the Pomodoro technique, gamification elements, and comprehensive data analytics. In today's fast-paced academic environment, students often struggle with time management, motivation, and maintaining consistent study habits. Our application addresses these challenges by providing a holistic solution that not only helps track study time but also enhances the overall learning experience.

The application transforms traditional study methods into an engaging, interactive journey. By integrating proven time management techniques with modern technology, Study Tracker helps students develop sustainable study habits while providing valuable insights into their learning patterns. The platform understands that effective learning isn't just about spending hours with books, it's about quality, consistency, and understanding one's own learning process.

What sets Study Tracker apart is its multi-faceted approach to student productivity. We recognize that motivation fluctuates, and maintaining consistent study habits can be challenging. That's why we've built a system that not only tracks your study time but also rewards your efforts, understands your emotional state, and provides actionable insights to help you optimize your learning strategy. The application serves as both a practical tool and a motivational companion throughout your academic journey.

## 2. Key Feautures
### 🔐 User Management System
- **Secure Registration & Authentication**: Robust account system ensuring data privacy and security.
- **Personalized Learning Profiles**: Customizable profiles that adapt to individual study preferences and goals.
- **Comprehensive Data Storage**: All study sessions, progress metrics, and personal achievements are securely stored for long-term analysis and tracking.

### ⏰ Intelligent Pomodoro Timer
- **Adaptive Study Sessions**: Customizable work intervals with scientifically-proven break periods to maximize focus and retention.
- **Detailed Session Analytics**: Comprehensive tracking of study duration, subject distribution, and productivity patterns over time.
- **Smart Subject Organization**: Categorize and analyze study time across different academic subjects and topics.

### 😊 Emotion & Wellness Tracking
- **Post-Session Mood Assessment**: Systematic emotional state recording after each study session to identify patterns.
- **Emotional Intelligence Insights**: Correlate study effectiveness with emotional states to optimize learning conditions.
- **Mental Wellness Monitoring**: Track how study habits impact overall well-being and academic performance.

### 📊 Advanced Visualization & Analytics
- **Interactive Study Dashboards**: Dynamic charts and graphs displaying study time distribution, progress trends, and subject performance.
- **Emotional Analytics Suite**: Visual representations of mood patterns and their relationship with study effectiveness.
- **Comprehensive Progress Reports**: Detailed analytics providing insights into study habits, productivity patterns, and achievement milestones.

### ✅ Smart Task Management
- **Intelligent Todo System**: Create, prioritize, and organize academic tasks with smart categorization.
- **Machine Learning Predictions**: AI-driven time estimation for task completion based on historical performance and complexity analysis.
- **Productivity Optimization**: Smart suggestions for task scheduling and priority management based on learning patterns.

### 🎮 Engaging Gamification Ecosystem
- **Virtual Economy System**: Earn and spend virtual coins through consistent study habits and task completion.
- **Avatar Collection Gallery**: Unlock and collect unique virtual characters through academic achievements.
- **Motivational Reward Structure**: Progressive achievement system that maintains long-term engagement and study consistency.
- **Personalized Learning Journey**: Transform routine studying into an exciting, rewarding experience through game-like elements.

## 3. Development Team & Contributions

|Name | Student ID | Role | Key Contributions & Responsibilities | Contribution % |
|------|-------|-------------------|-----------|----------|
| **Nguyễn Phương Ngân**<br/>*(Project Leader)* | 11245914 | Backend Architect &<br/>Full-stack Integration | • Designed and implemented core database models and architecture<br/>• Engineered seamless backend-frontend integration for real-time data display<br/>• Led the development of the Pomodoro Timer with advanced tracking features<br/>• Implemented robust user authentication and account management systems<br/>• Orchestrated the complete application integration and system architecture | 16.7% |
| **Đỗ Phạm Hà Chi**<br/>*(Frontend Lead)* | 11245851 | Frontend Architecture &<br/>Machine Learning | • Spearheaded frontend development and established UI/UX standards<br/>• Developed the intelligent Todo application with predictive analytics<br/>• Implemented machine learning models for task completion time prediction<br/>• Integrated music functionality to enhance study environment and focus<br/>• Established frontend development protocols and component libraries | 16.66% |
| **Đinh Nguyễn Anh Thư**<br/>*(UI/UX Designer)* | 11245936 | Frontend Development &<br/>Gamification Design | • Created engaging gamification systems and reward mechanisms<br/>• Designed intuitive user interfaces with focus on user experience<br/>• Developed comprehensive presentation materials and project documentation<br/>• Implemented visual design systems and interactive UI components | 16.66% |
| **Lê Thùy Dương**<br/>*(Frontend Developer)* | 11245864 | Emotion Tracking &<br/>Interface Design | • Built comprehensive emotion tracking and analysis features<br/>• Developed responsive and accessible user interface components<br/>• Created engaging presentation assets and user documentation<br/>• Implemented frontend functionality for mood pattern visualization | 16.66% |
| **Trần Khánh Linh**<br/>*(Frontend Developer)* | 11245897 | UI Development &<br/>User Experience | • Contributed to Pomodoro timer interface design and functionality<br/>• Implemented light/dark mode toggle for enhanced user comfort<br/>• Developed responsive UI components and interactive elements<br/>• Enhanced overall user experience through intuitive design choices | 16.66% |
| **Chu Bá Thông**<br/>*(Backend Developer)* | 11245935 | Data Visualization &<br/>Analytics Engine | • Engineered robust backend systems for data visualization<br/>• Developed chart generation and statistical analysis algorithms<br/>• Implemented data processing pipelines for analytics features<br/>• Built comprehensive data aggregation and reporting systems | 16.66% |
| **Total** |  | **All Team Members** | **Collaborative project planning, testing, and deployment** | **100%** |


## 4. Installation & Setup Guide

### Prerequisites
- **Python 3.13** (Latest stable version)
- **Django 5.x** (Web framework for backend development)
- **Git** for version control and repository management
- **Virtual Environment** support for dependency isolation

### Configuration Notes
- The application utilizes SQLite3 as the default database for development
- All required Python packages and versions are specified in requirements.txt
- No additional external services or API keys are required for basic functionality
- The development server is configured for immediate use after installation

### Comprehensive Installation Steps

#### Step 1: Clone the Repository
```bash
git clone https://github.com/phngan23/StudyTrackerWeb_Group4_DSEB66B.git
cd StudyTrackerWeb_Group4_DSEB66B
```
### Step 2: Create and Activate Virtual Environment (run step-by-step)
Window:
```bash
python -m venv .venv
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned # run if error
.venv\Scripts\activate
```
Mac:
```bash
python3 -m venv .venv
source .venv/bin/activate
```
### Step 3: Install Project Dependencies
```bash
pip install -r requirements.txt
```
### Step 4: Database Setup and Migration
```bash
python manage.py makemigrations
python manage.py migrate
```
### Step 5: Load Initial Data 
```bash
python manage.py seed_characters
```
### Step 6: Launch Development Server
```bash
python manage.py runserver
```
### Step 7: Access the Application
Open your preferred web browser and navigate to: http://127.0.0.1:8000/

## 5. Project Structure & Organization
```text
StudyTrackWeb_Group4_DSEB66B/
│
├── accounts/         # User authentication & profile management
├── study/            # Pomodoro timer and study session tracking
├── emotion/          # Mood logging and emotional analytics
├── visualization/    # Data visualization and analytic reports
├── todo/             # Task and deadline management
├── gamification/     # Reward system and virtual shop
├── music/            # Focus music and audio features
│
├── frontend/         # Front-end UI (Home page + assets)
│   ├── templates/frontend/   # Home page (index.html) and UI pages
│   └── static/               # CSS, JS, images, and other assets
│
├── templates/        # Shared Django templates (base.html, layouts)
├── static/           # Collected static files for production
│
├── studyhabit/       # Django project configuration (settings, urls)
├── requirements.txt  # Python dependencies
├── manage.py         # Django management script
└── .gitignore        # Git ignore rules
```

## 6. User Guide
### Getting Started with Study Tracker
Begin your productivity journey by creating a personalized account that will track your progress and adapt to your study patterns. The intuitive setup process guides you through configuring your study preferences, including preferred session lengths, break durations, and academic subjects.

### Mastering Study Sessions
Leverage our intelligent Pomodoro timer to transform your study habits. Start by selecting your current subject, set your desired study duration, and let the system guide you through productive work intervals followed by restorative breaks. Track your progress in real-time as you accumulate study hours and earn rewards for your consistency.

### Advanced Feature Utilization
- Task Management: Create smart task lists that help you prioritize academic responsibilities while receiving AI-powered predictions about completion time
- Emotion Tracking: Develop self-awareness by logging your post-study moods and discovering patterns between your emotional state and study effectiveness
- Gamification Engagement: Build your virtual avatar collection and climb the achievement ladder by maintaining consistent study habits
- Analytics Review: Regularly check your personalized dashboards to understand your study patterns and identify opportunities for improvement
## 7. tutorial video
https://drive.google.com/drive/folders/1mpMfJQ1ZTw3zmMOnHpcSVszA5I3uJbkB?usp=sharing
