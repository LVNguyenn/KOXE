import { Router } from "express";
import transactionController from "../controllers/transaction.c";
import middlewareController from "../middleware/middleware";

const router = Router();

router.get(
  "/",
  middlewareController.verifyToken,
  transactionController.getAllTransactions
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
router.delete(
  "/:id",
  middlewareController.verifyToken,
  transactionController.deleteTransaction
);

export default router;
