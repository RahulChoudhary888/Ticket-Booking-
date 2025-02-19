import { mysqlQuery, logger, mysqlSequencedTransaction, mysqlTransaction } from "#helpers/index";
import { StatusCodes } from "http-status-codes";
import { TicketBookingApiError } from "./error";
import { BERTH_TYPE, BERTH_TYPE_ID, ERROR_CODES, TICKET_STATUS, TICKET_STATUS_ID } from "#constants/index";
import { v4 as uuidv4 } from "uuid";
// import { ROLE_ID } from "#constants/roles.constant";
// import { USER_STATUS } from "#constants/user.constants";

/* eslint-disable no-unused-vars */

class Ticket {
	async bookTicket(body) {
		try {
			const getCoreTrainQuery = `SELECT * FROM core_train WHERE train_number = ?`;
			const getCoreTrainResult = await mysqlQuery(getCoreTrainQuery, [body.train_number]);
	
			if (getCoreTrainResult.length === 0) {
				throw new TicketBookingApiError("Train not found", StatusCodes.NOT_FOUND, ERROR_CODES.NOT_FOUND);
			}
	
			const getTicketCountByStatusQuery = `
				SELECT code, COUNT(*) as count 
				FROM data_tickets 
				INNER JOIN core_ticket_status ON core_ticket_status.id = data_tickets.status_id
				INNER JOIN core_train ON core_train.id = data_tickets.train_id
				WHERE core_train.train_number = ? AND (data_tickets.seat_number IS NOT NULL OR data_tickets.status_id = ?)
				GROUP BY status_id`;
			const getTicketCountByBerthTypeQuery = `SELECT 
													dt.berth_id, 
													COUNT(*) as count 
												FROM 
													data_tickets dt
												INNER JOIN 
													core_train ct ON ct.id = dt.train_id
												WHERE 
													ct.train_number = ?
													AND dt.seat_number IS NOT NULL
												GROUP BY 
													dt.berth_id`;
			const [getTicketCountByStatusResult, getTicketCountByBerthTypeResult] = await mysqlTransaction([getTicketCountByStatusQuery, getTicketCountByBerthTypeQuery], [[body.train_number, TICKET_STATUS_ID.WAITING_LIST], [body.train_number]]);
			logger.info(getTicketCountByStatusResult);
			logger.info(getTicketCountByBerthTypeResult);
	
			const confirmedCount = getTicketCountByStatusResult.find(status => status.code === TICKET_STATUS.CONFIRMED)?.count || 0;
			const racCount = getTicketCountByStatusResult.find(status => status.code === TICKET_STATUS.RAC_CONFIRMED)?.count || 0;
			const waitingListCount = getTicketCountByStatusResult.find(status => status.code === TICKET_STATUS.WAITING_LIST)?.count || 0;

			if (waitingListCount >= 10) {
				throw new TicketBookingApiError("No tickets available", StatusCodes.BAD_REQUEST, ERROR_CODES.NO_TICKETS);
			}

			const getCoreTicketCount = `SELECT * FROM core_tickets`;
			const getCoreTicketCountResult = await mysqlQuery(getCoreTicketCount, [getCoreTrainResult[0].id]);

			const ticketCounts = getCoreTicketCountResult.reduce((acc, ticket) => {
				acc[ticket.name] = (acc[ticket.name] || 0) + ticket.value;
				return acc;
			}, {});

			let availableConfirmedBerths = ticketCounts['confirmed_ticket'] - confirmedCount;
			let availableRacBerths = 2 * ticketCounts['rac_ticket']  - racCount;
			let availableWaitingList = ticketCounts['waiting_list_ticket'] - waitingListCount;
			const queries = [];
			const values = [];
	
			for (let passenger of body.passengers) {
				let status_id, berth_type_id, insertTicketQuery;
				const passenger_id = uuidv4();
				const ticket_id = uuidv4();

				const insertPassengerQuery = `INSERT INTO data_passengers (id, email, first_name, last_name, age, gender) VALUES (?, ?, ?, ?, ?, ?)`;
				queries.push(insertPassengerQuery);
				values.push([passenger_id, body.email, passenger.first_name, passenger.last_name, passenger.age, passenger.gender]);
				if (passenger.age < 5) {
					if(!body.passengers.filter(p => p.age > 5).length > 0) {
						throw new TicketBookingApiError("At least one passenger should be above 5 years", StatusCodes.BAD_REQUEST, ERROR_CODES.INVALID);
					}
					else {
						status_id = TICKET_STATUS_ID.CONFIRMED;
						insertTicketQuery = `INSERT INTO data_tickets (id, passenger_id, train_id, status_id)
											VALUES (?, ?, ?, ?)`; 
					queries.push(insertTicketQuery);
					values.push([ticket_id, passenger_id, getCoreTrainResult[0].id ,status_id]);
					}
				}
				else if (availableConfirmedBerths > 0) {
					if (passenger.age >= 60 && getCoreTicketCountResult.find(ticket => ticket.berth_code === BERTH_TYPE.LOWER).value > getTicketCountByBerthTypeResult.find(berth => berth.berth_id === BERTH_TYPE_ID.LOWER)?.count) {
						berth_type_id = BERTH_TYPE_ID.LOWER;
					}
					else if( passenger.gender === "female" && getCoreTicketCountResult.find(ticket => ticket.berth_code === BERTH_TYPE.LOWER).value > getTicketCountByBerthTypeResult.find(berth => berth.berth_id === BERTH_TYPE_ID.LOWER)?.count) {
						berth_type_id = BERTH_TYPE_ID.LOWER;
					}
					status_id = TICKET_STATUS_ID.CONFIRMED;
					availableConfirmedBerths--;
					insertTicketQuery = `INSERT INTO data_tickets (id, passenger_id, train_id, status_id, seat_number, berth_id)
											SELECT 
												?, 
												?, 
												?, 
												?,
												sa.seat_number,
												sa.berth_type_id 
											FROM core_seat_assignments sa
											WHERE ${berth_type_id ? `sa.berth_type_id = ${berth_type_id} AND ` : ""} 
											sa.seat_number NOT IN (SELECT seat_number FROM data_tickets WHERE train_id = ? AND seat_number IS NOT NULL)
											LIMIT 1;
											`;
					queries.push(insertTicketQuery);
					console.log(berth_type_id);
					values.push([ticket_id, passenger_id, getCoreTrainResult[0].id ,status_id, getCoreTrainResult[0].id]);
				} else if (availableRacBerths > 0) {
					status_id = TICKET_STATUS_ID.RAC_CONFIRMED;
					availableRacBerths--;
					berth_type_id = BERTH_TYPE_ID.SIDE_LOWER;
					insertTicketQuery = `INSERT INTO data_tickets (id, passenger_id, train_id, status_id, seat_number, berth_id)
											SELECT 
												?, 
												?, 
												?, 
												?,
												sa.seat_number,
												sa.berth_type_id 
											FROM core_seat_assignments sa
											WHERE sa.berth_type_id = ? AND
											NOT EXISTS (
											SELECT 1 
											FROM data_tickets dt
											WHERE dt.train_id = ? 
											AND dt.seat_number = sa.seat_number
											GROUP BY dt.seat_number 
											HAVING COUNT(dt.seat_number) >= 2
										) LIMIT 1`;
											queries.push(insertTicketQuery);
					values.push([ticket_id, passenger_id, getCoreTrainResult[0].id ,status_id, berth_type_id, getCoreTrainResult[0].id]);
				} else if (availableWaitingList > 0) {
					status_id = TICKET_STATUS_ID.WAITING_LIST;
					availableWaitingList--;
					insertTicketQuery = `INSERT INTO data_tickets (id, passenger_id, train_id, status_id, seat_number, berth_id)
											VALUES (?, ?, ?, ?, NULL, NULL)`; // No seat number for waiting list
					queries.push(insertTicketQuery);
					values.push([ticket_id, passenger_id, getCoreTrainResult[0].id ,status_id]);
				}
				else {
					throw new TicketBookingApiError("No tickets available", StatusCodes.BAD_REQUEST, ERROR_CODES.NO_TICKETS);
				}
				passenger.ticket_id = ticket_id;
			}
			const response = await mysqlSequencedTransaction(queries, values);
			logger.info(response);
			return { passenger: body.passengers };
		} catch (error) {
			logger.error('Error booking ticket:', error);
			throw error;
		}
	}

	async cancelTicket(ticketId) {
		try {
			const getTicketQuery = `SELECT * FROM data_tickets WHERE id = ?`;
			const getTicketResult = await mysqlQuery(getTicketQuery, [ticketId]);

			if (getTicketResult.length === 0) {
				throw new TicketBookingApiError("Ticket not found", StatusCodes.NOT_FOUND, ERROR_CODES.NOT_FOUND);
			}
			const getFirstRacTicketQuery = `SELECT * FROM data_tickets WHERE train_id = ? AND status_id = ? ORDER BY created_at ASC LIMIT 1`;
			const getFirstWaitListTicketQuery = `SELECT * FROM data_tickets WHERE train_id = ? AND status_id = ? ORDER BY created_at ASC LIMIT 1`;
			const [getFirstRacTicketResult, getFirstWaitListTicketResult] = await mysqlTransaction([getFirstRacTicketQuery, getFirstWaitListTicketQuery], [[getTicketResult[0].train_id, TICKET_STATUS_ID.RAC_CONFIRMED], [getTicketResult[0].train_id, TICKET_STATUS_ID.WAITING_LIST]]);
			const updateWaitListQuery = `UPDATE data_tickets dt
				JOIN (
					SELECT seat_number, berth_id
					FROM data_tickets
					WHERE status_id = ? AND train_id = ?
					ORDER BY created_at ASC
					LIMIT 1
				) AS subquery
				ON true
				SET 
					dt.status_id = ?, 
					dt.seat_number = subquery.seat_number, 
					dt.berth_id = subquery.berth_id
				WHERE id = ?`;
			const updateRacTicketQuery = `UPDATE data_tickets dt
				JOIN (
					SELECT seat_number, berth_id
					FROM data_tickets
					WHERE id = ?
				) AS subquery
				ON true
				SET 
					dt.status_id = ?, 
					dt.seat_number = subquery.seat_number, 
					dt.berth_id = subquery.berth_id
				WHERE id = ?`;
			const cancelTicketQuery = `UPDATE data_tickets SET status_id = ? WHERE id = ?`;
			const queries = [];
			const values = [];
			if(getTicketResult[0].status_id === TICKET_STATUS_ID.WAITING_LIST) {
				queries.push(cancelTicketQuery);
				values.push([TICKET_STATUS_ID.CANCELLED, ticketId]);
			}else if(getTicketResult[0].status_id === TICKET_STATUS_ID.RAC_CONFIRMED) {
				if(getFirstWaitListTicketResult.length !== 0) {
					queries.push(updateWaitListQuery);
					values.push([TICKET_STATUS_ID.RAC_CONFIRMED, getTicketResult[0].train_id, TICKET_STATUS_ID.RAC_CONFIRMED, getFirstWaitListTicketResult[0].id]);
				}
				queries.push(cancelTicketQuery);
				values.push([TICKET_STATUS_ID.CANCELLED, ticketId]);
			}
			else if(getTicketResult[0].status_id === TICKET_STATUS_ID.CONFIRMED){
				if(getFirstWaitListTicketResult.length !== 0) {
					queries.push(updateWaitListQuery);
					values.push([TICKET_STATUS_ID.CONFIRMED, getTicketResult[0].train_id, TICKET_STATUS_ID.CONFIRMED, getFirstWaitListTicketResult[0].id]);
				}
				if(getFirstRacTicketResult.length !== 0) {
					queries.push(updateRacTicketQuery);
					values.push([ticketId, TICKET_STATUS_ID.CONFIRMED, getFirstRacTicketResult[0].id]);
				}
				queries.push(cancelTicketQuery);
				values.push([TICKET_STATUS_ID.CANCELLED, ticketId]);
			}
			else if(getTicketResult[0].status_id === TICKET_STATUS_ID.CANCELLED){
				throw new TicketBookingApiError("Ticket already cancelled", StatusCodes.BAD_REQUEST, ERROR_CODES.INVALID);	
			}
			const response = await mysqlSequencedTransaction(queries, values);
		} catch (error) {
			logger.error('Error cancelling ticket:', error);
			throw error;
		}
	}

	async getBookedTicket(params) {
		try {
			const getTicketQuery = `SELECT 
										dt.id as ticket_id, 
										dt.seat_number, 
										cb.code as berth_code,
										cts.code as status_code,
										ct.train_number, 
										dp.id as passenger_id, 
										dp.email, 
										dp.first_name, 
										dp.last_name, 
										dp.age, 
										dp.gender
										FROM data_tickets dt
										LEFT JOIN data_passengers dp ON dp.id = dt.passenger_id
										LEFT JOIN core_train ct ON ct.id = dt.train_id
										LEFT JOIN core_ticket_status cts ON cts.id = dt.status_id
										LEFT JOIN core_berths cb ON cb.id = dt.berth_id
										WHERE dt.id = ?`;
			const getTicketResult = await mysqlQuery(getTicketQuery, [params.ticketId]);
			if (getTicketResult.length === 0) {
				throw new TicketBookingApiError("Ticket not found", StatusCodes.NOT_FOUND, ERROR_CODES.NOT_FOUND);
			}
			return getTicketResult[0];
		}
		catch (error) {
			logger.error('Error fetching ticket:', error);
			throw error;
		}
	}

	async getAvailableTickets(params) {
		try {
			const getCoreTrainQuery = `SELECT * FROM core_train WHERE train_number = ?`;
			const getCoreTrainResult = await mysqlQuery(getCoreTrainQuery, [params.trainNumber]);
			if (getCoreTrainResult.length === 0) {
				throw new TicketBookingApiError("Train not found", StatusCodes.NOT_FOUND, ERROR_CODES.NOT_FOUND);
			}
			const getTicketCountByStatusQuery = `
				SELECT code, COUNT(*) as count 
				FROM data_tickets 
				INNER JOIN core_ticket_status ON core_ticket_status.id = data_tickets.status_id
				INNER JOIN core_train ON core_train.id = data_tickets.train_id
				WHERE core_train.train_number = ? AND (data_tickets.seat_number IS NOT NULL OR data_tickets.status_id = ?)
				GROUP BY status_id`;
			const getTicketCountByStatusResult = await mysqlQuery(getTicketCountByStatusQuery, [params.trainNumber, TICKET_STATUS_ID.WAITING_LIST]);
	
			const confirmedCount = getTicketCountByStatusResult.find(status => status.code === TICKET_STATUS.CONFIRMED)?.count || 0;
			const racCount = getTicketCountByStatusResult.find(status => status.code === TICKET_STATUS.RAC_CONFIRMED)?.count || 0;
			const waitingListCount = getTicketCountByStatusResult.find(status => status.code === TICKET_STATUS.WAITING_LIST)?.count || 0;
			logger.info(waitingListCount)
			if (waitingListCount >= 10) {
				throw new TicketBookingApiError("No tickets available", StatusCodes.BAD_REQUEST, ERROR_CODES.NO_TICKETS);
			}

			const getCoreTicketCount = `SELECT * FROM core_tickets`;
			const getCoreTicketCountResult = await mysqlQuery(getCoreTicketCount, [getCoreTrainResult[0].id]);

			const ticketCounts = getCoreTicketCountResult.reduce((acc, ticket) => {
				acc[ticket.name] = (acc[ticket.name] || 0) + ticket.value;
				return acc;
			}, {});

			let availableConfirmedBerths = ticketCounts['confirmed_ticket'] - confirmedCount;
			let availableRacBerths = 2 * ticketCounts['rac_ticket']  - racCount;
			let availableWaitingList = ticketCounts['waiting_list_ticket'] - waitingListCount;

			return {
				availableConfirmedBerths,
				availableRacBerths,
				availableWaitingList
			}
		}
		catch (error) {
			logger.error('Error fetching available tickets:', error);
			throw error;
		}
	}
	
}

export const ticket = new Ticket();
