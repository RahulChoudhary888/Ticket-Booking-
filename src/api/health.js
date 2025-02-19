/**
 * GET /health
 */
export const getHealth = (req, res, next) => {
	try {
		res.jsend.success({
			name: "Ticket Booking",
			version: "1.0.0",
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		next(error);
	}
};
