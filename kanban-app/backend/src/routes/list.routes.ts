import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createList, updateListPosition, deleteList } from "../controllers/list.controller";

// mergeParams permite acceder a :boardId desde el router padre
const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post("/", createList);
router.patch("/:listId/position", updateListPosition);
router.delete("/:listId", deleteList);

export default router;
