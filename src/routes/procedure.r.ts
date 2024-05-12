import { Router } from "express";
import processController from "../controllers/procedure.c";
import middlewareController from "../middleware/middleware";

const router = Router();

router.get(
  "/",
  middlewareController.verifyToken,
  processController.getAllProcesses
);
router.get("/:id", processController.getProcessById);
router.post(
  "/",
  middlewareController.verifyToken,
  processController.createProcess
);
router.patch("/:id", processController.updateProcess);
router.delete("/:id", processController.deleteProcess);

export default router;
