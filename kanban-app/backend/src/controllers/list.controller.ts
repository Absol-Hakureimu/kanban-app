import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { assertBoardAccess } from "./board.controller";
import { getIO } from "../sockets";

const createListSchema = z.object({
  title: z.string().min(1),
});

const reorderListSchema = z.object({
  position: z.number().int().min(0),
});

export async function createList(req: Request, res: Response, next: NextFunction) {
  try {
    const { boardId } = req.params;
    const { title } = createListSchema.parse(req.body);
    const userId = req.user!.userId;

    await assertBoardAccess(boardId, userId);

    const lastList = await prisma.list.findFirst({
      where: { boardId },
      orderBy: { position: "desc" },
    });

    const list = await prisma.list.create({
      data: { title, boardId, position: (lastList?.position ?? -1) + 1 },
    });

    getIO().to(boardId).emit("list:created", { list });
    return res.status(201).json({ list });
  } catch (error) {
    next(error);
  }
}

export async function updateListPosition(req: Request, res: Response, next: NextFunction) {
  try {
    const { boardId, listId } = req.params;
    const { position } = reorderListSchema.parse(req.body);
    const userId = req.user!.userId;

    await assertBoardAccess(boardId, userId);

    const list = await prisma.list.update({
      where: { id: listId },
      data: { position },
    });

    getIO().to(boardId).emit("list:moved", { listId, position });
    return res.json({ list });
  } catch (error) {
    next(error);
  }
}

export async function deleteList(req: Request, res: Response, next: NextFunction) {
  try {
    const { boardId, listId } = req.params;
    const userId = req.user!.userId;

    await assertBoardAccess(boardId, userId);
    await prisma.list.delete({ where: { id: listId } });

    getIO().to(boardId).emit("list:deleted", { listId });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}
