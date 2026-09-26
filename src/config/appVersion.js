// ==========================================
// WORKOUT TRACKER - APPLICATION VERSION
// ==========================================
//
// Semantic versioning: MAJOR.MINOR.PATCH
//
//   PATCH  bug fixes only             1.1.0 -> 1.1.1
//   MINOR  new features               1.1.1 -> 1.2.0
//   MAJOR  breaking / big changes     1.2.0 -> 2.0.0
//
// When releasing, change the version in ALL THREE places:
//   - this file (APP_VERSION)
//   - package.json ("version")
//   - public/version.json ("version")
//
// `npm run build` fails if they do not match. See RELEASE.md.

export const APP_VERSION = "1.8.0";

export const APP_NAME = "Workout Tracker";

export const APP_VERSION_LABEL = `Version ${APP_VERSION}`;
