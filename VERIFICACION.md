# Verificación para Vercel — 29 de octubre de 2026

Resultado: proyecto compilable y preparado para publicación estática en Vercel. No se ha desplegado en una cuenta de Vercel ni modificado la publicación previa de Sites.

## Comprobaciones ejecutadas

- Instalación limpia con `npm ci`: correcta, usando `package-lock.json`.
- `npm test`: 19 pruebas aprobadas (progresión, CSV/JSON, validación, restauración, persistencia, migración del esquema y creación concurrente de sesiones).
- `npm run build`: TypeScript estricto y Vite correctos; genera `dist/`, manifiesto y Service Worker.
- `npm run test:e2e`: 4 pruebas aprobadas con Playwright/Chromium. Se usan proyectos de escritorio y vista móvil emulada. La prueba de reinicio usa un perfil de navegador persistente en disco.
- Registro de carga, repeticiones, RIR, notas y series completadas comprobado directamente en IndexedDB real del navegador.
- Cierre de pestaña, bloqueo de red y reapertura mediante el Service Worker: correcto. Se recupera la misma sesión y se puede modificar y finalizar offline sin duplicarla.
- Cierre completo de Chromium y reapertura con el mismo perfil persistente y sin red: conserva tanto IndexedDB como la caché y recupera la sesión.
- Migración desde el esquema anterior: conserva el historial y habilita su ordenación por fecha de inicio.
- Manifiesto, iconos y archivos compilados esenciales presentes en el precaché: correcto.
- `package.json` y lockfile sincronizados; `vercel.json` coincide con la salida estática y los comandos ejecutados.
- `git diff --check`: sin errores de formato.

Entorno utilizado: Node.js 24.19.0 y Chromium 154 en Linux. `.nvmrc` propone Node.js 22 para desarrollo; `package.json` admite Node.js 22 o posterior.

## Correcciones

1. Faltaba el índice `started` en IndexedDB, aunque el dashboard lo utilizaba. Se añadió mediante la versión 2 del esquema, manteniendo el nombre de la base y todos sus registros. La compilación por sí sola no detectaba este fallo de ejecución.
2. El inicio de sesión se realiza ahora en una transacción que reutiliza la sesión activa. Dos toques simultáneos no crean registros duplicados.
3. El estado «Listo para usar sin conexión» se muestra al activar el Service Worker y también cuando ya estaba instalado. Los fallos de registro muestran un mensaje específico.
4. Se separó la ejecución de pruebas unitarias y de navegador para evitar que Vitest intente ejecutar los escenarios de Playwright.
5. Se añadieron configuración de Vercel, cabeceras de caché, guía de despliegue y pruebas reproducibles.

## Límites

- Chromium con emulación móvil no verifica Safari/iOS ni un dispositivo Android físico. La instalación desde la pantalla de inicio y el modo avión deben comprobarse también en esos dispositivos.
- Las cabeceras de Vercel están declaradas en `vercel.json`; su respuesta real y la instalación HTTPS se comprueban después de publicar siguiendo `VERCEL.md`.
- Vite emite una advertencia de tamaño del paquete principal (~796 kB sin comprimir, ~241 kB gzip). No bloquea la compilación ni el precaché; las pruebas offline pasan.
- Cambiar de dominio no transfiere IndexedDB. Es necesario exportar JSON en el origen anterior e importarlo en la URL definitiva de Vercel.
