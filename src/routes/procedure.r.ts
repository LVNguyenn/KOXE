import { Router } from "express";
import procedureController from "../controllers/procedure.c";
import middlewareController from "../middleware/middleware";

const router = Router();

router.get(
  "/",
  middlewareController.verifyToken,
  procedureController.getAllProcedures
);
router.get("/:id", procedureController.getProcedureById);
router.post(
  "/",
  middlewareController.verifyToken,
  procedureController.createProcedure
);
router.patch("/:id", procedureController.updateProcedure);
router.delete("/:id", procedureController.deleteProcedure);

export default router;
