# Kanban Colaborativo en Tiempo Real

Aplicación full-stack de gestión de tareas estilo Trello, con **sincronización en tiempo real vía WebSockets**, autenticación con JWT, y arquitectura desacoplada frontend/backend.

![status](https://img.shields.io/badge/status-en%20desarrollo-yellow)
![license](https://img.shields.io/badge/license-MIT-blue)

## Características

-  **Autenticación completa**: registro, login, refresh tokens (access token en memoria + refresh token en cookie httpOnly).
-  **Tableros, listas y tarjetas** con relaciones y permisos (dueño, editor, visor).
-  **Tiempo real** con Socket.io: cualquier cambio (crear, mover, eliminar tarjetas/listas) se refleja al instante en todos los clientes conectados al mismo tablero.
-  **Drag & drop** fluido entre columnas, con actualización optimista en el cliente.
-  **Colaboración multiusuario**: invita miembros a un tablero por correo electrónico.
-  **Validación de datos** end-to-end con Zod (mismo esquema mental en frontend y backend).

## Arquitectura

```
kanban-app/
├── backend/          # API REST + Socket.io (Node, Express, TypeScript, Prisma)
│   ├── prisma/        # Esquema de base de datos (PostgreSQL)
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       ├── sockets/    # Lógica de tiempo real
│       └── utils/
└── frontend/         # SPA (React, TypeScript, Vite, Tailwind)
    └── src/
        ├── pages/
        ├── components/
        ├── store/       # Estado global con Zustand
        ├── hooks/       # Hook de sincronización con Socket.io
        └── api/         # Cliente HTTP (axios + React Query)
```

##  Stack tecnológico

| Capa | Tecnologías |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, dnd-kit, Socket.io Client |
| Backend | Node.js, Express, TypeScript, Prisma, PostgreSQL, Socket.io, JWT, Zod |
| Infraestructura | Docker-ready, listo para desplegar en Vercel (frontend) + Railway/Render (backend + DB) |

## Cómo correrlo localmente

### Requisitos previos
- Node.js 18+
- PostgreSQL corriendo localmente (o una instancia en la nube)

### 1. Backend

```bash
cd backend
cp .env.example .env      # edita DATABASE_URL y los secretos JWT
npm install
npx prisma migrate dev --name init
npm run dev                # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

Abre `http://localhost:5173`, crea una cuenta y empieza a crear tableros. Abre la misma URL en dos pestañas o navegadores distintos para ver la sincronización en tiempo real en acción.

##  Decisiones de diseño

- **Access token en memoria, refresh token en cookie httpOnly**: reduce el riesgo de robo de tokens vía XSS, manteniendo una buena experiencia de usuario (renovación automática y transparente).
- **Actualización optimista en el drag & drop**: el cambio se refleja instantáneamente en la UI antes de confirmar con el servidor, y se revierte solo si la petición falla.
- **Socket.io con "rooms" por tablero**: cada tablero es una sala independiente, así los eventos solo llegan a los usuarios que realmente lo están viendo.
- **Prisma como ORM**: tipado end-to-end entre el esquema de base de datos y el código TypeScript.

##  Posibles mejoras futuras

- [ ] Tests de integración (Vitest + Supertest) para los endpoints críticos
- [ ] Notificaciones push cuando te asignan una tarjeta
- [ ] Comentarios y actividad/historial por tarjeta
- [ ] Modo oscuro
- [ ] Exportar tablero a PDF/CSV

##  Licencia

MIT
