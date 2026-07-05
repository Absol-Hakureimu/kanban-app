import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { assertBoardAccess } from "./board.controller";
import { getIO } from "../sockets";
import { AppError } from "../middleware/errorHandler";

const createCardSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

const updateCardSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

// Mover una tarjeta a otra lista y/o posición (drag & drop entre columnas)
const moveCardSchema = z.object({
  listId: z.string().uuid(),
  position: z.number().int().min(0),
});

async function getBoardIdForCard(cardId: string): Promise<string> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { list: true },
  });
  if (!card) throw new AppError("Tarjeta no encontrada", 404);
  return card.list.boardId;
}

export async function createCard(req: Request, res: Response, next: NextFunction) {
  try {
    const { boardId, listId } = req.params;
    const { title, description, dueDate } = createCardSchema.parse(req.body);
    const userId = req.user!.userId;

    await assertBoardAccess(boardId, userId);

    const lastCard = await prisma.card.findFirst({
      where: { listId },
      orderBy: { position: "desc" },
    });

    const card = await prisma.card.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        listId,
        creatorId: userId,
        position: (lastCard?.position ?? -1) + 1,
      },
    });

    getIO().to(boardId).emit("card:created", { card });
    return res.status(201).json({ card });
  } catch (error) {
    next(error);
  }
}

export async function updateCard(req: Request, res: Response, next: NextFunction) {
  try {
    const { boardId, cardId } = req.params;
    const data = updateCardSchema.parse(req.body);
    const userId = req.user!.userId;

    await assertBoardAccess(boardId, userId);

    const card = await prisma.card.update({
      where: { id: cardId },
      data: {
        ...data,
        dueDate: data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null,
      },
    });

    getIO().to(boardId).emit("card:updated", { card });
    return res.json({ card });
  } catch (error) {
    next(error);
  }
}

export async function moveCard(req: Request, res: Response, next: NextFunction) {
  try {
    const { boardId, cardId } = req.params;
    const { listId, position } = moveCardSchema.parse(req.body);
    const userId = req.user!.userId;

    await assertBoardAccess(boardId, userId);

    const card = await prisma.card.update({
      where: { id: cardId },
      data: { listId, position },
    });

    // Notifica a todos los clientes conectados al tablero (excepto quien movió, vía broadcast)
    getIO().to(boardId).emit("card:moved", { cardId, listId, position });
    return res.json({ card });
  } catch (error) {
    next(error);
  }
}

export async function deleteCard(req: Request, res: Response, next: NextFunction) {
  try {
    const { boardId, cardId } = req.params;
    const userId = req.user!.userId;

    await assertBoardAccess(boardId, userId);
    await prisma.card.delete({ where: { id: cardId } });

    getIO().to(boardId).emit("card:deleted", { cardId });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function assignUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { boardId, cardId } = req.params;
    const { userId: assigneeId } = z.object({ userId: z.string().uuid() }).parse(req.body);
    const userId = req.user!.userId;

    await assertBoardAccess(boardId, userId);

    const assignment = await prisma.cardAssignee.create({
      data: { cardId, userId: assigneeId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    getIO().to(boardId).emit("card:assigned", { cardId, assignment });
    return res.status(201).json({ assignment });
  } catch (error) {
    next(error);
  }
}

export { getBoardIdForCard };
