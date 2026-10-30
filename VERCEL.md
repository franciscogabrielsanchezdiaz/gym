# Publicar HYPERTROPHY en Vercel

La aplicación es estática. No necesita backend, variables de entorno ni una base de datos en Vercel. Los entrenamientos permanecen en IndexedDB en el dispositivo del usuario.

## Publicación desde Git

1. Descomprime el proyecto y sube su código a un repositorio Git. Incluye `package-lock.json`, `vercel.json`, `public/`, `src/` y los archivos de configuración; no subas `node_modules/`, copias personales ni perfiles de navegador.
2. En Vercel, elige **Add New → Project**, conecta tu proveedor Git e importa ese repositorio.
3. En **Root Directory**, selecciona la carpeta que contiene `package.json` y `vercel.json`. Si subiste la carpeta `hypertrophy` dentro de otro repositorio, selecciona `hypertrophy`.
4. Confirma estos valores (el archivo `vercel.json` ya los declara):

| Opción               | Valor                                          |
| -------------------- | ---------------------------------------------- |
| Framework Preset     | Vite                                           |
| Install Command      | `npm ci`                                       |
| Build Command        | `npm test && npm run build`                    |
| Output Directory     | `dist`                                         |
| Node.js              | 22.x o posterior compatible con `package.json` |
| Variables de entorno | Ninguna                                        |

5. Pulsa **Deploy**. Vercel proporciona una URL HTTPS. Para utilizarla diariamente, abre el dominio de producción estable del proyecto, no las URLs temporales de cada preview. Si está activada la protección de despliegues, configura el acceso de producción según tu preferencia; los recursos necesitan poder descargarse para instalar la PWA.
6. En cada nuevo push a la rama de producción, Vercel instalará, ejecutará las pruebas unitarias y compilará la aplicación. Las pruebas de navegador se ejecutan antes, localmente o en tu CI, mediante `npm run test:e2e`.

No se necesitan rewrites para esta aplicación: todas las pantallas se abren desde `/` y la navegación es interna. No añadas una regla que sirva HTML en lugar de `sw.js`, el manifiesto o los recursos.

## Publicación desde terminal (opcional)

Desde la carpeta del proyecto, con una cuenta propia de Vercel:

```bash
npm ci
npm test
npm run build
npx vercel
npx vercel --prod
```

El primer comando de Vercel solicita iniciar sesión y vincular o crear un proyecto. Revisa la URL antes de compartirla. No se ha realizado un despliegue a tu cuenta de Vercel desde este entorno.

## Comprobación después de publicar

- Abre la URL HTTPS y espera **«Listo para usar sin conexión»**.
- Comprueba `/sw.js` (JavaScript, no HTML), `/manifest.webmanifest` (JSON) y los iconos `/icon-192.png` y `/icon-512.png`.
- En DevTools → Application, comprueba que el Service Worker esté activado, la caché contenga los recursos y IndexedDB muestre `hypertrophy-v1`.
- Registra una serie, cierra la aplicación, desactiva la red y vuelve a abrir la misma URL/perfil. Debes poder continuar la sesión, modificarla y finalizarla.
- En iPhone: Safari → Compartir → Añadir a pantalla de inicio. En Android: Chrome → Instalar aplicación.

`vercel.json` evita una caché prolongada del Service Worker, el HTML y el manifiesto; los assets con hash sí pueden almacenarse durante un año. Workbox precachea los recursos necesarios para abrir la aplicación sin red. La primera descarga requiere conexión y HTTPS (o localhost para pruebas).

## Tus datos al cambiar de dominio

**IndexedDB y la caché pertenecen a cada origen y perfil de navegador.** Cambiar de la vista privada de Sites a Vercel, cambiar el dominio o abrir una preview crea otro almacenamiento independiente. Exporta JSON en la URL anterior e impórtalo en el dominio definitivo. No basta con volver a desplegar el código para mover los registros.

Actualizar la aplicación en el mismo dominio conserva IndexedDB. La migración de esquema añadida conserva las sesiones anteriores y crea el índice `started` necesario para mostrar el historial. Los registros pueden perderse al borrar datos del navegador o por limpieza del sistema; mantén tus copias JSON.

## Ejecutar las comprobaciones en otra máquina

```bash
npm ci
npm test
npx playwright install chromium
npm run test:e2e
```

En Linux de CI puede hacer falta `npx playwright install --with-deps chromium`. El ejecutor usa `/usr/bin/chromium` si existe; también admite `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Las pruebas de navegador sirven la compilación de producción: prueban IndexedDB real, cierre y reapertura de pestaña, reinicio completo del navegador con perfil persistente, reapertura sin red a través del Service Worker y guardado de entrenamientos offline. Se ejecutan en Chromium de escritorio y con emulación móvil. La emulación móvil no sustituye una comprobación física en Safari/iOS.
