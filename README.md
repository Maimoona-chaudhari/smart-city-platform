Smart City Operations & Digital Governance Platform

A full-stack Smart City platform where citizens report city issues and emergencies, officers resolve them, and administrators monitor operations through role-based dashboards.

Overview

The platform supports:

Citizen complaint reporting and tracking

Automatic department routing

Officer assignment and complaint resolution

Priority-based SLA monitoring

Emergency reporting and dispatch

Public asset management

Department workflows

Notifications

GIS/map functionality

Role-based dashboards

Background jobs using Redis and BullMQ

Docker-based local deployment

GitHub Actions CI checks

Technology Stack

Frontend

Next.js 16 (App Router)

React

TypeScript

Tailwind CSS

Lucide Icons

Leaflet

Backend

Node.js

Express 5

TypeScript

Database & Infrastructure

MongoDB Atlas

Mongoose

Redis

BullMQ

Cloudinary

Security

JWT authentication

bcrypt password hashing

Role-based authorization

Helmet

express-rate-limit

CORS restrictions

Request validation

System Architecture

                    ┌──────────────────────┐
                    │   Next.js Frontend   │
                    │ Citizen / Officer /  │
                    │       Admin          │
                    └──────────┬───────────┘
                               │ REST + JWT
                               ▼
                    ┌──────────────────────┐
                    │    Express API       │
                    └──────┬─────┬─────────┘
                           │      │
             ┌─────────────┘      └──────────────┐
             ▼                                    ▼
      ┌─────────────┐                     ┌─────────────┐
      │ MongoDB     │                     │ Cloudinary  │
      │ Atlas       │                     │ Evidence    │
      └─────────────┘                     └─────────────┘
             ▲
             │
      ┌──────┴───────┐
      │ Redis/BullMQ  │
      └──────┬───────┘
             │
      ┌──────┴──────────────┐
      │ Background Workers  │
      │ Notifications / SLA │
      └─────────────────────┘

User Roles

Citizen

Register and login

Submit complaints

Add GPS location and evidence

Track complaint status

View complaint details and workflow progress

View SLA countdown

Report emergencies

Receive notifications

Officer

View assigned complaints

View department complaints

Update assigned complaint status

Respond to dispatched emergencies

Manage permitted asset statuses

Super Admin

Monitor system KPIs

View complaint analytics

Assign officers

Monitor SLA compliance

Monitor overdue complaints

Dispatch emergencies

Manage departments, officers, workflows and assets

Access GIS data

Main Features

Complaint Management

Complaint title and description

Category and priority

GPS location

Optional evidence image

Automatic department routing

Automatic workflow selection

Officer assignment

Complaint status workflow:

ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED

Complaint details page

Evidence display

Workflow progress

SLA countdown

SLA Monitoring

SLA deadlines are assigned according to priority:

Priority

SLA

Critical

4 hours

High

24 hours

Medium

48 hours

Low / unspecified

72 hours

The system includes:

Live SLA countdown

Progress indicator

Green / amber / red states

Overdue state

Resolved on-time / resolved-late result

BullMQ SLA monitoring worker

Admin SLA monitoring dashboard

SLA Compliance

Overdue Rate

Department-wise SLA analysis

Emergency Management

Emergency workflow:

Citizen Reports Emergency
          ↓
Admin Dispatches Officer
          ↓
Officer Starts Response
          ↓
Officer Marks Resolved

Features include:

Emergency type and priority

Map location

Use My Location

Editable coordinates

Admin dispatch

Assigned officer response

Role-based emergency visibility

Emergency notifications

Dispatch and resolution timestamps

Notifications

Notifications are generated for relevant complaint and emergency events.

Supported actions include:

View notifications

Mark one as read

Mark all as read

Complaint assignment notifications

Complaint status notifications

Emergency dispatch notifications

Emergency status notifications

Public Assets

Asset registry

Asset types

Asset status

Department association

Role-based asset status updates

GIS map integration

Workflow Management

Create and manage workflows

Department-specific workflows

Ordered workflow steps

Automatic workflow selection for complaints

Current workflow step tracking

GIS

Leaflet-based map functionality supports:

Complaint locations

Emergency locations

Public assets

Emergency location selection

Coordinate editing

Dashboards

Citizen Dashboard

Complaint count

Notification count

Quick actions

Recent complaints

Status summary

Status badges

Officer Dashboard

Workload KPIs

Work overview

Assigned complaints

Department complaints

Urgent work

SLA countdown

Admin Dashboard

Operational KPIs

Complaint status analytics

Priority analytics

Department SLA analysis

SLA Violated Complaints

SLA Monitoring

SLA Compliance

Overdue Rate

Department Performance

API Overview

Base URL during local development:

http://localhost:5000/api

Authentication

POST /auth/register
POST /auth/login
GET  /auth/profile
GET  /auth/officers
POST /auth/officers

Complaints

POST   /complaints
GET    /complaints/my
GET    /complaints/assigned
GET    /complaints/department
GET    /complaints/all
GET    /complaints/:id
PATCH  /complaints/:id/assign
PATCH  /complaints/:id/status

Emergencies

POST   /emergencies
GET    /emergencies
PATCH  /emergencies/:id/assign
PATCH  /emergencies/:id/status

Other Modules

/departments
/assets
/notifications
/workflows
/gis/map-data

Sensitive routes require JWT authentication and appropriate role permissions.

Security

The application includes:

JWT-based authentication

bcrypt password hashing

Role-based access control

Protected API routes

Citizen ownership checks

Assigned-officer checks

Admin authorization

Input validation

ObjectId validation

Helmet security headers

Login/register rate limiting

CORS configuration

Privileged account creation restricted to administrators

Project Structure

backend/
└── src/
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── queues/
    ├── routes/
    ├── workers/
    └── server.ts

frontend/
└── src/
    ├── app/
    ├── components/
    └── ...

Requirements

For normal local development:

Node.js 20+

MongoDB Atlas account

Redis

Cloudinary account

For Docker:

Docker Desktop

Docker Compose

Environment Variables

Create a backend/.env file using the project's environment variable names.

Example:

PORT=5000
JWT_SECRET=your-secret
REDIS_URL=redis://127.0.0.1:6379
MONGODB_URI=your-mongodb-atlas-connection-string
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

Never commit real passwords, API keys, JWT secrets or other credentials to GitHub.

Run Without Docker

Backend

cd backend
npm install
npm run dev

Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Then open:

http://localhost:3000

Run With Docker

Make sure Docker Desktop is running.

From the project root:

docker compose up --build

To run in the background:

docker compose up --build -d

To stop the containers:

docker compose down

The Docker setup runs the application services defined in docker-compose.yml.

MongoDB Atlas and Cloudinary remain external services and are configured through environment variables.

Testing

The main end-to-end flow tested for the MVP includes:

Citizen registration and login

Complaint submission

Complaint department routing

Admin officer assignment

Officer complaint status updates

SLA countdown and resolution status

Citizen notifications

Emergency reporting

Admin emergency dispatch

Officer emergency response

Role-based GIS access

Docker-based application startup

CI

GitHub Actions is configured to automatically check the project when code is pushed to the repository.

The CI workflow is intended to catch build/type/dependency problems before submission or deployment.

Known Limitations / Future Work

The following are outside the completed core MVP scope or require further validation:

Emergency-specific SLA deadlines and pre-deadline warnings

Advanced GIS heatmaps

Citizen feedback

SMS integration

Online payments

AI-based features

Target-scale load testing

Full high-availability production deployment

The architecture supports further horizontal scaling, but the stated large-scale requirements have not been load tested.

Project Status

The core Smart City MVP has been implemented and tested through the main citizen, officer, administrator and emergency workflows.

Docker-based execution has also been tested locally.

Team / Academic Project

Project: Smart City Operations & Digital Governance Platform
Case Study: EEF FS-001
Type: Full-Stack Software Engineering Project