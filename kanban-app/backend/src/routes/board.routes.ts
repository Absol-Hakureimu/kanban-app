import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createBoard,
  listBoards,
  getBoard,
  inviteMember,
  deleteBoard,
} from "../controllers/board.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createBoard);
router.get("/", listBoards);
router.get("/:boardId", getBoard);
router.post("/:boardId/members", inviteMember);
router.delete("/:boardId", deleteBoard);

export default router;
