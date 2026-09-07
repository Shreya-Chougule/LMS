# LMS
A full-stack Learning Management System with student, teacher, and admin panels, featuring courses, assignments, quizzes, progress tracking, analytics, and certificates.
```markdown


## Features

### Student Features

- Browse and search available courses
- Filter courses by category and level
- Enroll in courses
- View course lessons and learning materials
- Watch video lessons and read text content
- Track lesson completion and course progress
- Attempt quizzes and view results
- Submit assignments
- View assignment grades and feedback
- Manage profile information and avatar
- View earned certificates

### Instructor Features

- Create and manage courses
- Add course modules
- Publish video, text, quiz, and assignment lessons
- Upload PDF resources
- Create quizzes and questions
- View course enrollments
- View student activity
- View enrollment analytics
- Monitor course performance

### Administrator Features

- View platform statistics
- Manage users
- Change user roles
- Activate or deactivate accounts
- Delete users
- View all courses
- View all enrollments
- Review and manage user reports

## Technology Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Responsive dashboard layouts
- Live Server for local development

### Backend

- Node.js
- Express.js
- REST API
- CommonJS modules
- Multer for file uploads
- CORS
- dotenv

### Backend Services

- Supabase Authentication
- Supabase PostgreSQL Database
- Supabase Storage

## Project Structure

```text
LMS/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── assignmentController.js
│   │   │   ├── authController.js
│   │   │   ├── certificateController.js
│   │   │   ├── courseController.js
│   │   │   ├── enrollmentController.js
│   │   │   ├── lessonController.js
│   │   │   ├── quizController.js
│   │   │   ├── reportsController.js
│   │   │   ├── storageController.js
│   │   │   └── userController.js
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── assignmentRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── certificateRoutes.js
│   │   │   ├── courseRoutes.js
│   │   │   ├── enrollmentRoutes.js
│   │   │   ├── lessonRoutes.js
│   │   │   ├── quizRoutes.js
│   │   │   ├── reportsRoutes.js
│   │   │   ├── storageRoutes.js
│   │   │   └── userRoutes.js
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   └── js/
│   ├── admin/
│   ├── instructor/
│   ├── student/
│   ├── components/
│   ├── course-catalog.html
│   ├── course-details.html
│   ├── learning-page.html
│   ├── login.html
│   └── register.html
│
└── README.md
```

## System Architecture

```text
Frontend Browser
      |
      | REST API requests
      | JSON data + Bearer token
      v
Express.js Backend
      |
      | Supabase JavaScript Client
      v
Supabase
 ├── Authentication
 ├── PostgreSQL Database
 └── Storage
```

## User Roles

The system supports three roles:

| Role | Responsibilities |
|------|------------------|
| Student | Enroll in courses, learn lessons, attempt quizzes, submit assignments |
| Instructor | Create courses, publish content, create quizzes, monitor students |
| Admin | Manage users, courses, enrollments, statistics, and reports |

## Database Entities

The application uses the following Supabase PostgreSQL tables:

- `users`
- `courses`
- `modules`
- `lessons`
- `enrollments`
- `progress`
- `quizzes`
- `quiz_questions`
- `quiz_results`
- `assignments`
- `assignment_submissions`
- `certificates`
- `reports`

The main relationships include:

```text
User → Courses
User → Enrollments
Course → Modules
Course → Lessons
Course → Quizzes
Quiz → Quiz Questions
User → Progress
User → Quiz Results
User → Assignment Submissions
User → Certificates
User → Reports
```

## Authentication Flow

1. A user registers using the registration page.
2. Supabase Auth creates the authentication account.
3. A matching profile is created in the `users` table.
4. During login, Supabase validates the email and password.
5. The backend returns an access token.
6. The frontend stores the token in browser `localStorage`.
7. Protected API requests send the token using:

```text
Authorization: Bearer <access_token>
```

8. The backend verifies the token and checks the user role.

## Course Learning Flow

```text
Browse Courses
      ↓
View Course Details
      ↓
Enroll in Course
      ↓
Open Learning Page
      ↓
View Lessons and Resources
      ↓
Mark Lessons as Complete
      ↓
Attempt Quizzes
      ↓
Submit Assignments
      ↓
Track Results and Progress
      ↓
Generate or Verify Certificate
```

## API Endpoints

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

### Courses

```text
GET    /api/courses
GET    /api/courses/:id
POST   /api/courses
PUT    /api/courses/:id
DELETE /api/courses/:id
GET    /api/courses/:id/modules
POST   /api/courses/:id/modules
```

### Lessons

```text
GET    /api/lessons?course_id=:courseId
POST   /api/lessons
PUT    /api/lessons/:id
DELETE /api/lessons/:id
```

### Enrollments and Progress

```text
POST /api/enrollments
GET  /api/enrollments/my
POST /api/enrollments/progress
GET  /api/enrollments/progress/:courseId
GET  /api/enrollments/instructor
GET  /api/enrollments/instructor/analytics
```

### Quizzes

```text
POST /api/quizzes
POST /api/quizzes/:id/questions
GET  /api/quizzes/:id
GET  /api/quizzes/course/:courseId
POST /api/quizzes/:id/submit
GET  /api/quizzes/results/my
```

### Assignments

```text
POST /api/assignments
GET  /api/assignments/course/:courseId
POST /api/assignments/:id/submit
GET  /api/assignments/my
GET  /api/assignments/:id/submissions
PUT  /api/assignments/submissions/:id/grade
```

### Users

```text
GET /api/users/profile
PUT /api/users/profile
GET /api/users/:id
```

### Certificates

```text
POST /api/certificates
GET  /api/certificates/my
GET  /api/certificates/verify/:certificateNumber
```

### Administration

```text
GET    /api/admin/stats
GET    /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
GET    /api/admin/enrollments
GET    /api/admin/courses
```

### File Storage

```text
POST   /api/storage/upload
DELETE /api/storage/delete
GET    /api/storage/signed-url
```

### Reports

```text
POST /api/reports
GET  /api/reports
PUT  /api/reports/:id
```

## Local Installation

### Prerequisites

Install the following:

- Node.js LTS
- npm
- Supabase account
- VS Code
- Live Server extension for frontend development

### Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd LMS
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

### Configure Environment Variables

Create a `.env` file inside the `backend` folder:

```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-or-publishable-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

Never commit `.env` files or service-role keys to GitHub.

### Start the Backend

From the `backend` directory:

```bash
npm run dev
```

For normal startup:

```bash
npm start
```

The backend runs on:

```text
http://localhost:5000
```

Test the API:

```text
http://localhost:5000/
```

Expected response:

```json
{
  "message": "Welcome to the LMS API"
}
```

### Start the Frontend

Open the `frontend` folder in VS Code.

1. Open `frontend/login.html`.
2. Right-click the file.
3. Select **Open with Live Server**.
4. Open the generated local URL in your browser.

The frontend communicates with:

```text
http://localhost:5000/api
```

## Supabase Setup

The Supabase project must contain:

### Database Tables

```text
users
courses
modules
lessons
enrollments
progress
quizzes
quiz_questions
quiz_results
assignments
assignment_submissions
certificates
reports
```

### Storage Buckets

```text
avatars
course-pdfs
```

The `avatars` bucket stores user profile images.

The `course-pdfs` bucket stores course-related PDF resources.

## Security

The application uses:

- Supabase Auth for authentication
- Bearer tokens for protected requests
- Role-based authorization
- Account activation/deactivation checks
- File type validation
- File size validation
- Ownership checks for instructor resources
- Service-role access only on the backend

The service-role key must remain private and must never be placed in frontend code.

Before production deployment, configure:

- Row Level Security policies
- Storage access policies
- HTTPS
- Production redirect URLs
- Secure environment variables
- Production email settings
- Rate limiting
- Server-side input validation

## Development Scripts

Inside the `backend` folder:

```bash
npm start       # Start the backend
npm run dev     # Start the backend with Nodemon
npm test        # Test command placeholder
```

## Current Scope

The current system includes course pricing and revenue calculations for display purposes, but it does not include:

- Payment gateway integration
- Order processing
- Refund management
- Transaction history
- Automated email notifications
- Dedicated database migration files
- Production deployment configuration

## Future Improvements

Possible future enhancements include:

- Payment gateway integration
- Course reviews and ratings
- Discussion forums
- Email notifications
- Password reset workflow
- Multiple quiz attempts
- Automated course completion detection
- Automated certificate generation
- Advanced reporting
- Instructor announcements
- Student messaging
- Database migrations
- Automated tests
- Production deployment

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

3. Make your changes.
4. Test the application.
5. Commit your changes:

```bash
git commit -m "Add your feature description"
```

6. Push the branch:

```bash
git push origin feature/your-feature-name
```

7. Open a pull request.

## License

This project is intended for educational and internship purposes.

## Author

Developed by Shreya Chougule.

GitHub:https://github.com/Shreya-Chougule
```
