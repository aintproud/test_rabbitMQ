import { connect } from "amqplib";
import express from "express";
import bodyParser from "body-parser";
import { randomUUID } from "crypto";
import pino from "pino";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
const { RABBITMQ_PORT, RABBITMQ_HOST, APP_PORT } = process.env;
process.env;

const connection = await connect(`${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
const channel = await connection.createChannel();
const queueName = "someQueue";

const logger = pino();
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
	const repo = req.body?.repo;
	if (!repo || !(typeof repo === "string")) {
		const errorMessage = {
			action: "m1",
			error: "repo (String) is required",
		};
		logger.error(errorMessage);
		res.status(400).send(errorMessage);
		return;
	}
	const result = await channel.assertQueue("", { exclusive: true });
	const callbackQueue = result.queue;
	const correlationId = randomUUID();
	channel.consume(
		callbackQueue,
		(msg) => {
			if (msg.properties.correlationId === correlationId) {
				const data = JSON.parse(msg.content.toString());
				logger.info({
					action: "recieve response from m2",
					payload: data,
				});
				res.send(data);
			}
		},
		{
			noAck: true,
		}
	);
	logger.info({ action: "sending data to m2", payload: repo });
	channel.sendToQueue(queueName, Buffer.from(repo), {
		correlationId,
		replyTo: callbackQueue,
	});
});

app.listen(APP_PORT, () => {
	logger.info(`Server is running on port ${APP_PORT}`);
});
