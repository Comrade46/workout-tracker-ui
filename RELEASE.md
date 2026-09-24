# Workout Tracker - Release Process

## Current Version

1.0.0

## Before Release

- [ ] Test Login
- [ ] Test Register
- [ ] Test Dashboard
- [ ] Test Exercises
- [ ] Test Workouts
- [ ] Test Workout Plans
- [ ] Test Workout Player
- [ ] Test Add Set
- [ ] Test Workout History
- [ ] Test Analytics
- [ ] Test Progress Tracking
- [ ] Test Light/Dark Theme
- [ ] Test Session Expiration
- [ ] Test PWA installation
- [ ] Test Update Notification
- [ ] Run production build

## Version Update

Update the version in:

src/config/appVersion.js

Example:

1.0.0 → 1.1.0

Also update:

public/version.json

Example:

{
    "version": "1.1.0",
    "name": "Workout Tracker",
    "message": "A new version of Workout Tracker is available."
}

## Build

Run:

npm run build

## Git

Check changes:

git status

Add files:

git add .

Commit:

git commit -m "Release Workout Tracker v1.1.0"

Push:

git push origin main

## Deployment

Render automatically deploys the latest pushed commit.

After deployment:

- Open the production application
- Test Login
- Test Dashboard
- Test core workout flow
- Verify application version
- Verify update notification

## Important

Always keep these two versions synchronized:

src/config/appVersion.js
public/version.json