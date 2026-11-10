# Suscripciones con RevenueCat — SOS – ExpiryAlert v1.1

Este documento tiene dos partes:

- **Parte A:** pasos manuales que haces tú en las consolas (Google Play, App Store Connect, RevenueCat).
- **Parte B:** instrucciones para Claude Code (código, tests y documentación).

Haz la Parte A hasta el paso A4 antes de pedirle a Claude Code la Parte B. Los pasos A5 y A6 necesitan un build que ya incluya RevenueCat.

---

## Planes

| Plan | Precio | Período | Qué incluye |
|---|---|---|---|
| **Free** | US$0 | — | Hasta **3 documentos**. Todas las demás funciones. |
| **Standard** | US$4.99 | Mensual | Documentos ilimitados |
| **Premium** | US$9.99 | Cada 6 meses | Documentos ilimitados. **Ahorra 67 %** (equivale a US$1.67/mes). |

- Standard y Premium dan **las mismas funciones**. Lo único que cambia es el período de cobro.
- El escaneo y la voz siguen disponibles en Free. El único límite es la cantidad de documentos.
- El usuario Free que ya tenga más de 3 documentos **no pierde nada**: puede verlos, editarlos y borrarlos, pero no crear nuevos hasta que se suscriba o quede por debajo de 3.

### Identificadores (usar exactamente estos)

| Dónde | Standard (mensual) | Premium (6 meses) |
|---|---|---|
| Google Play: suscripción `sos_pro` → plan base | `monthly` (Mensual) | `six-months` (Cada 6 meses) |
| App Store Connect: grupo "SOS Pro" → producto | `sos_pro_monthly` (1 mes) | `sos_pro_6m` (6 meses) |
| RevenueCat: paquete en la offering `default` | `$rc_monthly` | `$rc_six_month` |
| RevenueCat: entitlement | `pro` | `pro` |

---

# PARTE A — Pasos manuales (los haces tú)

## A1. Perfiles de pago y contratos

**Google Play Console**
1. Ve a **Configuración → Perfil de pagos** y créalo con tus datos personales, tu cuenta bancaria y la información fiscal (formulario W-8BEN para persona fuera de EE. UU.).

**App Store Connect**
1. Ve a **Business (Negocio)** y acepta el **Paid Apps Agreement**.
2. Completa los datos bancarios y fiscales (W-8BEN). Hasta que el estado diga **Active**, las compras no funcionan, ni siquiera en pruebas.

## A2. Crear la cuenta en RevenueCat

1. Crea una cuenta en revenuecat.com. Es gratis hasta 2.500 USD de ingresos mensuales.
2. Crea el proyecto **SOS – ExpiryAlert**.
3. **Agrega la app de Google Play:**
   - Paquete `com.soscompany.expiryalert`.
   - Sube la **clave JSON de la service account** de Google. RevenueCat tiene una guía paso a paso para crearla y darle permisos en Play Console. Los permisos tardan hasta 36 horas en activarse.
4. **Agrega la app de App Store:**
   - Bundle ID `com.soscompany.expiryalert`.
   - Sube la **In-App Purchase Key (.p8)**, que se genera en App Store Connect → Users and Access → Integrations → In-App Purchase.
5. Copia las dos **Public SDK API keys**: la de Apple empieza por `appl_` y la de Google por `goog_`. Son públicas y se pueden poner en la app.
6. Copia también una **Secret API key** (empieza por `sk_`). **Nunca va en la app.** Solo se guarda como secreto de Supabase (paso B6).

## A3. Crear las suscripciones en App Store Connect

1. Ve a tu app → **Monetization → Subscriptions** y crea el grupo **SOS Pro**.
2. Crea el producto `sos_pro_monthly`:
   - Duración: **1 mes**.
   - Precio: **US$4.99**. Apple calcula los precios de los demás países.
3. Crea el producto `sos_pro_6m`:
   - Duración: **6 meses**.
   - Precio: **US$9.99**.
4. En cada producto completa:
   - **Nombre visible y descripción** en EN, ES, PT y FR.
   - **Captura para revisión:** una captura de la pantalla de pago (puedes subirla después del paso B).
5. En **Users and Access → Sandbox**, crea un **tester sandbox** con un email que no sea tu Apple ID real.
6. En la descripción de la app en la tienda, añade al final:
   `Terms of Use: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`

> La **primera** suscripción se envía a revisión **junto con una versión de la app** (la 1.1). Apple las revisa juntas.

## A4. Crear las suscripciones en Google Play Console

Google solo te deja crear productos **después** de subir un build que incluya la librería de facturación. Por eso este paso va así:

1. Pídele a Claude Code solo los pasos **B1 y B2** (instalar RevenueCat). Genera un build de producción y súbelo a **Prueba interna**.
2. Ve a **Monetizar → Productos → Suscripciones** y crea la suscripción `sos_pro` con el nombre "SOS Pro".
3. Agrega el plan base `monthly`:
   - **Renovación automática, Mensual**.
   - **US$4.99**. Usa "Configurar precios" para que Google convierta al resto de países.
4. Agrega el plan base `six-months`:
   - **Renovación automática, Cada 6 meses**.
   - **US$9.99**.
5. **Activa** los dos planes base.
6. Ve a **Configuración → Pruebas de licencia** y agrega tu Gmail y el de tus testers. Así pueden comprar sin que se les cobre.

## A5. Configurar los productos en RevenueCat

1. Ve a **Product catalog → Products** e importa los productos de las dos tiendas. Deberías ver `sos_pro:monthly`, `sos_pro:six-months`, `sos_pro_monthly` y `sos_pro_6m`.
2. Ve a **Entitlements**, crea `pro` y asígnale los 4 productos.
3. Ve a **Offerings**, crea `default` y márcala como *current*. Dentro:
   - El paquete **Monthly** (`$rc_monthly`) con `sos_pro:monthly` y `sos_pro_monthly`.
   - El paquete **Six Month** (`$rc_six_month`) con `sos_pro:six-months` y `sos_pro_6m`.
4. Ve a **Integrations → Webhooks** y configura la URL de la Edge Function del paso B6:
   - URL: `https://<tu-proyecto>.supabase.co/functions/v1/revenuecat-webhook`
   - Authorization header: un valor largo y aleatorio. Guárdalo, porque también va en Supabase (B6).

## A6. Probar las compras

- **Android:** instala el build desde la prueba interna con una cuenta de **prueba de licencia**. En las pruebas, las renovaciones van aceleradas: un mes dura 5 minutos.
- **iOS:** usa el build de TestFlight con la cuenta **sandbox**.
- **En ambas plataformas verifica:**
  1. Que se compran los dos planes.
  2. Que se restauran las compras.
  3. Que se desbloquea la creación de más de 3 documentos.
  4. Que el límite vuelve cuando la suscripción expira.

---

# PARTE B — Instrucciones para Claude Code

Contexto: lee primero `CLAUDE.md`. Responde en español.

**Reglas:**
- Trabaja en la rama `feat/subscriptions`.
- Haz un commit por paso (`feat(plans): …`, `feat(paywall): …`, `feat(db): …`, `docs: …`).
- No cambies versiones de dependencias que ya existen ni reformatees archivos que no tocas.
- Todo texto visible va en `src/i18n/locales/{en,es,pt,fr}.ts`. Nada de textos fijos en el código.
- **Seguridad:**
  - Las *public SDK keys* de RevenueCat van en variables `EXPO_PUBLIC_*`.
  - La *secret key* (`sk_…`) y el secreto del webhook **solo** van en los secretos de las Edge Functions de Supabase. Nunca en la app, nunca en `.env` con el prefijo `EXPO_PUBLIC_` y nunca en git.
- **Privacidad:**
  - A RevenueCat solo se envía el **UUID del usuario de Supabase** como `appUserID`.
  - Nunca se envían el email, el nombre ni los datos de documentos.
  - No se activan atributos de suscriptor ni integraciones de analítica.
- Al final, `npm run verify` tiene que pasar.

## B1. Dependencias y configuración

1. Instala las dependencias:
   ```bash
   npx expo install react-native-purchases
   ```
   No instales `react-native-purchases-ui`: la pantalla de pago es propia.
2. En `src/lib/env.ts`, agrega `EXPO_PUBLIC_REVENUECAT_IOS_KEY` y `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`. Las dos son opcionales: si faltan, la app funciona en modo Free sin que se rompa nada.
3. Agrega las dos variables, con valores vacíos de ejemplo, a `.env.example`.
4. Recuérdame configurarlas en EAS (`eas env:create`) para los entornos `preview` y `production`.
5. En `__mocks__` o en `jest.setup`, agrega un mock de `react-native-purchases` que se pueda configurar desde cada test (offerings, customerInfo, purchasePackage, restorePurchases).

## B2. Servicio y provider de suscripción

1. Crea `src/features/subscription/purchasesService.ts`, una capa fina sobre el SDK con estas funciones:
   - `configure()`: llama a `Purchases.configure({ apiKey })` según `Platform.OS`, una sola vez. Si no hay key, no hace nada.
   - `logIn(userId)` y `logOut()`: se llaman cuando cambia la sesión de Supabase en `AuthProvider`. Usa `Purchases.logIn(session.user.id)`.
   - `getOfferings()`, `purchase(pkg)`, `restore()`, `getCustomerInfo()`.
   - `getManagementUrl()`: devuelve `customerInfo.managementURL`, que abre la gestión de suscripciones de la tienda.
2. Crea `src/features/subscription/SubscriptionProvider.tsx` con el hook `useSubscription()`. Debe exponer:
   - `plan: 'free' | 'pro'`.
   - `isPro`: si el entitlement `pro` está activo.
   - `expiresAt` y `willRenew`.
   - `packages`: `monthly` y `sixMonth`, o `null`.
   - `loading` y `error`.
   - Las acciones `purchase`, `restore` y `refresh`.
3. Escucha `Purchases.addCustomerInfoUpdateListener` y quita el listener cuando el componente se desmonte.
4. Guarda el último estado de `isPro` en el kv-store para que la app sepa el plan sin conexión.
5. Si el usuario cancela la compra (`userCancelled`), no se muestra ningún error.
6. Monta el provider en `src/app/(app)/_layout.tsx`, dentro de `AuthProvider`.

## B3. Límite de 3 documentos

En `src/features/plans/plans.ts`:

1. Reemplaza los planes por `free` (`maxDocuments: 3`) y `pro` (ilimitado). Elimina `family` y `priceUsdPerYear`, porque los precios vienen de la tienda.
2. Pon `PLAN_LIMITS_ENFORCED = true`.
3. Elimina `canCustomizeReminders`, o haz que siempre devuelva `true`: los recordatorios personalizados quedan para todos. Revisa dónde se usa.
4. Cambia `getCurrentPlan()` para que use `useSubscription()` en lugar de devolver `'free'` siempre.

Aplica el límite en la UI:

- **Botón "Add document"** (Overview, Documents y el `+` del header): si `!canAddDocument(plan, count)`, abre la pantalla de pago en lugar del formulario.
- **Ruta `documents/new`:** valida también al entrar, por si se llega por deep link.
- **Overview:** si el usuario está en Free, muestra un indicador discreto "**2 of 3 free documents used**" con el enlace "Upgrade".
- **Ajustes:** agrega una fila **"Plan"** que muestre "Free", "Standard" o "Premium" y que abra la pantalla de pago, o la gestión de la suscripción si ya es Pro.

## B4. Pantalla de pago (`src/app/(app)/paywall.tsx`, modal)

**Contenido**, en este orden:

1. Icono de la app y el título **"Never miss an expiration date"**.
2. Beneficios con un check: documentos ilimitados; recordatorios para toda la familia; escaneo y voz en el dispositivo; cancela cuando quieras.
3. Dos tarjetas de plan, con **Premium (6 meses) preseleccionada**:
   - **Premium:**
     - Una insignia llamativa **"Save 67%"** y la etiqueta **"Best value"**.
     - Encima del precio, en grande: **"{{perMonth}}/month"**.
     - Debajo, en pequeño: "{{price}} every 6 months".
   - **Standard:** "{{price}}/month".
4. Botón principal: **"Continue"**.
5. Texto legal obligatorio (Apple 3.1.2):
   > "Payment is charged to your Apple ID / Google Play account. The subscription renews automatically unless cancelled at least 24 hours before the end of the period. Manage or cancel it in your store account settings."
6. Enlaces: **Restore purchases**, **Terms of Use** (el EULA estándar de Apple en iOS, o tu página de términos), **Privacy Policy**.

**Cálculos.** Ponlos en `src/features/subscription/pricing.ts` como funciones puras con tests:

- `savingsPercent(monthly, sixMonth) = round((1 - sixMonth.price / (monthly.price * 6)) * 100)`. Con US$4.99 y US$9.99 da **67**.
- `perMonth(sixMonth) = sixMonth.price / 6`, formateado con `Intl.NumberFormat(locale, { style: 'currency', currency: product.currencyCode })`.
- **Nunca** escribas los precios en el código. Usa siempre `product.priceString` y `product.price` que devuelve la tienda, para que cada país vea su moneda.
- Si no hay offerings (sin conexión, o sin keys en Expo Go): muestra un estado de error con "Try again". La app sigue en Free.

**Después de comprar o restaurar con éxito:**

1. Llama a la Edge Function `sync-entitlement` (B6).
2. Cierra el modal.
3. Si el usuario venía de "Add document", ábrele el formulario.

## B5. Cuenta y borrado

- En `settings/account.tsx`, antes de confirmar el borrado de la cuenta, muestra este aviso si `isPro`:
  > "Deleting your account doesn't cancel your subscription. Cancel it in your store account first."

  Añade un botón **"Manage subscription"** que abra `getManagementUrl()`.
- Al cerrar sesión, llama a `Purchases.logOut()`. Si el usuario es anónimo, ignora el error.

## B6. Límite en el servidor (Supabase)

Esto evita que alguien se salte el límite insertando documentos directamente por la API.

1. **Migración nueva**, `supabase/migrations/<timestamp>_subscriptions.sql`:
   - Tabla `public.entitlements`:
     - `user_id uuid primary key references auth.users on delete cascade`
     - `pro_until timestamptz`
     - `updated_at timestamptz default now()`
   - **RLS:** el usuario solo puede **leer** su fila. No hay políticas de insert, update ni delete para `authenticated`; solo escribe la service role desde las Edge Functions.
   - Función `public.enforce_document_limit()` y trigger `BEFORE INSERT ON public.documents`:
     - Si el usuario ya tiene `>= 3` documentos y no existe una fila con `pro_until > now()`, lanza `raise exception 'DOCUMENT_LIMIT_REACHED' using errcode = 'P0001'`.
   - Actualiza `delete_current_user()` si hace falta. El `on delete cascade` ya debería cubrirlo.
2. **Edge Function `revenuecat-webhook`:**
   - Valida el header `Authorization` contra el secreto `REVENUECAT_WEBHOOK_AUTH`.
   - Según `event.app_user_id` y `event.expiration_at_ms`, actualiza `entitlements.pro_until` con la service role.
   - Ignora `app_user_id` que no tengan formato UUID (usuarios anónimos `$RCAnonymousID`).
   - Responde 200 rápido.
3. **Edge Function `sync-entitlement`**, que la llama la app después de comprar o restaurar:
   - Usa el JWT del usuario y lee su `user_id` del token, nunca del body.
   - Consulta `GET https://api.revenuecat.com/v1/subscribers/{user_id}` con el secreto `REVENUECAT_SECRET_KEY`.
   - Actualiza `pro_until` con la expiración del entitlement `pro`.
   - Esto evita esperar al webhook justo después de comprar.
4. **En la app:** en `documentsRepository`, mapea el error `DOCUMENT_LIMIT_REACHED` a un error tipado que abra la pantalla de pago.
5. Documenta en `README.md` cómo configurar los secretos:
   ```bash
   supabase secrets set REVENUECAT_SECRET_KEY=... REVENUECAT_WEBHOOK_AUTH=...
   ```
   Y cómo desplegarlas:
   ```bash
   supabase functions deploy revenuecat-webhook --no-verify-jwt
   supabase functions deploy sync-entitlement
   ```

## B7. Tests

| Archivo | Qué probar |
|---|---|
| `plans.test.ts` | `canAddDocument('free', 2) === true`; `canAddDocument('free', 3) === false`; `canAddDocument('pro', 500) === true` |
| `pricing.test.ts` | `savingsPercent` con 4.99/9.99 → `67`. `perMonth` → `1.67` en USD y el formato correcto en `es` y `fr` (por ejemplo `1,67 $US`). Divisiones por 0 o productos que faltan → `null`. |
| `paywall.test.tsx` | Muestra "Save 67%" y Premium preseleccionado. "Restore purchases" llama a `restore`. Si el usuario cancela, no aparece ningún error. Sin offerings → estado de error. |
| Test de navegación | Con 3 documentos en Free, "Add document" abre la pantalla de pago. Con Pro, abre el formulario. |
| `supabase/tests/rls.test.mjs` | El 4.º insert sin entitlement falla con `DOCUMENT_LIMIT_REACHED`. Con `pro_until` en el futuro, pasa. Con `pro_until` vencido, falla. El usuario no puede escribir en `entitlements`. |

## B8. Documentación

- **`CLAUDE.md`:**
  - Actualiza la sección de planes: Free con 3 documentos, Standard (US$4.99/mes), Premium (US$9.99 cada 6 meses), entitlement `pro`.
  - Agrega las reglas: no escribir precios en el código; la secret key solo va en Supabase.
- **`docs/STORE_LISTING.md`:**
  - **Data safety de Google:** "Historial de compras", recopilado para la funcionalidad de la app y procesado por RevenueCat.
  - **Etiqueta de privacidad de Apple:** "Purchases → Purchase History", vinculado al usuario, App Functionality, sin rastreo.
  - Agrega a la descripción de la tienda los planes y el enlace a los Terms of Use.
- **`docs/PRIVACY_POLICY_TEMPLATE.md`:** agrega a **RevenueCat** como procesador. Solo recibe el identificador anónimo del usuario y los datos de la compra de la tienda.
- **`docs/TESTING.md`:** agrega las pruebas del paso A6.
- **`app.json`:** sube `version` a `1.1.0`.

## Criterios de aceptación

- `npm run verify` pasa.
- Sin las keys de RevenueCat, la app arranca en Free y no se cierra.
- Un usuario Free no puede crear un 4.º documento, ni desde la app ni por la API.
- La pantalla de pago muestra los precios de la tienda en la moneda local y "Save 67%" en Premium.
- La compra, la restauración y la expiración funcionan en Android (prueba de licencia) y en iOS (sandbox).
- `git diff` solo muestra los archivos de esta tarea.
- La secret key y el secreto del webhook no aparecen en el repo (`git grep -n "sk_"` no devuelve nada).
