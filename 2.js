import { connect } from "amqplib";
import got from "got";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
const { RABBITMQ_PORT, RABBITMQ_HOST } = process.env;

const connection = await connect(`${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
const channel = await connection.createChannel();
const queueName = "someQueue";
channel.assertQueue(queueName, { durable: false });
channel.prefetch(1);
channel.consume(queueName, async (message) => {
	let post;
	try {
		const repo = message.content.toString();
		console.log({
			action: "recieve message from m2",
			payload: repo,
		});
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
console.log("Awaiting RPC requests");
