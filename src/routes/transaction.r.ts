import { Router } from "express";
import transactionController from "../controllers/transaction.c";
import middlewareController from "../middleware/middleware";

const router = Router();

router.get(
  "/",
  middlewareController.verifyToken,
  transactionController.getAllTransactions
);
router.get("/:id", transactionController.getTransactionByConnectionId);
router.post(
  "/",
  middlewareController.verifyToken,
  transactionController.createTransaction
);
router.patch(
  "/details",
  middlewareController.verifyToken,
  transactionController.updateTransaction
);

export default router;
