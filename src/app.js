import apiRoutes from "./api";
import express from "express";
import helmet from "helmet";
import path from "path";
import { expressLogger } from "#helpers/index";
import { errorMiddleware } from "#middlewares/index";
import { jsend } from "#utils/index";



const app = express();

app.use(helmet());

app.use(jsend());
app.use(express.urlencoded({ extended: false, limit: "50MB" }));
app.use(expressLogger);
app.use(express.static(path.join(__dirname, "..", "public")));


app.use(express.json({ limit: "20MB" }));

app.use("/api", apiRoutes);
app.use("/", (req, res) => {
	res.json({ info: "Ticket Booking api server. Please visit health route for more information." });
});

app.use((err, req, res, next) => {
	errorMiddleware(err, req, res, next);
});

export { app };
