import { Router } from "express";
import blockedUserController from "../controllers/blockedUser.c";

const router = Router();

router.post("/", blockedUserController.createblockUser);

export default router;
