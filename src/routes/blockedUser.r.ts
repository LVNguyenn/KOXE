import { Router } from "express";
import middlewareController from "../middleware/middleware";
import blockedUserController from "../controllers/blockedUser.c";

const router = Router();

router.post(
  "/",
  middlewareController.verifyToken,
  blockedUserController.blockUser
);
router.post(
  "/un",
  middlewareController.verifyToken,
  blockedUserController.unblockUser
);

export default router;
