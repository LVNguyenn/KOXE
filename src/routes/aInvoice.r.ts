import { Router } from "express";
import aInvoiceController from "../controllers/accessoryInvoice";
import middlewareController from "../middleware/middleware";

const router = Router();

router.get(
  "/",
  middlewareController.verifyToken,
  aInvoiceController.getAllAccessoryInvoices
);
router.get(
  "/:id",
  middlewareController.verifyToken,
  aInvoiceController.getAccessoryInvoiceById
);
router.post(
  "/",
  middlewareController.verifyToken,
  aInvoiceController.createAccessoryInvoices
);
router.patch(
  "/:id",
  middlewareController.verifyToken,
  aInvoiceController.updateAccessoryInvoices
);
router.delete(
  "/:id",
  middlewareController.verifyToken,
  aInvoiceController.deleteAccessoryInvoices
);

export default router;
