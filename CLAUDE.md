# CLAUDE.md — SOS – ExpiryAlert

Contexto del proyecto para Claude Code. Léelo completo antes de cambiar nada.

- **Responde siempre en español.** El dueño es John Smith (República Dominicana) y esta es su primera app: explica en pasos simples y da comandos exactos para **Windows / PowerShell**.
- Ruta local: `C:\projects\SOS Company\SOS - ExpiryAlert` (tiene espacios: usa comillas en los comandos).
- Repositorio: `https://github.com/0-cool/sos-expiryalert` (rama `main`, remoto `origin`).
- Las guías oficiales de Expo para agentes están en `AGENTS.md` (importado al final de este archivo).

---

## ⚠️ Primero: estado detectado el 4 nov 2026 (resolver y luego borrar esta sección)

Después del commit inicial (`Initial commit: SOS – ExpiryAlert MVP`) aparecieron cambios locales sin commitear que **rompen el proyecto**:

1. **Dependencias degradadas** en `package.json` / `package-lock.json`: `expo ^51.0.39`, `jest ^29.7.0`, `jest-expo ^32.0.1`, `@react-native-community/datetimepicker ^8.4.0`. Pero el resto sigue en SDK 58 (`react-native 0.88.1`, `expo-router ~58.0.30`, `react 19.3.0`). Esa mezcla es incompatible. **El proyecto es Expo SDK 58: no lo bajes de versión.**
2. **`.env.example` tiene la URL y la clave reales de Supabase.** Ese archivo va en git y debe quedar como plantilla vacía. Los valores reales ya están en `.env` (que git ignora).
3. **El repositorio de GitHub sigue vacío** (todavía no se hizo `push`).

Solución propuesta (pide confirmación a Juan antes de ejecutarla, porque descarta esos cambios locales):

```powershell
cd "C:\projects\SOS Company\SOS - ExpiryAlert"
git checkout -- package.json package-lock.json .env.example
Remove-Item -Recurse -Force node_modules
npm ci
npm run verify
git push -u origin main
```

Si `npm install` o `npm ci` fallan en Windows, **diagnostica el error real** (léelo y pégalo); no lo "arregles" bajando versiones de Expo. El `package-lock.json` del commit inicial se verificó con `npm ci` en limpio. Incluye un `overrides` de `react-dom` para resolver un conflicto de peers de `expo-router`: no lo quites.

---

## Qué es la app

App móvil nativa (iOS + Android, **no web**) que recuerda cuándo vencen documentos importantes (pasaporte, licencia, visa, seguros, certificaciones…) y envía notificaciones antes del vencimiento. Es la primera app de la marca "SOS" (más adelante: SOS Cobros, SOS Vencimientos para negocios, SOS Flota).

Principio de producto: **simple, confiable y privada**. Agregar un documento debe tomar menos de 30 segundos.

Estado: **MVP completo, no probado aún en teléfonos reales.** Verificado: TypeScript estricto y ESLint sin errores, 153 tests de Jest (12 suites), 22 tests de base de datos (RLS) y bundles de iOS y Android compilados con `expo export`.

## Stack (versiones del commit inicial; no las cambies sin motivo)

| Pieza                | Versión                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Expo SDK             | 58 (`expo ~58.0.23`)                                                                                |
| React Native / React | 0.88.1 / 19.3.0                                                                                     |
| TypeScript           | ~6.0 (strict + `noUncheckedIndexedAccess`)                                                          |
| Navegación           | `expo-router ~58.0.30` (rutas en `src/app`)                                                         |
| Backend              | Supabase (`@supabase/supabase-js ^2.119`), Postgres con RLS                                         |
| Notificaciones       | `expo-notifications ~58.1` (solo locales)                                                           |
| i18n                 | `i18next ^26` + `react-i18next ^17` + polyfill `intl-pluralrules`                                   |
| Animación / gestos   | `react-native-reanimated 4.7.1` + `react-native-worklets 0.13`, `react-native-gesture-handler ~3.3` |
| Almacenamiento local | `expo-sqlite` (`localStorage` para la sesión, `kv-store` para preferencias y caché)                 |
| Tests                | `jest ^30` + `jest-expo ~58` + `@testing-library/react-native ^14` + PGlite                         |
| Lint                 | ESLint 9 + `eslint-config-expo` (flat config)                                                       |

## Comandos

| Comando                                                  | Para qué                                                                         |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `npx expo start` (`-c` limpia caché)                     | Servidor de desarrollo; abrir con **Expo Go** (QR)                               |
| `npm run typecheck`                                      | TypeScript                                                                       |
| `npm run lint`                                           | ESLint                                                                           |
| `npm test`                                               | Jest (unitarios + componentes)                                                   |
| `npm run test:db`                                        | Migración + RLS sobre PostgreSQL real (PGlite)                                   |
| `npm run verify`                                         | Todo lo anterior. **Ejecútalo antes de dar cualquier tarea por terminada.**      |
| `npx expo install <paquete>`                             | **Única forma de agregar dependencias** (elige versiones compatibles con el SDK) |
| `npx expo-doctor`                                        | Diagnóstico (pendiente de correr con internet)                                   |
| `npx eas-cli@latest build --profile preview\|production` | Builds en la nube (ver README)                                                   |

## Estructura

```
src/app/            Pantallas (Expo Router). Solo pantallas aquí.
  _layout.tsx       Providers, splash, grupos protegidos, ErrorBoundary
  onboarding.tsx, (auth)/*, (app)/(tabs)/{index,documents,settings}, (app)/documents/*, (app)/settings/*
src/components/     UI reutilizable (ui/), widgets de documentos y de auth
src/features/       Lógica sin UI: auth, documents, notifications, reminders, settings, onboarding, plans
src/i18n/           i18next, locales en/es/pt/fr, formateadores de fecha y hora
src/lib/            dates, env, errors, storage, supabase client, network, haptics, coalesce
src/theme/          Tokens de diseño (claro/oscuro) y ThemeProvider
supabase/           migrations/ (SQL) y tests/ (PGlite)
docs/               TESTING.md (checklist en dispositivo), STORE_LISTING.md, PRIVACY_POLICY_TEMPLATE.md
```

## Reglas del proyecto (obligatorias)

1. **Privacidad.** Nunca agregues campos, columnas ni funciones para números de documento, de pasaporte, de identidad o de tarjeta, ni fotos o escaneos. La tabla solo tiene `document_type`, `document_name`, `expiration_date`, `notes` y `reminder_days`. Un test de BD verifica la lista exacta de columnas.
2. **Cero textos en duro.** Todo texto visible va en `src/i18n/locales/en.ts` (fuente de verdad) y en `es.ts`, `pt.ts` y `fr.ts`.
   - Las claves de `t()` están tipadas: una clave inexistente es un error de TypeScript.
   - Los tests exigen las mismas claves, las mismas variables `{{...}}` y las formas plurales en los 4 idiomas.
   - Para `count = 0` se usa el sufijo `_zero`.
3. **Lógica pura en `src/features`** (sin React ni módulos nativos donde sea posible) y con tests. Las pantallas solo componen.
4. **Solo iOS y Android.** `app.json` tiene `platforms: ["ios", "android"]`. No agregues `react-native-web`, Next.js ni WebViews.
5. **Compatibilidad con Expo Go.** Hoy todo corre en Expo Go. Si una librería nueva necesita código nativo fuera de Expo Go, avísale a Juan: obliga a usar un _development build_.
6. **Seguridad.** En la app solo va la clave publishable/anon (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Nunca la `service_role` ni `sb_secret_...` (`src/lib/env.ts` las rechaza). Nunca commitees `.env`.
7. **Cambios de base de datos.** Crea una migración nueva en `supabase/migrations/` (no edites la ya aplicada) y luego:
   - sincroniza las restricciones con `DOCUMENT_TYPES` (`src/features/documents/types.ts`) y con `REMINDER_DAY_OPTIONS` (`src/features/reminders/reminderOptions.ts`);
   - actualiza `src/lib/supabase/database.types.ts`;
   - agrega casos a `supabase/tests/rls.test.mjs`.
8. **Git.** Trabaja en una rama, con commits pequeños y descriptivos. No reescribas el historial ya publicado.

## Particularidades ya resueltas (no las "arregles" con conocimiento viejo)

- **Expo Router (SDK 58):**
  - `Tabs` se importa de `expo-router/js-tabs` (el de `expo-router` está deprecado).
  - `initialRouteName` ya no existe: se usa `export const unstable_settings = { anchor: '...' }`.
  - Los `Stack.Protected` del layout raíz llevan `redirectTo` explícito. Sin eso, al terminar el onboarding se mostraba "Page not found".
- **Encabezados en iOS 26:** son transparentes por defecto. Por eso todos los `Stack` definen `headerStyle.backgroundColor`.
- **Tipos de RN 0.88:**
  - Para refs usa `TextInputInstance` y `ScrollViewInstance` (importados de `react-native`).
  - `ColorValue` puede ser `null` o un número (ver `src/components/ui/Icon.tsx`).
- **ESLint con reglas de React Compiler (`react-hooks` v7):**
  - No escribas `ref.current` durante el render.
  - No llames `setState` de forma síncrona dentro de un efecto: usa estado derivado durante el render o setState dentro de callbacks o promesas.
  - No uses `Date.now()` en el render: usa el hook `useNow()`.
- **Jest:**
  - usa `resolver: react-native-reanimated/jest/resolver` y `setUpTests()`;
  - los mocks de `expo-sqlite`, `expo-haptics`, `expo-localization` y `safe-area` están en `jest.setup.ts`;
  - la zona horaria se fija en `America/New_York` (`jest.global-setup.js`) para probar los cambios de horario;
  - en RNTL 14, `render` y `fireEvent` son **async**: usa `await`.
- **`expo-asset`** debe ser dependencia directa porque `expo-font` lo importa.
- **Sesión de Supabase:** se guarda con `import 'expo-sqlite/localStorage/install'` y `storage: globalThis.localStorage`. No hace falta el polyfill de URL.
- **i18n:** usa `createInstance()` (no el singleton) e `initAsync: false`. El idioma se aplica antes de ocultar el splash para que no parpadee.
- **Tema:** la preferencia se aplica con `Appearance.setColorScheme('light' | 'dark' | 'auto')`, que también cambia los pickers y las alertas nativas.

## Cómo funcionan las piezas clave

- **Navegación:** el layout raíz espera a que estén cargados las preferencias, el onboarding y la sesión antes de ocultar el splash. Tiene tres grupos protegidos:
  - `onboarding` (si no se ha completado);
  - `(auth)` (completado y sin sesión);
  - `(app)` (con sesión).

  Durante la recuperación de contraseña, `isSignedIn` se mantiene en falso hasta que se actualiza la contraseña.

- **Auth:** email y contraseña. La verificación y la recuperación usan **códigos de 6 a 10 dígitos** escritos en la app (las plantillas de correo de Supabase deben incluir `{{ .Token }}`), no deep links. La eliminación de cuenta usa el RPC `delete_current_user()` (SECURITY DEFINER).
- **Datos:** `DocumentsProvider` muestra primero la caché local (funciona sin conexión), luego consulta el servidor y refresca al volver al primer plano. Todo pasa por `documentsRepository` y `authService`, que convierten los errores en `AppError` con código traducido. La caché se borra al cerrar sesión.
- **Notificaciones:** solo locales.
  - `planner.ts` (pura) calcula los avisos: N días antes, a la hora elegida (por defecto 9:00), con IDs deterministas `sos-reminder:<doc>:<días>:<instante>:<hash>`.
  - `notificationService.syncScheduledReminders` compara lo programado con lo planeado: cancela lo sobrante y agrega lo que falta. Así nunca hay duplicados.
  - Programa como máximo **60** avisos (iOS tiene un límite de 64) y renueva la ventana al abrir la app.
  - En Android usa el canal `expiry-reminders` y no pide permiso de alarmas exactas (bloqueado en `app.json`).
- **Planes:** `src/features/plans/plans.ts` prepara una futura suscripción (Free con 5 documentos, Premium a US$9.99 al año, Family a US$19.99 al año). En el MVP **no se aplica** (`PLAN_LIMITS_ENFORCED = false`).

## Próximos pasos sugeridos (en orden)

1. Resolver la sección ⚠️ de arriba y hacer el `push`.
2. **Supabase:**
   - ejecutar `supabase/migrations/20261104120000_create_documents.sql` en el SQL Editor;
   - agregar `{{ .Token }}` a las plantillas _Confirm signup_ y _Reset password_;
   - configurar SMTP propio antes de tener usuarios reales.
3. Probar en iPhone y Android con Expo Go siguiendo `docs/TESTING.md` y corregir lo que aparezca.
4. Cambiar `com.yourcompany.sosexpiryalert` en `app.json`. Luego:
   - `eas init`;
   - variables con `eas env:create` (el `.env` local no se sube a EAS);
   - build `preview`.
5. Preparar las tiendas:
   - política de privacidad publicada;
   - página web para solicitar la eliminación de la cuenta (Google Play la exige);
   - capturas y cuenta demo para los revisores;
   - en Play, prueba cerrada de 12 testers durante 14 días si la cuenta es personal.
6. Reemplazar el ícono provisional (`assets/brand/icon.svg` y los PNG de `assets/`).

## Limitaciones conocidas

- No se ha probado en dispositivos físicos. La revisión visual se hizo con un render web temporal que no forma parte del repo.
- En Android los recordatorios pueden llegar unos minutos tarde (entrega _best effort_). Se le avisa al usuario.
- Si Supabase no permite borrar `auth.users` desde una función, `delete_current_user()` debe reemplazarse por una Edge Function con la clave de servicio **en el servidor**.
- El servicio de correo por defecto de Supabase tiene límites estrictos: hace falta SMTP propio.
- ESLint 9 muestra un aviso de "deprecated". Se mantiene porque `eslint-plugin-import` aún no soporta la versión 10.

@AGENTS.md
