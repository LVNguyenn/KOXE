import { Router } from "express";
import transactionController from "../controllers/transaction.c";
import middlewareController from "../middleware/middleware";

const router = Router();

router.get(
  "/salon",
  middlewareController.verifyToken,
  transactionController.getTransactionBySalonId
);
router.get("/:id", transactionController.getTransactionById);
router.patch(
  "/:id/details",
  middlewareController.verifyToken,
  transactionController.updateTransaction
);
router.patch(
  "/:id/next",
  middlewareController.verifyToken,
  transactionController.nextStage
);
router.patch(
  "/:id/back",
  middlewareController.verifyToken,
  transactionController.backStage
);

export default router;
