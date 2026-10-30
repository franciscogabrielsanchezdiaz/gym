# HYPERTROPHY

Aplicación personal React + TypeScript estricto + Vite. Interfaz en español, Tailwind CSS, Lucide, Dexie/IndexedDB, Recharts y vite-plugin-pwa. No hay API, cuenta de usuario ni almacenamiento remoto de registros.

## Ejecutar

Requisitos: Node.js 22 o posterior y npm.

```bash
npm ci
npm run dev
```

## Comprobar y compilar

```bash
npm test
npm run build
npm run preview
```

Para desplegar en Vercel, consulta [VERCEL.md](VERCEL.md). El proyecto incluye configuración de compilación, salida estática y cabeceras de caché.

`dist/` contiene la aplicación estática y el Service Worker. El Service Worker se activa en producción, no en el servidor de desarrollo.

## Estructura

- `src/model.ts`: tipos, rutinas, biblioteca, IndexedDB, progresión, validación y copias.
- `src/main.tsx`: navegación y pantallas.
- `src/ui.tsx`: campos, diálogos, gráficos e ilustraciones reutilizables.
- `src/style.css`: diseño adaptable y áreas seguras.
- `src/model.test.ts`: pruebas de lógica y copias.
- `src/persistence.test.ts`: persistencia, migración de IndexedDB y protección contra inicios duplicados.
- `e2e/offline.spec.ts`: pruebas de navegador sobre la compilación de producción.
- `vercel.json`: configuración de publicación en Vercel.
- `public/`: ilustración SVG original e iconos PNG locales.
- `vite.config.ts`: manifiesto PWA y precaché Workbox.

## Instalar en iPhone o Android

1. Publica `dist/` en un alojamiento estático HTTPS, en la raíz del dominio (por ejemplo Cloudflare Pages, Netlify o GitHub Pages con dominio propio). Usa `npm ci && npm run build` como compilación y `dist` como carpeta de salida. No subas archivos JSON con tus copias personales.
2. Abre la URL en Safari de iPhone. Espera que termine la carga inicial y recarga una vez. Compartir → Añadir a pantalla de inicio → Añadir.
3. En Android, Chrome → menú → Instalar aplicación / Añadir a pantalla de inicio.
4. El manifiesto se genera como `/manifest.webmanifest`, con iconos 192 y 512, modo standalone, inicio y scope en `/`. El SW está en `/sw.js`. Mantén ambos sin autenticación en un alojamiento independiente. La vista privada de Sites puede pedir acceso a su propietario; la app estática en tu propio hosting no requiere cuenta.

## Verificar modo avión y persistencia (en dispositivo)

1. Sirve producción (`npm run build && npm run preview`) o usa HTTPS. En escritorio localhost se considera contexto seguro.
2. Espera «Listo para usar sin conexión». Abre la aplicación y comprueba en DevTools → Application que `sw.js` esté activado y que Cache Storage contenga los recursos (JS/CSS/SVG/PNG/HTML). Instala y vuelve a abrir.
3. Comienza Full Body A, introduce carga, repeticiones y RIR; marca una serie. Pausa. Cierra la app por completo.
4. Activa modo avión. Abre desde la pantalla de inicio: deben aparecer «Sin conexión» y «Continuar entrenamiento» con los datos conservados. Finaliza y consulta el historial y las estadísticas.
5. Exporta un JSON, registra otro dato e importa la copia. La app valida antes y pide confirmar el reemplazo. Comprueba la recuperación. Prueba un archivo inválido: no debe modificar la base de datos.
6. Desactiva modo avión para recibir futuras actualizaciones. Si falta un recurso de la primera descarga, vuelve a conectar y recarga.

Las pruebas automatizadas incluyen Chromium real, IndexedDB y reapertura offline con Service Worker. Consulta [VERCEL.md](VERCEL.md) para ejecutarlas. No sustituyen la prueba física en Safari/iOS y Android. Las restricciones del sistema pueden variar.

## Uso y reglas

- Peso de ejercicios guardado internamente en kg. Mancuernas: registra la carga por mancuerna de forma consistente; máquinas: usa siempre la misma convención y anótala. El volumen de carga es una referencia interna y no compara directamente equipos diferentes.
- La sesión se guarda tras cada cambio y se recupera tras cerrar la app. Pausar detiene el cronómetro de sesión; cerrar sin pausar cuenta como tiempo transcurrido. El descanso usa una marca de tiempo persistida; el navegador puede suspender vibración y notificaciones en segundo plano. No hay notificaciones push.
- Sube de carga solo tras alcanzar el máximo en todas las series con técnica controlada y RIR 1–3. La sugerencia no modifica la carga. Puedes ajustar manualmente el peso según las placas de tu equipo. Los incrementos iniciales son 2.5 kg en compuestos y 1 kg en aislamiento; puedes personalizarlos por ejercicio en Ajustes.
- Historial y estadísticas solo consideran sesiones finalizadas; las series pendientes no suman volumen. Se muestran series efectivas del músculo principal para evitar doble conteo. Es una definición operativa basada en los datos introducidos.
- El peso corporal admite un registro diario (volver a guardar la fecha lo actualiza). El promedio usa los registros de los últimos 7 días. No se interpreta un cambio diario como músculo.
- Cambiar el día semanal cambia la planificación futura. Reprogramar una ocurrencia en el calendario conserva su ID `rutina:fecha-original`; la fecha real de las sesiones completadas permanece en el historial.
- Las alternativas necesitan una elección explícita. Si ya registraste series del ejercicio original se conservan separadas; la alternativa empieza con carga cero para que la confirmes.
- «Deshacer» recupera la última acción de series, orden, sustitución o edición del historial mientras la app sigue abierta. Otras eliminaciones piden confirmación.

## Protección de datos

Exporta JSON frecuentemente desde Ajustes. Restaurar reemplaza los datos mediante una transacción atómica. La exportación CSV sirve para análisis; no es un respaldo completo. El almacenamiento local puede perderse al borrar datos del navegador, desinstalar, usar navegación privada o por limpieza del sistema. «Solicitar almacenamiento persistente» depende del navegador y no sustituye las copias. No hay sincronización entre dispositivos. Los objetivos nutricionales son editables y orientativos; los macros registrados son estimaciones.
