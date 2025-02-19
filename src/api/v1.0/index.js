import { Router } from "express";
import ticketRouter from "./modules/tickets/routes";

const router = new Router();

router.get("/", (req, res) => {
	res.jsend.success("Hello v1.0 API");
});
router.use(ticketRouter);


export default router;
