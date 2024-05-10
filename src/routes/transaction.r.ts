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
  "/details/:id",
  middlewareController.verifyToken,
  transactionController.updateTransaction
);
router.patch(
  "/next/:id",
  middlewareController.verifyToken,
  transactionController.nextStage
);

export default router;
