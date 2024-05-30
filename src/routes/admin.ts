import { Router } from 'express';
import adminController from '../controllers/admin.c';
import middleware from '../middleware/middleware';

const router = Router();

router.post("/update-permission", middleware.verifyToken, middleware.isAdminTeam, adminController.updatePermission);
router.post("/", middleware.verifyToken, middleware.havePermission("Z-PERMISSION-101"), adminController.getPermission);

// get logs
router.post("/logs", middleware.verifyToken, middleware.havePermission("Z-PERMISSION-101"), adminController.getLogs);

router.get("/users", middleware.verifyToken, middleware.havePermission("Z-PERMISSION-101"), adminController.getUsers);
router.post("/create-user", middleware.verifyToken, middleware.havePermission("Z-PERMISSION-101"), adminController.createUser);
router.delete("/user/:userId", middleware.verifyToken, middleware.havePermission("Z-PERMISSION-101"), adminController.deleteUser);

export default router;
