import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createCard,
  updateCard,
  moveCard,
  deleteCard,
  assignUser,
} from "../controllers/card.controller";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post("/lists/:listId/cards", createCard);
router.patch("/cards/:cardId", updateCard);
router.patch("/cards/:cardId/move", moveCard);
router.delete("/cards/:cardId", deleteCard);
router.post("/cards/:cardId/assignees", assignUser);

export default router;
