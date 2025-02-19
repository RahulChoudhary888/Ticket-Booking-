import { controller as api } from "./controller";
import { schema } from "./schema";
import { validateSchema, methodNotAllowed } from "#middlewares/index";

const express = require("express");
const { Router } = express;
const router = new Router();

router.route("/tickets/book").post(validateSchema(schema.bookTicket), api.bookTicket).all(methodNotAllowed);
router.route("/tickets/cancel/:ticketId").post(validateSchema(schema.cancelTicket), api.cancelTicket).all(methodNotAllowed);
router.route("/tickets/booked/:ticketId").get(validateSchema(schema.getBookedTicket),api.getBookedTicket).all(methodNotAllowed);
router.route("/tickets/available/:trainNumber").get(validateSchema(schema.getAvailableTickets), api.getAvailableTickets).all(methodNotAllowed);

module.exports = router;
