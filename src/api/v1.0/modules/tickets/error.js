class TicketBookingApiError extends Error {
	constructor(message, httpStatus, errorCode) {
		super(message);
		this.name = "TicketBookingApiError";
		this.status = httpStatus;
		this.errorCode = errorCode;
	}
}

export { TicketBookingApiError };
