import { Router } from "express";
import stageController from "../controllers/stage.c";
import middlewareController from "../middleware/middleware";

const router = Router();

router.get("/:id", stageController.getStageById);
router.get("/procedure/:procedureId", stageController.getStageByProcedureId);
router.post("/", middlewareController.verifyToken, stageController.createStage);
router.patch(
  "/:id",
  middlewareController.verifyToken,
  stageController.updateStage
);
router.delete(
  "/:id",
  middlewareController.verifyToken,
  stageController.deleteStage
);

export default router;
