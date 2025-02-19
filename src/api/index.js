import v1Routes from "./v1.0";
import { routeNotFound } from "#middlewares/index";
import { Router } from "express";
import { getHealth } from "./health";

const router = new Router();

router.get("/health", getHealth);
router.use("/v1", v1Routes);
router.all("*", routeNotFound);

export default router;
