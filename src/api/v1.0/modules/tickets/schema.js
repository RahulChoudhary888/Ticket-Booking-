import Joi from "joi";

export const schema = {
  bookTicket: {
    body: Joi.object({
      email: Joi.string().email().required(),
      number_of_tickets: Joi.number().integer().min(1).required(),
      train_number: Joi.string().required(),
      passengers: Joi.array().items(
                    Joi.object({
                      first_name: Joi.string().required(),
                      last_name: Joi.string().required(),
                      age: Joi.number().integer().min(1).max(150).required(),
                      gender: Joi.string().valid("male", "female", "other").required(),
                    })
      ).required()
    }),
  },
  cancelTicket: {
    params: Joi.object({
      ticketId: Joi.string().uuid().required(),
    }),
  },
  getBookedTicket: {
    params: Joi.object({
      ticketId: Joi.string().uuid().required(),
    }),
  },
  getAvailableTickets: {
    params: Joi.object({
      trainNumber: Joi.string().required(),
    }),
  },
};
