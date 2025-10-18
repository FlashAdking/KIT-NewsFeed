```bash
.
├── Backend
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   ├── script
│   │   └── createSuperAdmin.ts
│   ├── setup
│   │   └── testSetup.ts
│   ├── src
│   │   ├── app.ts
│   │   ├── config
│   │   │   └── mongodb.ts
│   │   ├── controllers
│   │   │   ├── AdminController.ts
│   │   │   ├── authController.ts
│   │   │   ├── ClubRepresentativeController.ts
│   │   │   └── PostController.ts
│   │   ├── helpers
│   │   │   └── jwt.ts
│   │   ├── middleware
│   │   │   ├── authMiddleware.ts
│   │   │   ├── postAuthMiddleware.ts
│   │   │   ├── postPermissions.ts
│   │   │   ├── roleMiddleware.ts
│   │   │   └── uploadMiddleware.ts
│   │   ├── models
│   │   │   ├── Category.ts
│   │   │   ├── ClubMembership.ts
│   │   │   ├── Club.ts
│   │   │   ├── Comment.ts
│   │   │   ├── EventRegistration.ts
│   │   │   ├── interfaces
│   │   │   │   ├── ICategory.ts
│   │   │   │   ├── IClubMembership.ts
│   │   │   │   ├── IClub.ts
│   │   │   │   ├── IComment.ts
│   │   │   │   ├── INotification.ts
│   │   │   │   ├── IPost.ts
│   │   │   │   ├── ISettings.ts
│   │   │   │   └── IUser.ts
│   │   │   ├── Notification.ts
│   │   │   ├── Post.ts
│   │   │   ├── Settings.ts
│   │   │   └── User.ts
│   │   ├── routes
│   │   │   ├── adminRoutes.ts
│   │   │   ├── authRoutes.ts
│   │   │   ├── clubRepresentativeRoutes.ts
│   │   │   ├── index.ts
│   │   │   └── postRoutes.ts
│   │   ├── services
│   │   │   ├── AdminService.ts
│   │   │   ├── AuthService.ts
│   │   │   ├── ClubRepresentativeService.ts
│   │   │   ├── EventRegistrationService.ts
│   │   │   ├── ImageService.ts
│   │   │   └── PostService.ts
│   │   ├── types
│   │   │   └── express
│   │   │       └── index.d.ts
│   │   ├── utils
│   │   │   └── jwt.ts
│   │   └── validators
│   │       ├── authValidators.ts
│   │       └── repApplicationValidators.ts
│   ├── structure.md
│   ├── tests
│   ├── tsconfig.json
│   └── @types
│       └── express
│           └── express.d.ts
├── newsfeed
│   ├── package.json
│   ├── package-lock.json
│   ├── public
│   │   ├── college-list.json
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   ├── logo192.png
│   │   ├── logo512.png
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── README.md
│   ├── RunManual.md
│   └── src
│       ├── AdminDashboard.jsx
│       ├── App.jsx
│       ├── components
│       │   ├── NavBar.jsx
│       │   ├── Toast.jsx
│       │   └── ToastProvider.jsx
│       ├── CreatePost.jsx
│       ├── css
│       │   ├── AdminDashboard.css
│       │   ├── EventDetails.css
│       │   ├── EventPage.css
│       │   ├── FilterPage.css
│       │   ├── Profile.css
│       │   ├── RaiseRepRequest.css
│       │   └── Toast.css
│       ├── EventDetails_1.jsx
│       ├── EventDetails.jsx
│       ├── EventsPage.jsx
│       ├── FilterPage.jsx
│       ├── images
│       │   └── google.png
│       ├── index.jsx
│       ├── Login.jsx
│       ├── LoginModal.jsx
│       ├── Profile.html
│       ├── Profile.jsx
│       ├── RaiseRepRequest..jsx
│       └── Register.jsx
└── WebScrapping
    ├── backend
    │   ├── backend.py
    │   ├── req.txt
    │   ├── Scrapper.py
    │   └── script.txt
    ├── hackathon-frontend
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package.json
    │   ├── package-lock.json
    │   ├── postcss.config.js
    │   ├── public
    │   │   └── vite.svg
    │   ├── README.md
    │   ├── src
    │   │   ├── App.jsx
    │   │   ├── index.css
    │   │   └── main.jsx
    │   ├── tailwind.config.js
    │   └── vite.config.js
    └── RunMnual.md

31 directories, 105 files
```