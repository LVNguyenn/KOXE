import { Router } from 'express';
import notificationController from '../controllers/notification.c';
import middleware from '../middleware/middleware';

const router = Router();

// admin salon
router.post("/get-notification-admin", middleware.verifyToken, middleware.havePermission("R_NTF"), notificationController.get);
router.patch("/read-notification-admin", middleware.verifyToken, middleware.havePermission("U_NTF"), notificationController.update)
router.delete("/delete-notification-admin",middleware.verifyToken, middleware.havePermission("D_NTF"), notificationController.delete);

// user
router.post("/get-notification-user", middleware.verifyToken2, notificationController.get);
router.patch("/read-notification-user", middleware.verifyToken2, notificationController.update)
router.delete("/delete-notification-user", middleware.verifyToken2, notificationController.delete);

export default router;
