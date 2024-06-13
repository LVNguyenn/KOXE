import { Router } from "express";
import messageController from "../controllers/message.c";
import middlewareController from "../middleware/middleware";
import uploadCloud from "../middleware/uploader";

const router = Router();

router.get(
  "/chatting-users",
  middlewareController.verifyToken,
  messageController.getChattingUsers
);
router.get(
  "/search",
  middlewareController.verifyToken,
  messageController.searchChattingUsers
);
router.get(
  "/:id",
  middlewareController.verifyToken,
  messageController.getMessages
);
router.post(
  "/send/:id",
  middlewareController.verifyToken,
  uploadCloud.array("imgList", 10),
  messageController.sendMessage
);

export default router;
