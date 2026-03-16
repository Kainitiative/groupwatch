import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import groupsRouter from "./groups";
import membersRouter from "./members";
import incidentTypesRouter from "./incident-types";
import reportsRouter from "./reports";
import pushRouter from "./push";
import billingRouter from "./billing";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(groupsRouter);
router.use(membersRouter);
router.use(incidentTypesRouter);
router.use(reportsRouter);
router.use(pushRouter);
router.use(billingRouter);
router.use(adminRouter);

export default router;
