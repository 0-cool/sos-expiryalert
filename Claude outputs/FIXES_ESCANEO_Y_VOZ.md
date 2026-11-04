# Tareas: correcciones de escaneo y voz (SOS – ExpiryAlert)

Contexto: lee primero `CLAUDE.md`. Responde en español.

Reglas para esta tarea:
- Haz solo los cambios descritos aquí. No reformatees archivos que no tocas y no cambies versiones de dependencias.
- No cambies el esquema de la base de datos.
- Cada corrección debe ir acompañada de tests. Al final, `npm run verify` tiene que pasar.
- Trabaja en una rama: `git checkout -b fix/scan-voice`.

---

## Paso 0: guardar el trabajo actual (antes de corregir)

Todo está sin commit. Pregúntame antes de ejecutar estos pasos y luego haz commits separados:

1. **Formato.** Si se agregó Prettier, haz un commit solo de formato (`chore: format`). No mezcles ese cambio con lógica.
2. **Funcionalidad nueva:** `feat: escaneo y entrada por voz de documentos`.
3. **Documentación del proyecto:** `docs: CLAUDE.md`.

---

## 1. Escaneo: tomar la fecha que va DESPUÉS de la etiqueta de vencimiento

**Archivo:** `src/features/documents/scanParser.ts` (función `readExpirationDate`).

**Problema:**
- `line.replace(EXPIRY_LABEL, ' ')` se aplica a la línea original, pero `EXPIRY_LABEL` está escrita en minúsculas y sin acentos. Por eso no reemplaza nada.
- Si la misma línea contiene la fecha de expedición y la de vencimiento, se devuelve la primera fecha (la de expedición).

**Solución esperada:**
- Busca la etiqueta en la línea normalizada con `normalizeText`.
- Analiza solo el texto que viene **después** de la etiqueta en esa línea. `normalizeText` conserva la longitud en caracteres latinos, así que puedes usar el índice directamente. Si no, usa una versión con offsets como `normalizeWithOffsets` de `voiceCommandParser.ts`.
- Si no hay una fecha después de la etiqueta en esa línea, revisa las 2 líneas siguientes, como ya se hace hoy.
- Si en la línea hay otra etiqueta de emisión o nacimiento antes de la de vencimiento, esas fechas no deben usarse.

**Tests nuevos** en `src/features/documents/__tests__/scanParser.test.ts`:
- `"Expedición 01/02/2022 Vence 01/02/2028"` → `2028-02-01`
- `"Date of issue 05/03/2021 Date of expiry 05/03/2031"` → `2031-03-05`
- `"FECHA DE VENCIMIENTO\n15/11/2030"` (con la fecha en la línea siguiente) → `2030-11-15`
- Una etiqueta en mayúsculas y con acento, `"EXPIRACIÓN: 10/10/2029"` → `2029-10-10`

## 2. Escaneo: fechas numéricas ambiguas (día/mes frente a mes/día)

**Archivo:** `src/features/documents/scanParser.ts` (función `parseDate`).

**Problema:** cuando las dos primeras cifras son 12 o menos (por ejemplo `05/11/2030`), siempre se interpreta como día/mes. Los documentos de EE. UU. usan mes/día.

**Solución esperada:**
- `parseDate` debe aceptar un parámetro opcional `order: 'DMY' | 'MDY'`, con `'DMY'` por defecto.
- En `parseScannedDocument`, usa `'MDY'` solo si el texto tiene señales claras de EE. UU.: `USA`, `UNITED STATES` o el nombre de un estado + `DRIVER LICENSE`. En cualquier otro caso usa `'DMY'`.
- Cuando el orden sea ambiguo (las dos cifras ≤ 12), la fecha se sigue sugiriendo. El banner de revisión que ya existe (`scanReview`) pide verificarla: no cambies el texto.

**Tests nuevos:**
- `"USA DRIVER LICENSE\nEXP 05/11/2030"` → `2030-05-11`
- `"LICENCIA DE CONDUCIR\nVence: 05/11/2030"` → `2030-11-05`
- `"Vence: 25/11/2030"` → `2030-11-25` (el 25 no puede ser un mes)

## 3. Voz: no sobrescribir lo que el usuario escribe mientras dicta

**Archivo:** `src/components/documents/DocumentForm.tsx`.

**Problema:** `applyVoiceRequest` (y el bloque posterior al `await` en `handleScan`) arma `next` con el `values` que existía cuando se tocó el botón. Los listeners de voz conservan esa copia, así que, si el usuario edita las notas o los recordatorios mientras habla, el resultado de la voz borra esos cambios.

**Solución esperada:**
- Usa la forma funcional `setValues((prev) => { … })` para combinar los campos detectados con el estado más reciente.
- Calcula `dirty` y los errores a partir de ese mismo `next`. Para no ejecutar efectos secundarios dentro del updater, puedes leer el valor más reciente desde un `valuesRef` que se actualice en un `useEffect`. Si usas una ref, actualízala en un efecto, nunca durante el render, para respetar la regla de ESLint `react-hooks/refs`.
- Solo se rellenan los campos que la voz o el escaneo detectaron. `notes` y `reminderDays` nunca se tocan.

**Test nuevo** en `DocumentForm.test.tsx`, con `expo-speech-recognition` simulado (mock) y `isRunningInExpoGo` devolviendo `false`:
1. Inicia la voz.
2. Mientras escucha, cambia las notas.
3. Emite un resultado final: `"Add my passport, John Smith, expiring December 22, 2026"`.
4. Verifica que las notas se conservan y que el tipo, el nombre y la fecha se rellenaron.

## 4. Textos de permisos de cámara y micrófono en los 4 idiomas

**Archivo:** `app.json`. Crea también `locales/en.json`, `locales/es.json`, `locales/pt.json` y `locales/fr.json` en la raíz del proyecto.

**Problema:** los textos que muestra el sistema al pedir permisos (en los plugins `expo-camera` y `expo-speech-recognition`) solo están en español.

**Solución esperada:**
- En los plugins, deja el texto por defecto **en inglés**.
- Agrega `"locales": { "en": "./locales/en.json", "es": "./locales/es.json", "pt": "./locales/pt.json", "fr": "./locales/fr.json" }` dentro de `expo`. Cada archivo debe tener:

```json
{
  "ios": {
    "NSCameraUsageDescription": "…",
    "NSMicrophoneUsageDescription": "…",
    "NSSpeechRecognitionUsageDescription": "…"
  }
}
```

- Los textos deben explicar que el procesamiento es en el dispositivo y que nada se sube. Usa como base los textos en español que hoy están en `app.json`.
- **Comprobación:** `npx expo config --type introspect` debe mostrar las claves en `ios.infoPlist`, y `npx expo prebuild --platform ios --no-install` (en una copia o rama de prueba, borrando luego `ios/`) debe generar los `.lproj` con `InfoPlist.strings`.

## 5. Limpieza menor

- En `app.json`, elimina `extra.router.asyncRoutes.web`, porque la app no tiene versión web. Conserva `extra.eas.projectId`.

## 6. Documentación (actualizar para que sea coherente con lo nuevo)

- **`CLAUDE.md`:** la regla 1 decía que no había cámara. Debe quedar así: escaneo y voz opcionales, procesados en el dispositivo, imágenes borradas, nada se sube ni se guarda. También debe decir que escanear y dictar requieren el build de desarrollo (no Expo Go).
- **`docs/STORE_LISTING.md`:** la app usa cámara y micrófono, pero no recopila esos datos porque se procesan en el teléfono. Indícalo en las etiquetas de privacidad de Apple y en la sección *Data safety* de Google Play.
- **`docs/TESTING.md`:** agrega pruebas en el build de desarrollo, en iOS y en Android:
  - escanear una licencia y un pasaporte;
  - dictar en inglés y en español;
  - denegar los permisos;
  - usar un idioma sin modelo de voz sin conexión;
  - confirmar que no quedan imágenes temporales.

---

## Criterios de aceptación

- `npm run verify` pasa: TypeScript, lint, Jest y los tests de base de datos.
- Hay tests nuevos para los puntos 1, 2 y 3.
- `git diff` solo muestra los archivos de esta tarea, sin reformateos de otros archivos.
- Haz un commit por punto (`fix(scan): …`, `fix(voice): …`, `chore(config): …`, `docs: …`) y luego abre un PR o haz merge a `main` y `push`.
- **Prueba manual final** con `npx eas-cli build --profile development --platform android`: instala la APK, escanea un documento real y dicta uno.
