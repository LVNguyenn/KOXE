import { Router } from "express";
import groupController from "../controllers/groupSalon.c";
import middlewareController from "../middleware/middleware";

const router = Router();

router.get(
  "/",
  middlewareController.verifyToken,
  groupController.getAllGroupSalons
);
router.post(
  "/",
  middlewareController.verifyToken,
  groupController.createGroupSalon
);

export default router;
