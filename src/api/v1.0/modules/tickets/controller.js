import { catchAsync } from "#utils/index";
import { ticket } from "./tickets";

export const controller = {
	bookTicket: catchAsync(async (req, res) => {
		const response = await ticket.bookTicket(req.body);
		res.jsend.success(response,"Ticket booked successfully");
	}),
	cancelTicket: catchAsync(async (req, res) => {
		const response = await ticket.cancelTicket(req.params.ticketId);
		res.jsend.success(response,"Ticket cancelled successfully");
	}),
	getBookedTicket: catchAsync(async (req, res) => {
		const response = await ticket.getBookedTicket(req.params);
		res.jsend.success(response,"Ticket fetched successfully");
	}),
	getAvailableTickets: catchAsync(async (req, res) => {
		const response = await ticket.getAvailableTickets(req.params);
		res.jsend.success(response,"Tickets fetched successfully");
	})
};
