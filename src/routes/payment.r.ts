import { Router } from 'express';
import userController from '../controllers/payment.c';
import middlewareController from '../middleware/middleware';

const router = Router();

// router.post("/createOrder", userController.createOrder);
// router.post("/queryOrder", userController.queryOrder);

// vnp
router.post("/create_payment_url", middlewareController.verifyToken, userController.createPaymentUrl);
router.get("/vnpay_ipn", userController.vnpayIPN);
router.get("/vnpay_return", userController.vnpayReturn);

export default router;
