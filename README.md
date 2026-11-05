# SOS – ExpiryAlert

**Never miss an important date.**

A privacy-first mobile app for iOS and Android that reminds people before their important documents expire — passports, licenses, visas, insurance, certifications and more. Add a document in under 30 seconds and get local notifications 90, 30, 7 and 1 day before it expires (or on your own schedule).

The app intentionally stores **only** a document type, a name you choose, the expiration date and optional notes. It never asks for document numbers or stores scan images. Optional scans are read on-device and deleted after recognition.

> Built with Expo SDK 58 · React Native 0.88 · TypeScript (strict) · Expo Router · Supabase · Expo Notifications · i18next (EN/ES/PT/FR).

---

## Guía rápida (español)

1. Instala [Node.js LTS](https://nodejs.org) y, en tu teléfono, la app **Expo Go** (App Store o Google Play).
2. Crea un proyecto en [Supabase](https://supabase.com), abre **SQL Editor** y ejecuta el archivo `supabase/migrations/20261104120000_create_documents.sql`.
3. En Supabase → **Authentication → Email Templates**, agrega `{{ .Token }}` a las plantillas _Confirm signup_ y _Reset password_ (ver [Supabase setup](#3-supabase-setup)).
4. Copia `.env.example` como `.env` y pega la URL del proyecto y la clave _publishable_.
5. En la carpeta del proyecto: `npm install` y luego `npx expo start`.
6. Escanea el código QR: con la cámara en iPhone, o desde Expo Go en Android. Para probar el escáner de documentos, crea e instala el development build descrito en la sección 2.

Para publicar en las tiendas, sigue [Production builds](#8-production-builds-eas) y [Before submitting](#13-remaining-tasks-before-app-store-and-google-play-submission).

---

## Table of contents

1. [Features](#1-features)
2. [Getting started](#2-getting-started)
3. [Supabase setup](#3-supabase-setup)
4. [Environment variables](#4-environment-variables)
5. [Run on an iPhone](#5-run-on-an-iphone)
6. [Run on an Android device](#6-run-on-an-android-device)
7. [Testing](#7-testing)
8. [Production builds (EAS)](#8-production-builds-eas)
9. [Architecture](#9-architecture)
10. [How reminders work](#10-how-reminders-work)
11. [Privacy & security design](#11-privacy--security-design)
12. [Internationalization](#12-internationalization)
13. [Remaining tasks before App Store and Google Play submission](#13-remaining-tasks-before-app-store-and-google-play-submission)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Features

| Area           | What's included                                                                                                                                                                                                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onboarding     | 3 short slides + notification "priming" screen that explains reminders before the native permission dialog.                                                                                                                                                                                                                                              |
| Authentication | Sign up, log in, email verification with a one-time code, password recovery with a one-time code, logout, account deletion (Supabase Auth).                                                                                                                                                                                                              |
| Dashboard      | Total documents, animated status breakdown (active / expiring soon / expired), expired alert, upcoming expirations, prominent **Add document** action, empty state, offline banner, "reminders are off" banner.                                                                                                                                          |
| Documents      | Search (accent-insensitive, matches translated type names), status filters with counts, sort by expiration date, swipe-to-delete with confirmation, pull to refresh.                                                                                                                                                                                     |
| Add / edit     | Type picker (one tap), name, native date picker, reminder chips, optional notes, inline validation, privacy guard that warns if text looks like an ID number, unsaved-changes guard. On-device scan or voice dictation suggests the type, name and expiration date when adding a document; temporary scan images are deleted and speech is not uploaded. |
| Details        | Days remaining, status, expiration date, reminder schedule with dates, notes, edit, delete, configure reminders.                                                                                                                                                                                                                                         |
| Notifications  | Local notifications (no push server), default 90/30/7/1 days, per-document custom reminders, configurable time of day, "hide details on lock screen" option, test notification, tap to open the document.                                                                                                                                                |
| Settings       | Language (system / EN / ES / PT / FR), theme (system / light / dark), notification preferences, privacy information, account management, delete account, logout.                                                                                                                                                                                         |
| Offline        | The last loaded documents are cached on the device; the app opens and reminders keep working without a connection. Changes require a connection and say so clearly.                                                                                                                                                                                      |
| Quality        | TypeScript strict, ESLint, 150+ unit/component tests (Jest), 22 database tests for RLS and constraints on a real PostgreSQL (PGlite).                                                                                                                                                                                                                    |

Not included on purpose (MVP scope): saved document photos, push notifications from a server, family sharing, paywall. The architecture leaves room for subscriptions (see `src/features/plans/plans.ts`).

## 2. Getting started

### Prerequisites

- **Node.js 20 or 22 LTS** and npm.
- A **Supabase** project (free tier is fine).
- A phone with **Expo Go** installed, or an iOS Simulator / Android Emulator.
- For store builds: an **Expo account** (free) plus an **Apple Developer** account (USD 99/year) and/or a **Google Play Console** account (USD 25 one-time).

### Install

```bash
npm install
cp .env.example .env      # Windows (PowerShell): Copy-Item .env.example .env
# fill in .env (see section 4)
npx expo start
```

> Most of the project uses modules bundled in **Expo Go**, so you don't need Xcode or Android Studio to try it on a real phone.

> **Document scanning and voice input:** these native features are not available in Expo Go. Scanning requires iOS 15.5 or later. Voice recognition stays on-device; Android requires Android 13+ and a downloaded offline language, while on iOS the app language must match the phone's primary language. Build and install a development client for the platform you want to test (`npx eas-cli@latest build --profile development --platform android` or `npx eas-cli@latest build --profile development --platform ios`), then start Metro with `npx expo start --dev-client`. Scanned pages are temporary and deleted after recognition.

### Useful scripts

| Command                           | What it does                                                              |
| --------------------------------- | ------------------------------------------------------------------------- |
| `npm start`                       | Start the Expo dev server (QR code for Expo Go).                          |
| `npm run ios` / `npm run android` | Start and open the iOS simulator / Android emulator.                      |
| `npm run typecheck`               | TypeScript strict type check.                                             |
| `npm run lint`                    | ESLint (`expo lint`).                                                     |
| `npm test`                        | Jest unit + component tests.                                              |
| `npm run test:db`                 | Database tests (migration, RLS, constraints, account deletion) on PGlite. |
| `npm run verify`                  | All of the above in sequence.                                             |

## 3. Supabase setup

### 3.1 Create the project and run the migration

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of `supabase/migrations/20261104120000_create_documents.sql` and run it.

   Or with the Supabase CLI:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

The migration creates:

- `public.documents` — `id`, `user_id`, `document_type`, `document_name`, `expiration_date`, `notes`, `reminder_days`, `created_at`, `updated_at`, with check constraints (allowed types, name 1–80 chars, notes ≤ 500, valid date range, allowed reminder offsets) and an index on `(user_id, expiration_date)`.
- An `updated_at` trigger.
- **Row Level Security** on `documents`: each authenticated user can only select/insert/update/delete rows where `user_id = auth.uid()`. The `anon` role has no access.
- `public.delete_current_user()` — a `SECURITY DEFINER` function that deletes the caller's documents and auth user. This is how in-app account deletion works without ever shipping a service-role key.

> If your Supabase project does not allow deleting from `auth.users` inside a database function, replace `delete_current_user()` with an Edge Function that uses the service-role key **on the server** and calls `auth.admin.deleteUser(<caller id>)`. The app only needs the RPC name to stay the same.

### 3.2 Authentication settings

In **Authentication → Providers → Email**:

- Keep **Email** enabled.
- **Confirm email**: recommended **on** for production. For quick local testing you can turn it off — the app handles both cases.

In **Authentication → Email Templates**, the app verifies emails and resets passwords with **6-digit codes typed in the app** (no deep links needed). Add the code to these templates:

- **Confirm signup** — add for example:

  ```html
  <h2>Your SOS – ExpiryAlert code</h2>
  <p>
    Enter this code in the app to verify your email:
    <strong>{{ .Token }}</strong>
  </p>
  <p>
    Or confirm with this link:
    <a href="{{ .ConfirmationURL }}">Confirm my email</a>
  </p>
  ```

- **Reset password** — add for example:

  ```html
  <h2>Reset your password</h2>
  <p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
  ```

Keep **Email OTP length** at 6–10 digits (the app accepts both).

### 3.3 Email delivery (important for real users)

Supabase's built-in email service is meant for testing: it is heavily rate-limited and may only deliver to your own team's addresses. Before inviting real users, configure **custom SMTP** in **Project Settings → Authentication → SMTP** (Resend, Postmark, Amazon SES, SendGrid, …). Without it, sign-up and password-reset emails may never arrive.

### 3.4 API keys

In **Project Settings → API Keys**, copy:

- the **Project URL**;
- the **publishable** key (`sb_publishable_...`) — or the legacy **anon** key.

**Never** use the `service_role` key or any `sb_secret_...` key in the app. The app actively refuses such keys and shows a warning.

## 4. Environment variables

Copy `.env.example` to `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

| Variable                               | Required | Notes                                                                                 |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`             | Yes      | Supabase project URL.                                                                 |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes      | Publishable/anon key. `EXPO_PUBLIC_SUPABASE_ANON_KEY` is accepted as a fallback name. |

`EXPO_PUBLIC_*` values are embedded in the app bundle (they are public by design). Data protection comes from Row Level Security, not from hiding these values. `.env` is git-ignored.

If the variables are missing, the app still runs: onboarding works and the login screens show a **"Setup required"** notice instead of failing.

> **EAS cloud builds do not read your local `.env`** (it's git-ignored). Add the same variables to EAS — see [section 8](#8-production-builds-eas).

## 5. Run on an iPhone

**With Expo Go (no Mac needed, works from Windows):**

1. Install **Expo Go** from the App Store.
2. Make sure the phone and computer are on the same Wi-Fi.
3. Run `npx expo start` in the project folder.
4. Open the iPhone **Camera**, point it at the QR code and tap the banner.

If your network blocks local connections, use `npx expo start --tunnel`.

**iOS Simulator (Mac only):** `npm run ios`.

**Installable test build (TestFlight):** see [section 8](#8-production-builds-eas).

## 6. Run on an Android device

**With Expo Go:**

1. Install **Expo Go** from Google Play.
2. Run `npx expo start`.
3. In Expo Go, tap **Scan QR code** and scan the code in the terminal.

**Android Emulator:** start an emulator from Android Studio, then `npm run android`.

**Installable APK for testers:**

```bash
npx eas-cli@latest build --profile preview --platform android
```

EAS gives you a link to download and install the `.apk` directly on any Android phone.

## 7. Testing

```bash
npm run verify     # typecheck + lint + unit/component tests + database tests
```

| Suite                                                      | Covers                                                                                                                                                                                                                                   |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/__tests__/dates.test.ts`                          | Leap years, impossible dates, day arithmetic, DST transitions (tests run in `America/New_York`), picker date conversion.                                                                                                                 |
| `src/features/documents/__tests__/*`                       | Status calculation and thresholds, form validation, privacy guard, search/filter/sort, dashboard stats.                                                                                                                                  |
| `src/features/notifications/__tests__/*`                   | Reminder planning (past reminders, expired docs, leap days, 60-item cap, deterministic ids), schedule diffing (no duplicates, cancel on delete, reschedule on date change), permission handling, notification text in several languages. |
| `src/i18n/__tests__/*`                                     | Every locale has exactly the English keys, no empty strings, same interpolation variables, all required plural forms; language detection & fallback; localized date formats.                                                             |
| `src/features/settings/__tests__/*`                        | Preference sanitising and persistence across restarts.                                                                                                                                                                                   |
| `src/components/documents/__tests__/DocumentForm.test.tsx` | Validation messages, submitted payload, privacy warning, past-date hint.                                                                                                                                                                 |
| `supabase/tests/rls.test.mjs`                              | Real migration on PostgreSQL (PGlite): schema has no sensitive columns, RLS isolation between users, anon has no access, constraints, `updated_at`, account deletion.                                                                    |

A manual QA checklist for real iPhone and Android devices is in [`docs/TESTING.md`](docs/TESTING.md).

## 8. Production builds (EAS)

```bash
npm install --global eas-cli      # or prefix commands with npx eas-cli@latest
eas login
eas init                          # links the project and writes the projectId into app config
```

1. **Set your identifiers** in `app.json` (they can't change after publishing):
   - `expo.ios.bundleIdentifier` — e.g. `com.soscompany.expiryalert`
   - `expo.android.package` — e.g. `com.soscompany.expiryalert`
2. **Add the environment variables to EAS** (once per environment):

   ```bash
   eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co --visibility plaintext
   eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value sb_publishable_... --visibility plaintext
   ```

   Repeat with `--environment preview` for test builds.

3. **Build:**

   ```bash
   eas build --platform android --profile production   # .aab for Google Play
   eas build --platform ios --profile production       # .ipa for the App Store (needs an Apple Developer account)
   ```

   EAS manages signing certificates and keystores for you. No Mac is required.

4. **Submit:**

   ```bash
   eas submit --platform ios       # uploads to App Store Connect / TestFlight
   eas submit --platform android   # uploads to Google Play (first upload may need to be manual)
   ```

Profiles in `eas.json`:

| Profile      | Use                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| `preview`    | Internal testing. Android produces an installable `.apk`; iOS produces an ad-hoc build for registered devices. |
| `production` | Store builds with auto-incremented build numbers (`appVersionSource: remote`).                                 |

## 9. Architecture

```
src/
  app/                         Expo Router routes (screens only)
    _layout.tsx                Providers, splash, protected route groups, error boundary
    onboarding.tsx
    (auth)/                    sign-in, sign-up, verify-email, forgot-password, reset-password
    (app)/                     Signed-in area (stack)
      (tabs)/                  index (dashboard), documents, settings
      documents/new.tsx        Add (modal)
      documents/[id]/          index (details), edit (modal), reminders
      settings/                language, notifications, privacy, account
  components/                  Reusable UI (ui/), document widgets, auth widgets
  features/                    Business logic, no UI
    auth/                      AuthProvider, authService (Supabase), validation
    documents/                 types, status, validation, selectors, repository, cache, provider
    notifications/             planner (pure), content, notificationService, provider
    reminders/                 reminder offsets
    settings/                  preferences (persisted) + provider
    onboarding/                onboarding flag
    plans/                     subscription seam (not enforced in the MVP)
  i18n/                        i18next setup, locales (en/es/pt/fr), formatters
  lib/                         dates, env, errors, storage, supabase client, network, haptics
  theme/                       design tokens (light/dark), ThemeProvider
supabase/
  migrations/                  SQL schema, RLS, account deletion
  tests/                       PGlite database tests
docs/                          Testing checklist, store listing notes, privacy policy template
```

Key decisions:

- **Routing & guards:** Expo Router `Stack.Protected` decides between onboarding, auth and the app. The splash screen stays up until preferences, onboarding state and the session are loaded.
- **Data:** `DocumentsProvider` loads the cached list first (instant, offline), then the server, and refreshes when the app returns to the foreground. All Supabase access goes through `documentsRepository` and `authService`, which convert errors into typed `AppError` codes with translations.
- **Business logic is pure and tested:** dates, status, validation, selectors and the notification planner have no React or native dependencies.
- **Storage:** the Supabase session and local preferences/cache use `expo-sqlite` (`localStorage` polyfill + key-value store), as recommended by Expo.
- **Theme:** tokens in `src/theme/tokens.ts`; the user's choice is applied app-wide (including native pickers and alerts) with `Appearance.setColorScheme`.

### Database schema

| Column                     | Type          | Notes                                                               |
| -------------------------- | ------------- | ------------------------------------------------------------------- |
| `id`                       | `uuid`        | PK, `gen_random_uuid()`                                             |
| `user_id`                  | `uuid`        | FK → `auth.users`, `on delete cascade`, defaults to `auth.uid()`    |
| `document_type`            | `text`        | One of 10 allowed values                                            |
| `document_name`            | `text`        | 1–80 chars. Friendly name or owner name, never a number             |
| `expiration_date`          | `date`        | 1900-01-01 … 2200-12-31                                             |
| `notes`                    | `text`        | Optional, ≤ 500 chars                                               |
| `reminder_days`            | `smallint[]`  | Subset of {0, 1, 3, 7, 14, 30, 60, 90, 180}, default {90, 30, 7, 1} |
| `created_at`, `updated_at` | `timestamptz` | `updated_at` maintained by trigger                                  |

## 10. How reminders work

- Reminders are **local notifications** scheduled on the device with `expo-notifications` — no push server, no device tokens.
- Each reminder fires _N_ days before the expiration date at the user's chosen time (default 09:00 local time). Date math uses calendar days, so leap years and daylight-saving changes are handled correctly.
- Every reminder has a **deterministic identifier** (document, offset, time, text). Syncing compares what is scheduled with what should be scheduled, cancels stale ones and adds missing ones — so there are never duplicates, deleted documents lose their reminders, and changed dates are rescheduled.
- iOS keeps at most **64** pending local notifications per app. The app schedules the **60 soonest** and tops up the window every time the app opens or data changes.
- Sync runs when documents, reminder settings, language or permission change, and every time the app comes to the foreground. Logging out or deleting the account cancels all reminders on the device.
- Past reminders are skipped; expired documents get no reminders.
- If notifications are blocked, the app explains it and links to system settings; nothing crashes.
- Android may deliver reminders a few minutes late to save battery (the app does **not** request the restricted exact-alarm permission). The settings screen says so.
- "Show details in notifications" can be turned off to keep document names and types off the lock screen.

## 11. Privacy & security design

- **Data minimization:** the schema has no column for document numbers, images or scans (a database test asserts the exact column list). The app has no camera, photo-library or file-picker dependency.
- **Privacy guard:** if a name or note looks like an ID number (e.g. `AB1234567`, `123-45-6789`), the form shows a warning. Dates are not flagged.
- **Row Level Security** isolates every user's data; `anon` has no access (tested).
- **No secret keys in the app:** only the publishable/anon key is used; secret/service-role keys are detected and ignored.
- **Local data:** the session, preferences and a cache of the last loaded documents are stored in the app's private storage. The cache is removed on logout and account deletion.
- **Account deletion** in the app removes the account, documents and local reminders.
- The app makes no legal-compliance claims. Have a professional review your privacy policy (template in `docs/PRIVACY_POLICY_TEMPLATE.md`).

## 12. Internationalization

- Languages: English, Spanish, Portuguese, French. On first launch the device language is used (English if unsupported). Users can pick a language manually; the choice is persisted.
- `src/i18n/locales/en.ts` is the source of truth. Other locales are typed against it, so a missing key is a **TypeScript error**, and `t('...')` keys are type-checked.
- Dates and times use `Intl` with the device's regional format when it matches the app language (e.g. `es-DO`).
- iOS 13+/Android 13+ per-app language settings are enabled through the `expo-localization` config plugin.

**Add a language:** create `src/i18n/locales/<code>.ts` typed as `TranslationResource`, register it in `src/i18n/index.ts` and `SUPPORTED_LANGUAGES` (`src/i18n/languages.ts`), add its name under `languages` in every locale, and add the code to `supportedLocales` in `app.json`. The locale tests will tell you what's missing.

## 13. Remaining tasks before App Store and Google Play submission

- [ ] Replace placeholder identifiers in `app.json` (`com.soscompany.expiryalert`) with your own, then run `eas init`.
- [ ] Replace the placeholder icon/splash artwork in `assets/` (generated from `assets/brand/icon.svg`) with final branding, keeping the same sizes (1024×1024; Android notification icon 96×96 white on transparent).
- [ ] Configure custom SMTP and the email templates in Supabase (section 3).
- [ ] Publish a privacy policy at a public URL (template in `docs/PRIVACY_POLICY_TEMPLATE.md`) and add it to both stores.
- [ ] Google Play requires a **web link where users can request account deletion** (in addition to the in-app option). Publish a simple page or form.
- [ ] Fill in App Store privacy labels and the Google Play Data safety form (guidance in `docs/STORE_LISTING.md`).
- [ ] Create a demo account for App Review / Play review and include its credentials in the review notes.
- [ ] Take store screenshots on real devices or simulators in all languages you want to launch with.
- [ ] Test on physical devices with the checklist in `docs/TESTING.md`, including notification delivery after a reboot.
- [ ] Google Play personal developer accounts must run a closed test with at least 12 testers for 14 consecutive days before production access.
- [ ] Decide on the "SOS" name after a trademark/search check.

## 14. Troubleshooting

| Problem                                                          | Fix                                                                                                                                                                         |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Setup required" banner on the login screen                      | `.env` is missing or invalid. Restart `npx expo start` after editing `.env` (use `-c` to clear the cache).                                                                  |
| Sign-up email never arrives                                      | Configure custom SMTP (section 3.3); check spam; wait for the resend timer.                                                                                                 |
| "This code is invalid or has expired"                            | Make sure the email template contains `{{ .Token }}` and use the newest code.                                                                                               |
| Phone can't connect to the dev server                            | Same Wi-Fi network, or `npx expo start --tunnel`.                                                                                                                           |
| No notifications                                                 | Settings → Notifications in the app: check the permission status and send a test notification. On Android also check the "Expiration reminders" channel in system settings. |
| Expo Go says the project uses a different SDK                    | Update Expo Go from the store; this project uses SDK 58.                                                                                                                    |
| Local native builds fail on Windows with paths containing spaces | Expo Go and EAS cloud builds are unaffected. For `npx expo run:android`, move the project to a path without spaces (e.g. `C:\dev\sos-expiryalert`).                         |
