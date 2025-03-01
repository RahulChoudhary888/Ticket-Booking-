import httpError from "http-errors";
import { envConfig } from "#configs/index";
import { ERROR_CODES } from "#constants/index";
import { logger } from "#helpers/index";
import { StatusCodes } from "http-status-codes";

const mysql = require("mysql2");
const util = require("util");

const pool = mysql.createPool({
	host: envConfig.DB_HOST,
	port: envConfig.DB_PORT,
	user: envConfig.DB_USERNAME,
	password: envConfig.DB_PASSWORD,
	database: envConfig.DB_NAME,
	connectionLimit: 100,
	multipleStatements: true,
	timezone: "Z"
});

export const getConnection = () => {
	return new Promise((resolve, reject) => {
		pool.getConnection((err, connection) => {
			if (err) {
				if (err.code === "ER_ACCESS_DENIED_ERROR") {
					logger.error("Database connection denied");
					reject(new Error("Database connection was closed."));
					return;
				}
				if (err.code === "PROTOCOL_CONNECTION_LOST") {
					logger.error("Database connection was closed.");
					reject(new Error("Database connection was closed."));
					return;
				}
				if (err.code === "ER_CON_COUNT_ERROR") {
					logger.error("Database has too many connections.");
					reject(new Error("Database has too many connections."));
					return;
				}
				if (err.code === "ECONNREFUSED") {
					logger.error("Database connection was refused.");
					reject(new Error("Database connection was refused."));
					return;
				}
				logger.error(`Error connecting to database. ${err}`);
				reject(new Error("Error connecting to database"));
				return;
			}

			if (connection) {
				logger.info("Successfully connected to Database !!");
				const beginTransaction = util.promisify(connection.beginTransaction).bind(connection);
				const rollback = util.promisify(connection.rollback).bind(connection);
				const query = util.promisify(connection.query).bind(connection);
				const commit = util.promisify(connection.commit).bind(connection);
				resolve({ beginTransaction, rollback, query, commit, connection });
			}
		});
	});
};

export const mysqlQuery = util.promisify(pool.query).bind(pool);

export const mysqlTransaction = async (queries, queryValues) => {
	if (queries.length !== queryValues.length) {
		throw httpError(StatusCodes.BAD_REQUEST, "Number of provided queries did not match the number of provided query values arrays", ERROR_CODES.INVALID);
	}
	const connection = await getConnection();

	try {
		await connection.beginTransaction();

		const queryPromises = [];
		queries.forEach((query, index) => {
			queryPromises.push(connection.query({ sql: query, values: queryValues[index] }));
		});
		const results = await Promise.all(queryPromises);

		await connection.commit();
		connection.connection.release();
		return results;
	} catch (err) {
		await connection.rollback();
		connection.connection.release();
		throw err;
	}
};

export const mysqlSequencedTransaction = async (queries, queryValues) => {
	if (queries.length !== queryValues.length) {
		throw httpError(StatusCodes.BAD_REQUEST, "Number of provided queries did not match the number of provided query values arrays", ERROR_CODES.INVALID);
	}
	const connection = await getConnection();

	try {
		await connection.beginTransaction();

		const results = await queries.reduce(async (promise, query, index) => {
			await promise;
			return connection.query({ sql: query, values: queryValues[index] });
		}, true);

		await connection.commit();
		connection.connection.release();
		return results;
	} catch (err) {
		await connection.rollback();
		connection.connection.release();
		throw err;
	}
};
