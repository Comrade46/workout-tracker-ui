# Workout Tracker Releases

Versions follow semantic versioning: `MAJOR.MINOR.PATCH`

| Change | Example | Bump |
|---|---|---|
| Bug fixes only | 1.1.0 → 1.1.1 | PATCH |
| New features | 1.1.1 → 1.2.0 | MINOR |
| Breaking / major changes | 1.2.0 → 2.0.0 | MAJOR |

---

## 1.7.0 - Never lose a workout

**Date:** 2026-09-26
**Deployment status:** Not deployed yet

### New features

- **Workouts are never lost**: a finished workout is saved on the phone first, then uploaded. With no internet, a sleeping server or an expired login it stays on the phone ("⏳ 1" in the menu bar, banner on Dashboard and History) and uploads automatically when possible - on opening the app, when the phone is back online, and every minute
- The server never saves the same workout twice, even if the phone sends it again
- **Stay logged in**: logins last 30 days and are renewed whenever the app is opened
- **Profile page** (👤): account details, change password, workouts waiting to upload, send feedback, log out
- **Forgot password?** on the login page: sends a request to the app admin
- **Admin page** (🛡️, admins only): open password requests, "Create temporary password" (the user must choose a new password after logging in with it), all users with workout counts, feedback inbox with "Mark done"
- Changing or resetting a password logs out the account's other phones and computers

### Fixes

- Workouts done after midnight but before 5:30 am (India) were dated the previous day
- Menu bar no longer runs off the screen on tablets and small laptops (menu ☰ below 1300 px)

### Server (API)

- New: `GET /api/users/me`, `POST /api/users/me/token`, `PUT /api/users/me/password`, `POST /api/feedback`, `POST /api/auth/password-help`, `/api/admin/*`
- New tables `password_reset_requests`, `feedback`; new columns `users.must_change_password`, `users.password_changed_at`, `workout_sessions.client_id` (created automatically on start)
- `JWT_EXPIRATION_MS` default is now 30 days - remove any `JWT_EXPIRATION_MS` override on Render
- Admins = `ADMIN_USERNAMES` (exact usernames, comma separated)

---

## 1.6.1 - New logo

**Date:** 2026-09-26
**Deployment status:** Deployed 2026-09-26

### Changes

- New app logo everywhere: phone home-screen icon (Android + iPhone), browser tab icon, navbar and install page
- Android icon keeps the whole logo inside the round / squircle launcher mask
- Launch screen and status bar are black to match the logo
- Full-size logo kept in `branding/logo-1254.png` for future icon sizes

### Notes

- Android updates the home-screen icon on its own when Chrome next checks the app (can take up to a day; it may ask "Update app icon?")
- iPhone keeps the old icon until the app is removed and added to the home screen again

---

## 1.6.0 - Programs

**Date:** 2026-09-26
**Deployment status:** Deployed 2026-09-26

### New features

- **Programs** section (menu, dashboard "Start Workout" and Quick Access) with a Beginner / Intermediate / Advanced filter
- **30-Day Full Body Challenge** at 3 levels: home, no equipment, rest every 4th day, about 10% harder each week; 30-day grid with ✓ progress and "Continue: Day N"
- **Muscle-building splits**
  - 3-Day Full Body Builder (Beginner, gym)
  - 4-Day Muscle Building Split (Intermediate): Chest & Shoulders / Back & Traps / Arms / Legs & Core
  - 5-Day V-Taper Split (Advanced): Back width + rear delts / Chest + side delts / Legs / Back thickness + delts / Arms + delts, plus an Abs day and waist tips
- **Focus areas**: Chest, Back, Shoulders, Arms, Legs, Abs & Core, each at 3 levels (18 workouts)
- Every workout page lists its exercises with picture, sets x reps / time, rest and "How to do it"; one tap starts the guided player
- Progress is saved with the workout (✓ on every device); History shows the program and day
- 38 new built-in exercises (added by the server) with pictures, e.g. Pull-Ups, Face Pulls, Dumbbell Shrugs, Skull Crushers, Lying Leg Curl, Crunches, Side Plank

### Notes

- 24 programs, 100 workouts, 72 exercises; every program exercise exists in the library with the correct TIME / REPS type
- Six exercises still use an icon instead of a photo (Jumping Jacks, High Knees, Wall Sit, Pike Push-Ups, Burpees, Doorframe Rows). Real photos will replace the animations in a later update.

---

## 1.5.0 - Lavender light theme

**Date:** 2026-09-26
**Deployment status:** Deployed 2026-09-26

### New features

- **New light theme "Lavender"**: near-white lavender-tinted backgrounds, white cards and a deep purple accent, from the palette `#C0C0C0 #B7A0CC #4E3677 #342B45 #1A1829`. Every text colour meets WCAG AA contrast (all 10 pages checked: 0 failures)
- Primary buttons, badges, timer ring and progress bars are purple in light mode, mint in dark mode
- Input boxes have a clearly visible border in light mode

### Bug fixes

- Dashboard showed 0 for Total Minutes, Total Sets and Total Volume (it read the wrong field names from the server)

---

## 1.4.0 - Storm dark theme

**Date:** 2026-09-26
**Deployment status:** Deployed 2026-09-26

### New features

- **New dark theme "Storm"**: deep navy-teal backgrounds with a mint accent, from the palette `#D0D8D6 #88B9AE #537774 #03222E #05141E`. Every text colour meets WCAG AA contrast (checked on all pages: 0 failures)
- Buttons, badges, timer ring and progress bars follow the theme (previously fixed blue)
- Phone status bar colour follows the theme
- Register page restyled to match Login and the theme

### Bug fixes

- White text on light-accent buttons in dark mode was hard to read; text on coloured buttons now adapts to the theme
- Login / Register input boxes had no visible border (an undefined colour variable)
- Analytics showed an impossible training time (one workout was stored with 1,073,741,824 minutes). The record was corrected, the server now rejects durations over 24 hours, and analytics ignores impossible values

### Notes

- The light theme is unchanged in this release (next: light theme refresh)

---

## 1.3.0 - Guided workouts

**Date:** 2026-09-26
**Deployment status:** Deployed 2026-09-26

First feature update inspired by popular home-workout apps.

### New features

- **Exercise pictures**: 34 of the 40 built-in exercises show start / end photos that alternate like a short animation (Exercise Library cards and Workout Player)
- **"How to do it"** steps and target muscles for each of those exercises
- **Voice coach** in the Workout Player: announces each exercise and its target, "3-2-1 Go", "Halfway there", "Set 2 of 3", rest length and what comes next, and "Workout complete"
- **3-2-1 "Get ready" countdown** before timed exercises
- **Beeps** in the last 3 seconds of timers and **vibration** when a timer ends (phones)
- **Screen stays on** during a workout
- **Rest screen**: "Next up" card with picture and target, plus a **+20s rest** button
- **🔊 / 🔇** button in the player (remembered on the device)
- Phones: Start / Pause / Skip / Continue in a bar fixed to the bottom of the screen; target boxes in 2 columns

### Notes

- Exercise photos and instructions: free-exercise-db (public domain, Unlicense). Six exercises without a clear match (Burpees, Jumping Jacks, High Knees, Pike Push-Ups, Doorframe/Towel Rows, Resistance Band Bicep Curls) keep their icon.
- Pictures are cached on the device after first view (work offline).
- Backend moved from Render Oregon to Render **Singapore** (next to the Aiven database in Bengaluru): database requests about 3x faster.

---

## 1.2.1

**Date:** 2026-09-25
**Deployment status:** Deployed 2026-09-25 (frontend 4c19d16, backend 40ccf93)

Fixes from the first test on a phone.

### Bug fixes

- Workout player showed a reps form for timed exercises (Plank) and a timer for rep exercises (e.g. Russian Twists, Push-Ups). TIME / REPS now always comes from the exercise in the Exercise Library; plan rows saved earlier with no type or the wrong type are corrected automatically
- Plan editor: TIME / REPS is filled in from the exercise and can no longer be set to the wrong type
- Plan editor: "Full Body" and "Upper / Lower Body" plans showed "No exercises found" and hid the plan's exercises; categories now match correctly (Full Body = all exercises) and a plan's existing exercises always show

### Performance

- API responses 2-4x faster: related data loaded in batches instead of one query per row, analytics loads each set once, and the logged-in user is cached for a few minutes instead of being read from the database on every request
- First app start downloads less: pages load when opened (main bundle 440 KB -> 315 KB)

---

## 1.2.0

**Date:** 2026-09-25
**Deployment status:** Deployed 2026-09-25 (frontend 132901f)

Goal: friends can install and use the app for free, on any device, without an app store.

### New features

- **Get the app page** (`/install`, public, no login): install steps for the visitor's device, one-tap install where the browser supports it, QR code, and a "Share link" button (WhatsApp etc.)
- Share link `https://workout-tracker-ui-g065.onrender.com/?install` opens the Get the app page
- 📲 in the Navbar now also works on iPhone / iPad, Mac Safari and Firefox: it opens a short "how to install" guide for that device
- "📲 Get the app" link on the Login and Register pages
- iPhone / iPad: proper 180 px home-screen icon, opens full-screen like an app
- Android: padded "maskable" icon so the round launcher mask no longer cuts the logo
- Free keep-awake job (GitHub Actions, every 5 minutes) so the backend no longer sleeps and friends don't wait 1-2 minutes

### Deployment notes

- GitHub Actions workflow `.github/workflows/keep-backend-awake.yml` runs automatically after push; check the repository's **Actions** tab. GitHub pauses scheduled workflows after 60 days without commits - re-enable it there if that happens.

---

## 1.1.0

**Date:** 2026-09-25
**Deployment status:** Deployed 2026-09-25 (frontend 595aec2, backend 5b25c6c)

### New features

- Installable app: compact 📲 icon in the Navbar when the browser supports installation; hidden once installed or running standalone
- Update icon: compact 🔄 in the Navbar when a newer version is published; one click activates the new version and reloads (replaces the large update banner)
- Automatic version check on start, every 30 minutes, and when returning to the app
- Exercise Library: every exercise is tracked by **reps** or **time**; add / edit / delete; built-in exercises are locked for normal users
- Workout Plans: choosing an exercise pre-fills its default reps or time; saving a plan is all-or-nothing

### Bug fixes

- Pages showed "Unable to load exercises / workout plans" when the Render backend was waking up from sleep (took 70-145 s, app gave up after 15 s). Requests now wait up to 3 minutes, page loads retry once, the server is pinged as soon as the app opens, and a small "Waking up the server…" indicator is shown while waiting
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

- [ ] https://workout-tracker-api-sg.onrender.com/api/health returns `UP` (Singapore backend)
- [ ] https://workout-tracker-ui-g065.onrender.com opens and shows the new version in the Navbar
- [ ] An already-open or installed copy shows 🔄; clicking it loads the new version
- [ ] Mark the release as **Deployed** in this file
