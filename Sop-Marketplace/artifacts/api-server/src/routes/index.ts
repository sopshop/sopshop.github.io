import { Router, type IRouter } from "express";
import healthRouter from "./health";
import listingsRouter from "./listings";
import sellersRouter from "./sellers";
import usersRouter from "./users";
import ordersRouter from "./orders";
import checkoutRouter from "./checkout";
import mylistingsRouter from "./mylistings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(listingsRouter);
router.use(sellersRouter);
router.use(usersRouter);
router.use(ordersRouter);
router.use(checkoutRouter);
router.use(mylistingsRouter);

export default router;
