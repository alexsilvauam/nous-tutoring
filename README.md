# Nous (Ratium) - SPA educativa

App tipo Duolingo para ramas: Álgebra, Aritmética, Geometría y Lógica, con 3 niveles (básico/intermedio/avanzado), diagnóstico inicial y progreso guardado en `localStorage`.

## Ejecutar en local

- Opción rápida: abre `index.html` en el navegador (doble clic).
- Recomendado: servir como estático para evitar bloqueos de ruta hash.
  - Node: `npx serve .` o `npx http-server .`
  - Python: `python -m http.server 8080`
  - Luego abre `http://localhost:8080`

## Flujo principal

1. Bienvenida/Registro: ingresa nombre y edad, se guarda en `localStorage`.
2. Prueba diagnóstica: preguntas con puntos; desbloqueo según 0–3, 4–6, 7–9.
3. Mapa de progreso: nodos por rama y badges de niveles (bloqueados/desbloqueados).
4. Ejercicios: opción múltiple, pistas (hasta 3), solución, feedback y progreso.
5. Perfil: métricas simples.
6. Chat Ratium: IA vía endpoint serverless (`/api/chat`).

## Integración IA (OpenAI) y Deploy en Vercel

1) Crear cuenta en Vercel y OpenAI.
2) Subir este proyecto a GitHub.
3) En Vercel: New Project → Importa tu repo.
4) Variables de entorno (Project Settings → Environment Variables):
   - `OPENAI_API_KEY` = tu clave de OpenAI.
5) Estructura ya lista:
   - Función serverless: `api/chat.js`
   - Frontend llama a `/api/chat` desde el chat.
6) Deploy: click Deploy. Obtendrás `https://tuapp.vercel.app`.

## Probar IA en local (opcional)

- Requiere un server local (Vercel CLI):
  - Instala: `npm i -g vercel`
  - En el proyecto: `vercel dev`
  - Crea `.env.local` con: `OPENAI_API_KEY=...`

## Reiniciar app (borrar progreso)

En la consola del navegador:
```js
localStorage.removeItem('nous_state_v1'); sessionStorage.clear(); location.reload();
```

## Estructura

- `index.html`: shell SPA y contenedores de vistas + chat.
- `styles.css`: tema y estilos.
- `script.js`: router, estado, diagnóstico, mapa, ejercicios, perfil, chat.
- `api/chat.js`: función serverless para la IA (Vercel).

## Licencia

MIT
