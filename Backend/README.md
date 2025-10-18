
# 🏛️ Ease-News Platform

## 🛠 Tech Stack
- Backend: Node.js, Express, TypeScript
- Database: MongoDB atlas (Mongoose)
- Auth: JWT
- Oauth : Google
- Testing: Jest, Supertest

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
cd Backend
npm install 
# OR
npm i
```



### 2) Environment Variables
Create a .env file at the project root:
```bash

# mongodb atlas
MONGODB_URI=mongodb+srv://username:<password>@news-feed-cluster.q6okboa.mongodb.net/<DBNAME>?retryWrites=true&w=majority&appName=clus


JWT_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_SECRET=

NODE_ENV=development
PORT=

BCRYPT_ROUNDS=12
SESSION_SECRET=


FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000


JWT_ISSUER=EventEase_Auth_Server
JWT_AUDIENCE=EventEase_Users

```



### 3) Start MongoDB
- Local: ensure mongod is running
- Atlas: verify connection string in MONGODB_URI


### 5) Run the Server
- Development (hot reload):
```bash
# check package.json (Backend/package.json)
# "scripts": {
#     "dev": "nodemon src/app.ts",
#     "build": "tsc",
#     "start": "node dist/app.js"
#   },


npm run dev
```


- Production (Deployement):
```bash
npm run build
npm start

```


open in any Browser:
```bash
# check PORT in .env 
# check line 22 in app.ts (Backend/app.ts)
# const PORT = process.env.PORT || 3000; // you can modify port

http://localhost:<PORT>
```



---

## Creating Native SuperAdmin (already created)
```bash 
# file present in backend/script/createSuperAdmin.ts  (credentials can be modified)
cd ./Backend/
npx ts-node scripts/createSuperAdmin.ts
```



## 📧 Support
- File issues in the repository’s Issues tab
- Include steps to reproduce, expected vs actual behavior, and logs if possible

Happy contributing and building! 🚀