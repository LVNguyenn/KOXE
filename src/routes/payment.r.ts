import { Router } from 'express';
import userController from '../controllers/payment.c';

const router = Router();

// router.post("/createOrder", userController.createOrder);
// router.post("/queryOrder", userController.queryOrder);

router.post("/create_payment_url", userController.createPaymentUrl);
router.get("/vnpay_ipn", userController.vnpayIPN);
router.get("/vnpay_return", userController.vnpayReturn);

export default router;
