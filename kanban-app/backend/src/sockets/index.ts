import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ?? "http://localhost:5173",
      credentials: true,
    },
  });

  // Middleware de autenticación para sockets: valida el JWT enviado en el handshake
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("No autenticado"));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(`Cliente conectado: ${socket.id} (usuario ${socket.data.user?.email})`);

    // El cliente se une a la "room" del tablero que está viendo
    socket.on("board:join", (boardId: string) => {
      socket.join(boardId);
    });

    socket.on("board:leave", (boardId: string) => {
      socket.leave(boardId);
    });

    // Indicador de "usuario escribiendo" en una tarjeta, para colaboración en vivo
    socket.on("card:typing", ({ boardId, cardId }: { boardId: string; cardId: string }) => {
      socket.to(boardId).emit("card:typing", { cardId, user: socket.data.user });
    });

    socket.on("disconnect", () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io no ha sido inicializado. Llama a initSocket primero.");
  }
  return io;
}
