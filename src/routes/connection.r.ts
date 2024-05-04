import { Router } from "express";
import connectionController from "../controllers/connection.c";
import middlewareController from "../middleware/middleware";

const router = Router();

router.get(
  "/",
  middlewareController.verifyToken,
  connectionController.getAllConnections
);
router.get(
  "/:id",
  middlewareController.verifyToken,
  connectionController.getConnectionById
);
router.post(
  "/",
  middlewareController.verifyToken,
  connectionController.createConnection
);
router.patch(
  "/:id",
  middlewareController.verifyToken,
  connectionController.updateConnection
);

export default router;
