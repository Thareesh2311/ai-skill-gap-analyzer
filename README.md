# ai-skill-gap-analyzer

AI Skill Gap Analyzer

A full-stack career-readiness platform that analyzes a user's resume against company/job-role requirements, identifies matched and missing skills, provides MCQ/Coding/SQL assessments, calculates job readiness, and generates personalized learning recommendations with progress tracking.

Current Status

Version: v1.0
Status: Development complete and deployed successfully.

The production architecture is:

React + Vite Frontend
        |
        v
      Vercel
        |
        v
Node.js + Express API
        |
        v
 Render (Docker)
        |
        +-------------------+
        |                   |
        v                   v
 MongoDB Atlas      YouTube Data API v3

The backend Docker image also includes Python 3 and Java 17 because the coding-assessment runner executes Python, JavaScript/Node.js, and Java submissions.

Features

JWT authentication

User registration and login

Resume upload (PDF/DOC/DOCX)

Resume text parsing

Skill extraction

Company/job-role selection

Skill-gap analysis

Matched and missing skill detection

Coverage percentage

MCQ assessments

Coding assessments

SQL assessments

Public coding test-case execution

Hidden coding test-case evaluation on final submission

SQLite sandbox for SQL execution

Hidden SQL test evaluation on final submission

Assessment scores and result pages

Skill-wise performance analytics

Difficulty-wise analytics

Assessment trends

Job-readiness calculation

Weak-skill detection

Personalized learning recommendations

YouTube learning-resource integration

Learning roadmap

Learning-progress tracking

React protected routes

Dockerized production backend

Render deployment

Vercel deployment

MongoDB Atlas database

Technology Stack

Frontend

React 19

Vite

React Router

Axios

Bootstrap / React Bootstrap

Monaco Editor

Chart.js

react-chartjs-2

HTML

CSS

Backend

Node.js 22

Express.js

MongoDB

Mongoose

JWT

bcryptjs

Multer

pdf-parse

Mammoth

better-sqlite3

Assessment Execution

JavaScript / Node.js

Python 3

Java 17

SQLite in-memory databases

External Services

MongoDB Atlas

YouTube Data API v3

Render

Vercel

GitHub

Docker

Project Structure

ai-skill-gap-analyzer/
|
|-- ai-service/
|   |-- main.py
|   `-- requirements.txt
|
|-- client/
|   |-- public/
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |-- context/
|   |   |-- layouts/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- styles/
|   |   |-- App.jsx
|   |   `-- main.jsx
|   |-- package.json
|   |-- vite.config.js
|   `-- vercel.json
|
|-- data/
|   |-- assessmentQuestions.json
|   |-- codingQuestions.json
|   |-- companies.json
|   |-- job_requirements.json
|   |-- learningResources.json
|   |-- roles.json
|   |-- skills.json
|   `-- sqlQuestions.json
|
|-- server/
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- services/
|   |-- uploads/
|   |-- utils/
|   |-- Dockerfile
|   |-- package.json
|   |-- package-lock.json
|   |-- seed.js
|   |-- seedAssessments.js
|   |-- seedCodingQuestions.js
|   |-- seedLearningResources.js
|   |-- seedSQLQuestions.js
|   `-- server.js
|
`-- README.md

ai-service/ is present in the repository. The deployed v1.0 flow documented here is centered on the Node/Express backend. Only start the separate Python service if your current branch explicitly calls it.

Live / Production URLs

Frontend

Current Vercel deployment used during production testing:

https://ai-skill-gap-analyzer-e3a4v3uuj-gatti-thareesh-kumars-projects.vercel.app

If Vercel later assigns a different stable production alias, use that alias as the public application URL and update CLIENT_URL on Render.

Backend

https://ai-skill-gap-analyzer-74oz.onrender.com

Backend Health Check

https://ai-skill-gap-analyzer-74oz.onrender.com/api/health

Backend Root Test

https://ai-skill-gap-analyzer-74oz.onrender.com/

Local Testing URLs

Frontend

http://localhost:5173

Backend

http://localhost:5000

Backend Health

http://localhost:5000/api/health

Backend Root

http://localhost:5000/

When Docker is used locally, host port 5000 maps to container port 10000.

API Testing URLs

Use one of these base URLs:

Local

http://localhost:5000/api

Production

https://ai-skill-gap-analyzer-74oz.onrender.com/api

Most protected endpoints require:

Authorization: Bearer <JWT_TOKEN>

Authentication

POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

Reference Data

Backend route bases:

/api/companies
/api/job-roles
/api/skills
/api/job-requirements

Resume / Skill Gap

Backend route base:

/api/resumes

The frontend workflow performs:

Resume Upload
     |
     v
Skill Extraction
     |
     v
Skill Gap Analysis

Resume files accepted by the frontend:

PDF
DOC
DOCX
Maximum size: 5 MB

Assessments

Verified assessment endpoints:

POST /api/assessments/create
POST /api/assessments/:assessmentId/start
POST /api/assessments/:assessmentId/submit
GET  /api/assessments/:assessmentId/result

GET  /api/assessments/final-readiness/:resumeId
GET  /api/assessments/progress/:resumeId
GET  /api/assessments/analytics/:resumeId

SQL run endpoint:

POST /api/assessments/:assessmentId/run-sql

Coding assessment also contains a server-side "Run Code" action for public tests. Check the current server/routes/assessmentRoutes.js for the exact run-code route if it is changed between branches.

Learning

Verified learning-plan URL pattern:

GET /api/learning/plan/:resumeId

Example:

http://localhost:5000/api/learning/plan/<RESUME_ID>?maxSkills=5&resourcesPerSkill=6

Production:

https://ai-skill-gap-analyzer-74oz.onrender.com/api/learning/plan/<RESUME_ID>?maxSkills=5&resourcesPerSkill=6

Prerequisites

Install the following before running the project locally:

Git

Node.js 22+

npm

Docker Desktop

MongoDB Atlas account

YouTube Data API key (for live learning resources)

For direct Windows execution of the Node backend without Docker, better-sqlite3 may require:

Visual Studio 2022 Build Tools

Desktop development with C++

MSVC C++ build tools

Windows SDK

Python installed and visible to node-gyp

Docker is the recommended backend environment because the image already contains the required native build/runtime dependencies.

Clone the Repository

git clone https://github.com/Thareesh2311/ai-skill-gap-analyzer.git
cd ai-skill-gap-analyzer

Check repository state:

git status
git branch
git remote -v

Pull the latest version:

git pull origin main

Environment Variables

Backend

Create:

server/.env

Example:

PORT=5000

MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER.mongodb.net/test

JWT_SECRET=replace_with_a_long_random_secret

YOUTUBE_API_KEY=replace_with_your_youtube_api_key
YOUTUBE_ENABLED=true
YOUTUBE_CACHE_TTL_HOURS=24
YOUTUBE_MAX_RESULTS=6
YOUTUBE_REGION_CODE=IN
YOUTUBE_RELEVANCE_LANGUAGE=en
YOUTUBE_SAFE_SEARCH=strict

NODE_ENV=development

CLIENT_URL=http://localhost:5173

For production on Render:

NODE_ENV=production
CLIENT_URL=https://YOUR-PRODUCTION-VERCEL-URL.vercel.app

Optional multiple frontend origins may be configured if supported by the current server.js:

CLIENT_URLS=https://frontend-1.vercel.app,https://frontend-2.vercel.app

Frontend

Create:

client/.env.local

Local:

VITE_API_URL=http://localhost:5000/api

Production Vercel environment variable:

VITE_API_URL=https://ai-skill-gap-analyzer-74oz.onrender.com/api

VITE_API_URL is a browser-visible Vite configuration value. In Vercel it should be configured as Config, not as a secret variable.

Security Rules

Never commit:

server/.env
client/.env
client/.env.local

Never commit or publish:

MongoDB passwords

MONGODB_URI

JWT_SECRET

YouTube API keys

Bearer tokens

user passwords

Before pushing, verify the backend .env is not tracked:

git ls-files server/.env

Expected result:

(no output)

If it is tracked:

git rm --cached server/.env
git commit -m "security: remove environment file"
git push origin main

Do not log full JWT bearer tokens in production.

Recommended Local Setup

The most reliable setup is:

Frontend -> npm/Vite
Backend  -> Docker
Database -> MongoDB Atlas

1. Build Backend Docker Image

cd C:\Users\gatti\Desktop\ai-skill-gap-analyzer\server
docker build -t ai-skill-gap-server .

Force a complete rebuild:

docker build --no-cache -t ai-skill-gap-server .

Verify:

docker images

2. Run Backend Container

Temporary container:

docker run --rm --env-file .env -e PORT=10000 -p 5000:10000 ai-skill-gap-server

Recommended named container:

docker run --name ai-skill-gap-backend --env-file .env -e PORT=10000 -p 5000:10000 ai-skill-gap-server

Expected backend output:

MongoDB Connected Successfully
Database: test
Server running on port 10000

Test:

http://localhost:5000/api/health

3. Start Frontend

Open another terminal:

cd C:\Users\gatti\Desktop\ai-skill-gap-analyzer\client
npm install
npm run dev

Then open:

http://localhost:5173

Docker Commands

Docker Status

docker info
docker desktop status
docker desktop start
docker desktop restart

Build

docker build -t ai-skill-gap-server .
docker build --no-cache -t ai-skill-gap-server .

Images and Containers

docker images
docker ps
docker ps -a

Start / Stop Named Backend

docker start ai-skill-gap-backend
docker stop ai-skill-gap-backend
docker rm ai-skill-gap-backend

Logs

docker logs ai-skill-gap-backend
docker logs -f ai-skill-gap-backend

Enter Container

docker exec -it ai-skill-gap-backend sh

Verify Runtime Versions

docker exec ai-skill-gap-backend node --version
docker exec ai-skill-gap-backend python3 --version
docker exec ai-skill-gap-backend java -version
docker exec ai-skill-gap-backend javac -version

Check Port 5000

netstat -ano | findstr :5000

If a Docker container owns it:

docker ps
docker stop <CONTAINER_ID>

If a Windows process owns it:

tasklist /FI "PID eq <PID>"
taskkill /PID <PID> /F

Alternative Host Port

docker run --rm --env-file .env -e PORT=10000 -p 5001:10000 ai-skill-gap-server

Backend Commands

cd server

Install

npm install
npm ci
npm ci --omit=dev
npm ci --include=dev

Run

npm start
npm run dev

Existing Seeder Scripts

npm run seed
npm run seed:assessments
npm run seed:sql
npm run seed:coding

Learning resources:

node seedLearningResources.js

Equivalent direct commands:

node seed.js
node seedAssessments.js
node seedSQLQuestions.js
node seedCodingQuestions.js
node seedLearningResources.js

Important: inspect seed scripts before running them against production. Some seeders may delete/replace existing collection data.

Dependency Checks

npm list express
npm list nodemon
npm list better-sqlite3

npm Diagnostics

npm cache verify
npm audit
npm audit fix

Windows Native Backend Troubleshooting

If better-sqlite3 fails with node-gyp and Visual Studio is missing, install Visual Studio Build Tools with:

Desktop development with C++

Then:

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
cmd /c "rmdir /s /q node_modules"
Test-Path node_modules
npm cache verify
npm ci

Using Docker is usually simpler because the Linux image already contains the required build tools.

Frontend Commands

cd client
npm install
npm run dev
npm run build
npm run preview
npm run lint

Vite build output:

client/dist/

Testing the Backend from PowerShell

Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod https://ai-skill-gap-analyzer-74oz.onrender.com/api/health
Invoke-RestMethod http://localhost:5000/

Testing with curl

Health

curl http://localhost:5000/api/health
curl https://ai-skill-gap-analyzer-74oz.onrender.com/api/health

Register

curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPassword123"}'

Login

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123"}'

Authenticated Route

curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

Database Seeding Order

A practical fresh-database order is:

1. Base companies / roles / skills / requirements
2. MCQ questions
3. Coding questions
4. SQL questions
5. Learning resources

Commands:

cd server
npm run seed
npm run seed:assessments
npm run seed:coding
npm run seed:sql
node seedLearningResources.js

Git Commands Used During Development

git status
git branch
git remote -v
git pull origin main

Add GitHub remote:

git remote add origin https://github.com/Thareesh2311/ai-skill-gap-analyzer.git

Change existing remote:

git remote set-url origin https://github.com/Thareesh2311/ai-skill-gap-analyzer.git

Stage and commit:

git add .
git commit -m "your commit message"

Push:

git push origin main
git push -u origin main

Deployment-related examples:

git commit -m "deploy: prepare backend for production"
git commit -m "deploy: configure frontend for Vercel"
git commit -m "fix: use production API URL on Vercel"

Render Deployment

Provider: Render
Service Type: Web Service
Repository: Thareesh2311/ai-skill-gap-analyzer
Branch: main
Root Directory: server
Runtime: Docker
Health Check: /api/health

Production environment variables:

MONGODB_URI
JWT_SECRET
NODE_ENV=production
YOUTUBE_API_KEY
YOUTUBE_ENABLED=true
YOUTUBE_CACHE_TTL_HOURS=24
YOUTUBE_MAX_RESULTS=6
YOUTUBE_REGION_CODE=IN
YOUTUBE_RELEVANCE_LANGUAGE=en
YOUTUBE_SAFE_SEARCH=strict
CLIENT_URL=https://YOUR-VERCEL-PRODUCTION-URL

Vercel Deployment

Provider: Vercel
Repository: Thareesh2311/ai-skill-gap-analyzer
Root Directory: client
Framework: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install

Environment:

VITE_API_URL=https://ai-skill-gap-analyzer-74oz.onrender.com/api

Use Config visibility for VITE_API_URL.

After changing VITE_API_URL, redeploy because Vite injects frontend environment variables at build time.

CORS Configuration

Local frontend:

http://localhost:5173

Production:

CLIENT_URL=https://YOUR-VERCEL-PRODUCTION-URL

A production Vercel app must never call:

http://localhost:5000

It must call:

https://ai-skill-gap-analyzer-74oz.onrender.com/api

Assessment Flow

Resume Upload
     |
     v
Skill Extraction
     |
     v
Company + Role Requirements
     |
     v
Skill Gap Analysis
     |
     +------------------+
     |        |         |
     v        v         v
    MCQ     Coding     SQL
     |        |         |
     +--------+---------+
              |
              v
     Assessment Analytics
              |
              v
        Job Readiness
              |
              v
          Weak Skills
              |
              v
   Learning Recommendations
              |
              v
   Personalized Roadmap
              |
              v
   Learning Progress Tracking

Coding Assessment Notes

Run Code

Executes public test cases only

Shows pass/fail and execution time

Does not expose hidden tests

Does not calculate final assessment score

Submit Assessment

Performs final evaluation

Includes hidden cases

Calculates and stores the score

Current backend execution runtimes:

Python
JavaScript / Node.js
Java

SQL Assessment Notes

Run Query

Uses an in-memory SQLite sandbox

Uses public schema/sample data

Returns rows, columns, errors, and execution time

Does not expose hidden scoring data

Submit Assessment

Evaluates against hidden test data

Compares expected results

Calculates partial/final score

Stores the result

Common Errors and Fixes

ERR_CONNECTION_REFUSED to localhost:5000

Start the backend:

docker start ai-skill-gap-backend

or recreate it:

docker run --rm --env-file .env -e PORT=10000 -p 5000:10000 ai-skill-gap-server

Production Frontend Calls localhost

Set:

VITE_API_URL=https://ai-skill-gap-analyzer-74oz.onrender.com/api

Then redeploy Vercel.

CORS Error

Set the exact Vercel origin in Render:

CLIENT_URL=https://YOUR-VERCEL-PRODUCTION-URL

Then redeploy Render.

MongoDB URI Undefined

Ensure:

MONGODB_URI=...

exists locally or in Render Environment.

When using Docker manually:

--env-file .env

Docker Port Already Allocated

docker ps
netstat -ano | findstr :5000

Stop whichever process/container owns the port.

Docker Daemon Not Running

docker desktop status
docker desktop start
docker info

WSL:

wsl --status
wsl -l -v
wsl --update
wsl --shutdown

Production Smoke-Test Checklist

[ ] Backend root opens
[ ] /api/health returns success
[ ] Frontend opens
[ ] Register works
[ ] Login works
[ ] /api/auth/me works after login
[ ] Companies load
[ ] Job roles load
[ ] Resume upload works
[ ] Skill extraction works
[ ] Skill-gap results display
[ ] MCQ assessment starts/submits
[ ] Coding Run Code works
[ ] Coding submission/result works
[ ] SQL Run Query works
[ ] SQL submission/result works
[ ] Analytics load
[ ] Job readiness loads
[ ] Learning recommendations load
[ ] YouTube resources load/fallback correctly
[ ] Learning progress updates
[ ] Direct route refresh works on Vercel
[ ] Mobile layout is usable

Quick Start

Backend:

cd server
docker build -t ai-skill-gap-server .
docker run --name ai-skill-gap-backend --env-file .env -e PORT=10000 -p 5000:10000 ai-skill-gap-server

Frontend:

cd client
npm install
npm run dev

Open:

http://localhost:5173

Health:

http://localhost:5000/api/health

Repository

https://github.com/Thareesh2311/ai-skill-gap-analyzer

Final Notes

The application has been developed and tested as a complete v1.0 pipeline:

Resume
-> Skill Gap
-> Assessments
-> Analytics
-> Job Readiness
-> Learning Recommendations
-> Learning Progress

Recommended environments:

Local:
Frontend -> Vite
Backend  -> Docker
Database -> MongoDB Atlas

Production:
Frontend -> Vercel
Backend  -> Render Docker Web Service
Database -> MongoDB Atlas

Keep credentials outside Git, rotate credentials that have ever been exposed, and avoid logging authentication tokens in production.
