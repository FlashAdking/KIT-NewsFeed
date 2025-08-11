
# 🏛️ Ease-News Platform
An opportunity discovery platform where students can find hackathons, events, and other opportunities across campuses. Anyone can browse the public newsfeed without logging in; sign-in is only required to register for events. Any poster (student, society, department, or independent organizer) can sign up with a student account, request publisher access, and—after admin approval—submit events to be listed on the public feed. All publisher and admin actions are role-gated for safety and quality.



## 🛠 Tech Stack
- Backend: Node.js, Express, TypeScript
- Database: MongoDB atlas (Mongoose)
- Auth: JWT
- Oauth : Google
- Testing: Jest, Supertest
- Frontend : React.js 

---

## 📋 Prerequisites
- Node.js v16+
- npm or yarn
- MongoDB (local or Atlas)

---

## 🚀 Getting Started

### 1) Clone and Install
```bash
git clone https://github.com/FlashAdking/KIT-NewsFeed.git
cd KIT-NEWSFEED
npm install
```



### 2) Environment Variables
Create a .env file at the project root:
```bash

PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/<your-db-name>

# Or Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/club-platform

# Auth
JWT_SECRET=your-super-secret-jwt-key

```



### 3) Start MongoDB
- Local: ensure mongod is running
- Atlas: verify connection string in MONGODB_URI

### 4) Seed (optional)
```bash
npm run seed 
```



### 5) Run the Server
- Development (hot reload):
```bash
npm run dev
```


- Production:
```bash
npm run build
npm start

```


open in any Browser:
```bash
http://localhost:3000
```


---





## 🔄 Typical Workflow

1) Student browses public events (no login)  
2) Student logs in to register for an event  
3) Student applies to become a club representative (existing or new club)  
4) Admin approves the application (new club auto-approved on first rep approval)  
5) Representative creates event  
6) Admin approves the event  
7) Event appears in the public newsfeed

---

## Creating Native SuperAdmin 
```bash 
# file present in KIT-NEWSFEED/script/createSuperAdmin.ts  (credentials can be modified)
cd ./KIT-NEWSFEED/
npx ts-node scripts/createSuperAdmin.ts
```



## 📧 Support
- File issues in the repository’s Issues tab
- Include steps to reproduce, expected vs actual behavior, and logs if possible

Happy contributing and building! 🚀