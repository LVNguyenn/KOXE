import { Router } from "express";
import groupController from "../controllers/groupSalon.c";
import middlewareController from "../middleware/middleware";

const router = Router();

router.get(
  "/",
  middlewareController.verifyToken,
  groupController.getAllGroupSalons
);
router.get(
  "/:id",
  middlewareController.verifyToken,
  groupController.getGroupSalonById
);
router.post(
  "/",
  middlewareController.verifyToken,
  groupController.createGroupSalon
);
router.patch(
  "/:id",
  middlewareController.verifyToken,
  groupController.updateGroupSalon
);
router.delete(
  "/:id",
  middlewareController.verifyToken,
  groupController.deleteGroupSalon
);

export default router;
