import { Router } from "express";
import postController from "../controllers/post.c";
import uploadCloud from "../middleware/uploader";
import middlewareController from "../middleware/middleware";

const router = Router();

router.get(
  "/feed",
  middlewareController.verifyToken,
  postController.getFeedPosts
);
router.post(
  "/",
  middlewareController.verifyToken,
  uploadCloud.array("image", 20),
  postController.createPost
);
router.get("/:id", postController.getPostById);

export default router;
