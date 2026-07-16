import { Router, type IRouter } from "express";
import healthRouter from "./health";
import decisionsRouter from "./decisions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(decisionsRouter);

export default router;
