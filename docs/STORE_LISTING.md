# Store listing preparation (App Store & Google Play)

Drafts and checklists to prepare the store pages. Review every item against the current App Store Connect and Google Play Console requirements before submitting — store rules change over time. Nothing here has been submitted or approved.

## Identity

| Field | Value (draft) |
| --- | --- |
| App name | SOS – ExpiryAlert |
| Subtitle (iOS, ≤ 30 chars) | Document expiration reminders |
| Short description (Play, ≤ 80 chars) | Remember when passports, licenses and insurance expire. Private by design. |
| Category | Productivity (alternative: Utilities) |
| Age rating | 4+ / Everyone (no user-generated public content, no ads, no purchases) |
| Bundle ID / package | Set your own in `app.json` (currently `com.yourcompany.sosexpiryalert`) |
| Price | Free (no in-app purchases in the MVP) |

## Description (English)

> Never miss an important date.
>
> SOS – ExpiryAlert reminds you before your important documents expire: passports, driver's licenses, national IDs, visas, residence permits, vehicle registration and insurance, medical insurance, professional certifications and more.
>
> • Add a document in seconds: type, name and expiration date.
> • Get reminders 90, 30, 7 and 1 day before — or choose your own.
> • See at a glance what is active, expiring soon or already expired.
> • Search, filter and sort all your documents.
> • Available in English, Spanish, Portuguese and French, with light and dark mode.
>
> Private by design: scan or dictate a document to suggest its type, name and expiration date. Text and speech recognition happen on your device; scan images are deleted, audio is not uploaded, and neither is saved. We never store document numbers or photos.

## Descripción (español)

> Nunca olvides una fecha importante.
>
> SOS – ExpiryAlert te avisa antes de que venzan tus documentos importantes: pasaportes, licencias de conducir, documentos de identidad, visas, permisos de residencia, registro y seguro del vehículo, seguro médico, certificaciones profesionales y más.
>
> • Agrega un documento en segundos: tipo, nombre y fecha de vencimiento.
> • Recibe avisos 90, 30, 7 y 1 día antes, o elige los tuyos.
> • Ve de un vistazo qué está vigente, por vencer o vencido.
> • Busca, filtra y ordena todos tus documentos.
> • En español, inglés, portugués y francés, con modo claro y oscuro.
>
> Privado desde el diseño: escanea o dicta un documento para sugerir su tipo, nombre y fecha de vencimiento. El reconocimiento de texto y voz se hace en tu dispositivo; las imágenes se eliminan, el audio no se sube y ninguno se guarda. No guardamos números de documento ni fotos.

Keywords (iOS, ≤ 100 chars, draft): `expiration,reminder,passport,license,visa,insurance,documents,renewal,expiry,alert`

## Screenshots

- Capture on a simulator/emulator or real device for each launch language.
- Suggested set: Dashboard, Documents list, Add document, Document details with reminders, Privacy screen, Dark mode.
- Use the sizes App Store Connect and Play Console currently request for phones. `supportsTablet` is `false`, so iPad screenshots are not required.

## App Review / Play review notes

- Provide a **demo account** (email + password) that already has a few documents.
- Explain that notifications are local reminders scheduled on the device, and how to trigger one quickly (Settings → Notifications → "Send a test notification").
- Mention that account deletion is available in Settings → Account → Delete account.

## Privacy declarations (guidance, verify before submitting)

Data the app handles:

| Data | Where | Purpose | Linked to user | Tracking |
| --- | --- | --- | --- | --- |
| Email address | Supabase Auth | Account creation and login | Yes | No |
| User ID | Supabase | Associate documents with the account | Yes | No |
| Document type, name/owner name, expiration date, notes, reminder settings | Supabase database | App functionality (reminders) | Yes | No |
| Preferences (language, theme, reminder time) | Device only | App functionality | No (not collected) | No |

The app has **no analytics, no advertising SDKs, no location, no contacts, no photo-library access, no payment data**. The camera and microphone are used only when the user explicitly starts a scan or voice dictation. Temporary scan images and audio are processed on-device and not uploaded or saved to the account.

**Apple – App Privacy labels:** Contact Info → Email Address (App Functionality, linked, not used for tracking); Identifiers → User ID (App Functionality, linked); User Content → Other User Content (App Functionality, linked). Data is not used for tracking.

**Google Play – Data safety:** Personal info → Email address (collected, required, app functionality, account management); App info and performance → none; "Other" user content for document details (collected, app functionality). Data is encrypted in transit (HTTPS). Users can request deletion: in-app (Settings → Account) **and** via a public web link — Google Play requires that web link for apps with accounts.

## Other required items

- Privacy policy URL (see `PRIVACY_POLICY_TEMPLATE.md`).
- Support URL or email.
- Account-deletion web URL (Google Play).
- Export compliance: the app only uses standard HTTPS encryption (`ITSAppUsesNonExemptEncryption = false` is set in `app.json`).
- Google Play: complete the content rating questionnaire, target audience (not designed for children), and the closed-testing requirement for new personal developer accounts.
