import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";

const createBoardSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "VIEWER"]).default("EDITOR"),
});

// Verifica que el usuario tenga acceso al tablero (dueño o miembro)
async function assertBoardAccess(boardId: string, userId: string) {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
  });

  if (!board) {
    throw new AppError("Tablero no encontrado o sin acceso", 404);
  }

  return board;
}

export async function createBoard(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description } = createBoardSchema.parse(req.body);
    const userId = req.user!.userId;

    const board = await prisma.board.create({
      data: {
        title,
        description,
        ownerId: userId,
        lists: {
          create: [
            { title: "Por hacer", position: 0 },
            { title: "En progreso", position: 1 },
            { title: "Hecho", position: 2 },
          ],
        },
      },
      include: { lists: { orderBy: { position: "asc" } } },
    });

    return res.status(201).json({ board });
  } catch (error) {
    next(error);
  }
}

export async function listBoards(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const boards = await prisma.board.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      orderBy: { updatedAt: "desc" },
    });

    return res.json({ boards });
  } catch (error) {
    next(error);
  }
}

export async function getBoard(req: Request, res: Response, next: NextFunction) {
  try {
    const { boardId } = req.params;
    const userId = req.user!.userId;

    await assertBoardAccess(boardId, userId);

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        lists: {
          orderBy: { position: "asc" },
          include: {
            cards: {
              orderBy: { position: "asc" },
              include: {
                assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
              },
            },
          },
        },
        members: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
      },
    });

    return res.json({ board });
  } catch (error) {
    next(error);
  }
}

export async function inviteMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { boardId } = req.params;
    const { email, role } = inviteMemberSchema.parse(req.body);
    const userId = req.user!.userId;

    const board = await assertBoardAccess(boardId, userId);
    if (board.ownerId !== userId) {
      throw new AppError("Solo el dueño del tablero puede invitar miembros", 403);
    }

    const invitedUser = await prisma.user.findUnique({ where: { email } });
    if (!invitedUser) {
      throw new AppError("No existe un usuario con ese correo", 404);
    }

    const member = await prisma.boardMember.upsert({
      where: { boardId_userId: { boardId, userId: invitedUser.id } },
      update: { role },
      create: { boardId, userId: invitedUser.id, role },
    });

    return res.status(201).json({ member });
  } catch (error) {
    next(error);
  }
}

export async function deleteBoard(req: Request, res: Response, next: NextFunction) {
  try {
    const { boardId } = req.params;
    const userId = req.user!.userId;

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board || board.ownerId !== userId) {
      throw new AppError("No tienes permiso para eliminar este tablero", 403);
    }

    await prisma.board.delete({ where: { id: boardId } });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export { assertBoardAccess };
