# Workout Tracker Releases

Versions follow semantic versioning: `MAJOR.MINOR.PATCH`

| Change | Example | Bump |
|---|---|---|
| Bug fixes only | 1.1.0 → 1.1.1 | PATCH |
| New features | 1.1.1 → 1.2.0 | MINOR |
| Breaking / major changes | 1.2.0 → 2.0.0 | MAJOR |

---

## 1.1.0

**Date:** 2026-09-25
**Deployment status:** Pending (built and tested locally, not yet pushed to Render)

### New features

- Installable app: compact 📲 icon in the Navbar when the browser supports installation; hidden once installed or running standalone
- Update icon: compact 🔄 in the Navbar when a newer version is published; one click activates the new version and reloads (replaces the large update banner)
- Automatic version check on start, every 30 minutes, and when returning to the app
- Exercise Library: every exercise is tracked by **reps** or **time**; add / edit / delete; built-in exercises are locked for normal users
- Workout Plans: choosing an exercise pre-fills its default reps or time; saving a plan is all-or-nothing

### Bug fixes

- Push-ups and other rep exercises no longer show "30 seconds"
- Logo, favicon and install icons were not loading (wrong file paths)
- Workout Player text was invisible in dark mode
- Wrong password / duplicate username showed "server error" instead of a clear message
- Login with email address did not work
- Deleting an exercise used in workout history crashed instead of explaining why

### Security

- Users can no longer read, change or delete other users' workout plans or custom exercises
- Invalid input is rejected with clear validation messages

### Deployment notes

- Backend needs `ADMIN_USERNAMES` set on Render (comma-separated usernames allowed to edit built-in exercises)
- Backend adds three nullable columns to `exercises` automatically on start: `tracking_type`, `default_reps`, `created_by`

---

## 1.0.0

**Date:** 2026-09 (initial production release)
**Deployment status:** Deployed

### Features

- Authentication (register, login, JWT, session expiry)
- Dashboard
- Exercise Library
- Workout Plans
- Workout Player (TIME and REPS exercises, sets, rest timer)
- Workout History
- Progress Tracking
- Analytics (personal records, 1RM)
- Light / dark theme
- PWA with version check

---

# Release process

## 1. Choose the new version

Use the table at the top. Update the version in **all three** files:

- `package.json` → `"version"`
- `src/config/appVersion.js` → `APP_VERSION`
- `public/version.json` → `"version"`

`npm run build` stops with a "Version mismatch" error if they differ.

## 2. Add a section to this file

Version, date, new features, bug fixes, deployment status.

## 3. Test locally

- [ ] `npm run build` succeeds
- [ ] `npm run preview` → open http://localhost:4174
- [ ] Login, Dashboard, Exercise Library, Workout Plans
- [ ] Workout Player: one TIME and one REPS exercise, save
- [ ] Workout History, Progress, Analytics
- [ ] Light and dark theme
- [ ] Install icon (Chrome/Edge) and update icon

## 4. Commit and push

```
git add -A
git commit -m "Release Workout Tracker vX.Y.Z"
git push origin main
```

Render builds and deploys automatically after the push.

## 5. Verify production

- [ ] https://workout-tracker-api-fwlz.onrender.com/api/health returns `UP`
- [ ] https://workout-tracker-ui-g065.onrender.com opens and shows the new version in the Navbar
- [ ] An already-open or installed copy shows 🔄; clicking it loads the new version
- [ ] Mark the release as **Deployed** in this file
