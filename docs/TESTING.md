# Manual QA checklist (iPhone and Android)

Automated checks (`npm run verify`) cover logic, translations, the form and the database. This checklist covers what only a real device can confirm. Run it on **one iPhone and one Android phone** (ideally Android 13+ for the notification permission prompt), in light and dark mode.

Tip: to test reminders quickly, open **Settings → Notifications**, set **Reminder time** to 2–3 minutes from now, then add a document that expires **tomorrow** with the **1 day** reminder selected. It should fire today at the chosen time.

## 1. First launch & onboarding

- [ ] Splash screen appears, then onboarding (no white flash in dark mode).
- [ ] Swipe through the 3 slides; dots animate; **Skip** jumps to the reminders screen.
- [ ] **Enable reminders** shows the system permission dialog (Android 13+/iOS). **Maybe later** continues without asking.
- [ ] Device language is detected (try a Spanish/Portuguese/French device); unsupported languages fall back to English.

## 2. Authentication

- [ ] Without `.env`, the login screen shows "Setup required" and the button is disabled.
- [ ] Sign up with a new email → verification screen → enter the code → you land on the dashboard.
- [ ] Wrong code shows a clear error; **Resend code** has a 60-second timer.
- [ ] Log in with a wrong password → "Incorrect email or password".
- [ ] Log in with an unconfirmed account → goes to the verification screen and sends a new code.
- [ ] Forgot password → code by email → new password → signed in.
- [ ] Airplane mode while logging in → "You seem to be offline".
- [ ] Kill and reopen the app → still signed in.

## 3. Documents

- [ ] Empty dashboard shows the empty state and **Add your first document**.
- [ ] Add a document in under 30 seconds: type → name → date → Save.
- [ ] In development builds on iOS and Android, scan a driver's license and a passport; confirm type, name and expiration suggestions can be corrected before saving.
- [ ] Cancel scans and finish successful scans on both platforms; confirm no temporary scan images remain.
- [ ] In development builds on iOS and Android, dictate a document request in English and Spanish; confirm suggested fields are editable and reminders/notes are unchanged before saving.
- [ ] Deny camera, microphone and speech-recognition permissions; confirm a clear message appears and manual entry still works.
- [ ] Select an app language without an installed offline speech model; confirm dictation explains that on-device recognition is unavailable and manual entry remains available.
- [ ] Validation: saving an empty form shows errors on type, name and date.
- [ ] Typing `AB1234567` or `123-45-6789` in name/notes shows the privacy warning (saving is still allowed).
- [ ] Choosing a past date shows the "already passed" hint and the document appears as **Expired**.
- [ ] iOS: the date opens an inline calendar sheet; Android: the system date dialog.
- [ ] Leap day: 29 Feb 2028 can be selected and is displayed correctly.
- [ ] Dashboard counts and the coloured bar match the documents; tapping a status opens the filtered list.
- [ ] Documents list: search (try without accents: "jose" finds "José"), filters with counts, sort toggle, pull to refresh.
- [ ] Swipe left on a row → Delete → confirmation → removed.
- [ ] Details: days remaining, status, reminder dates, notes; Edit; Delete.
- [ ] Edit: change the date → reminder dates update on the details screen.
- [ ] Unsaved changes: Cancel / swipe down / Android back asks to discard.

## 4. Notifications

- [ ] Settings → Notifications shows permission status; **Send a test notification** arrives in ~5 s (app in background and in foreground).
- [ ] A scheduled reminder arrives at the chosen time with the right text and language.
- [ ] Tapping a reminder opens that document (also when the app was closed).
- [ ] Turn off **Show details in notifications** → the next reminder doesn't show the name or type.
- [ ] Delete a document → its pending reminders are gone (count in Settings → Notifications decreases).
- [ ] Change the expiration date → old reminders are replaced, no duplicates.
- [ ] Turn off **Expiration reminders** → scheduled count drops to 0; turn on → reminders return.
- [ ] Deny the permission in system settings → banners explain it; the app doesn't crash; **Open settings** works.
- [ ] Android: reboot the phone → reminders still fire.
- [ ] Change language → upcoming reminder texts are in the new language.
- [ ] Log out → no reminders fire for that account on this device.

## 5. Settings

- [ ] Language: System / English / Español / Português / Français — every screen, button, error and notification changes; choice persists after restart.
- [ ] Theme: System / Light / Dark — applies immediately (including date pickers and alerts) and persists.
- [ ] Privacy screen content is translated and accurate.
- [ ] Account: Log out works. Delete account asks twice, removes the account and returns to login; logging in again with that email fails.

## 6. Offline & resilience

- [ ] With documents loaded, enable airplane mode and restart the app → documents still visible with the offline banner.
- [ ] Offline save shows "You're offline. Connect to the internet to save changes."
- [ ] Back online → pull to refresh works and the banner disappears.

## 7. Platform & accessibility

- [ ] Safe areas: notch / Dynamic Island / Android gesture bar never cover content or buttons.
- [ ] Small phone (e.g. iPhone SE) and large phone layouts.
- [ ] Largest system font size: text wraps, nothing is cut off badly.
- [ ] VoiceOver / TalkBack read buttons, statuses and form errors meaningfully.
- [ ] Keyboard never hides the active field or the Save button.
