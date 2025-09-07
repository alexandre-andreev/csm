# Technical Specification for Content Summarizer Application

## 1. Overview

The Content Summarizer is a web application that allows users to generate concise summaries of YouTube video content using AI technology. The application provides a user-friendly interface for entering YouTube URLs, generating summaries, saving them for future reference, and managing a history of previously created summaries.

## 2. Technology Stack

### Frontend
- **Framework**: Next.js 15.2.4 with React 19
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: shadcn/ui with Radix UI primitives
- **Language**: TypeScript for type safety
- **State Management**: React Context API and useState hooks

### Backend
- **API**: Next.js API Routes (serverless functions)
- **AI Processing**: Google Gemini Flash 2.5
- **Video Transcription**: YouTube Transcript API (via RapidAPI)
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL

### Infrastructure
- **Deployment**: Vercel
- **Database**: Supabase

## 3. Core Features

### 3.1 User Authentication
- Email/password authentication
- OAuth integration (Google, GitHub)
- Magic link sign-in
- Session management with automatic token refresh

### 3.2 Content Summarization
- YouTube URL input validation
- Video transcript extraction
- AI-powered content summarization using Google Gemini
- Summary display with markdown formatting

### 3.3 Summary Management
- Save summaries to user history
- View, search, and filter saved summaries
- Mark summaries as favorites
- Delete saved summaries

### 3.4 Dashboard
- User statistics (total summaries, favorites)
- Recent summaries display
- Quick access to summary creation

### 3.5 Responsive Design
- Mobile-friendly interface
- Adaptive layout for different screen sizes
- Dark mode support

## 4. Architecture

### 4.1 Frontend Structure
```
/app
  /auth - Authentication pages
  /dashboard - Main dashboard page
  /api - API route handlers
/components - Reusable UI components
/lib - Utility functions and services
/hooks - Custom React hooks
/styles - Global styles
```

### 4.2 Backend Structure
- **API Routes**: Serverless functions for handling business logic
- **Database Layer**: Supabase client for data operations
- **Authentication Layer**: Supabase Auth integration
- **AI Service**: Google Gemini integration for summarization
- **Transcript Service**: YouTube Transcript API integration

### 4.3 Data Models

#### Users
- id (UUID)
- email (string)
- display_name (string)
- avatar_url (string)
- created_at (timestamp)
- updated_at (timestamp)
- last_login (timestamp)
- last_seen (timestamp)
- is_active (boolean)

#### Summaries
- id (UUID)
- user_id (UUID, foreign key)
- youtube_url (string)
- video_id (string)
- video_title (string)
- video_duration (integer)
- transcript_text (text)
- summary_text (text)
- processing_time (integer)
- created_at (timestamp)
- is_favorite (boolean)
- tags (array of strings)

#### Usage Statistics
- id (UUID)
- user_id (UUID, foreign key)
- action (string)
- summary_id (UUID, foreign key)
- metadata (JSONB)
- created_at (timestamp)

## 5. Key Components

### 5.1 Auth Provider
Manages user authentication state, session handling, and token refresh.

### 5.2 Browser Tab Manager
Handles browser tab suspension detection and recovery mechanisms to maintain application responsiveness.

### 5.3 Dashboard Page
Main user interface displaying statistics, summary creation form, and recent summaries.

### 5.4 Summary Display
Component for rendering generated summaries with markdown support.

### 5.5 URL Form
Input component for YouTube URL with validation.

### 5.6 Database Service
Abstraction layer for all database operations.

### 5.7 Recovery Manager
Global manager for handling recovery operations across different pages.

## 6. API Endpoints

### 6.1 Authentication
- `/api/auth/login` - User login
- `/api/auth/signup` - User registration
- `/api/auth/logout` - User logout

### 6.2 Summarization
- `/api/summarize` - Generate summary from YouTube URL
- `/api/save-summary` - Save summary to database

### 6.3 Dashboard
- `/api/dashboard` - Get user dashboard statistics

### 6.4 User Management
- `/api/update-last-seen` - Update user's last seen timestamp

## 7. Security Considerations

### 7.1 Authentication
- Secure password handling
- Token-based authentication
- Session management with automatic refresh
- Row Level Security (RLS) for database access

### 7.2 Data Protection
- HTTPS encryption
- Secure API key storage
- Input validation and sanitization
- Protection against common web vulnerabilities

### 7.3 Privacy
- User data encryption
- GDPR compliance
- Data retention policies

## 8. Performance Requirements

### 8.1 Response Times
- API responses: < 500ms for simple operations
- Summary generation: < 30 seconds
- Page loads: < 2 seconds

### 8.2 Scalability
- Support for 1000+ concurrent users
- Database query optimization
- Caching strategies for frequently accessed data

### 8.3 Reliability
- 99.9% uptime
- Error handling and recovery mechanisms
- Automated backups

## 9. Testing Strategy

### 9.1 Unit Testing
- Component testing with Jest
- API route testing
- Service layer testing

### 9.2 Integration Testing
- End-to-end testing with Cypress
- Database integration testing
- API integration testing

### 9.3 Performance Testing
- Load testing
- Stress testing
- Monitoring and alerting

## 10. Deployment

### 10.1 Environment
- Production: Vercel
- Database: Supabase
- Monitoring: Vercel Analytics

### 10.2 CI/CD
- Automated testing on pull requests
- Staging deployment for preview
- Production deployment with rollback capability

### 10.3 Monitoring
- Error tracking
- Performance monitoring
- User analytics

## 11. Maintenance

### 11.1 Updates
- Regular dependency updates
- Security patches
- Feature enhancements

### 11.2 Backup and Recovery
- Automated database backups
- Disaster recovery procedures
- Data migration processes

### 11.3 Support
- User support documentation
- Issue tracking system
- Community feedback integration