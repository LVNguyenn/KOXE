import { Router } from "express";
import postController from "../controllers/post.c";
import middlewareController from "../middleware/middleware";

const router = Router();

router.get(
  "/feed",
  middlewareController.verifyToken,
  postController.getFeedPosts
);
router.post("/", middlewareController.verifyToken, postController.createPost);
router.get("/:id", postController.getPostById);

export default router;
