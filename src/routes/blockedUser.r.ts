import { Router } from "express";
import middlewareController from "../middleware/middleware";
import blockedUserController from "../controllers/blockedUser.c";

const router = Router();

router.post(
  "/",
  middlewareController.verifyToken,
  blockedUserController.blockUnblockUser
);

export default router;
