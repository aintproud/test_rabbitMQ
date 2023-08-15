import { connect } from "amqplib";
import got from "got";
import dotenv from "dotenv";
import pino from "pino";
dotenv.config({ path: ".env" });
const { RABBITMQ_PORT, RABBITMQ_HOST } = process.env;

const logger = pino();
const connection = await connect(`${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
const channel = await connection.createChannel();
const queueName = "someQueue";
channel.assertQueue(queueName, { durable: false });
channel.prefetch(1);
channel.consume(queueName, async (message) => {
	logger.info({
		action: "recieve message from m2",
		payload: message,
	});
	let post;
	try {
		const repo = message.content.toString();
		const res = await got(
			`https://api.github.com/repos/${repo}/commits`
		).json();
		post = res.map((commit) => {
			return { message: commit.commit.message, author: commit.author.login };
		});
	} catch (error) {
		post = {
			action: "m2",
			error,
		};
		logger.error(post);
	}

	channel.sendToQueue(
		message.properties.replyTo,
		Buffer.from(JSON.stringify(post)),
		{
			correlationId: message.properties.correlationId,
		}
	);
	channel.ack(message);
});
logger.info("Awaiting RPC requests");
