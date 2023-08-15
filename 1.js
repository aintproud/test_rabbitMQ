import { connect } from 'amqplib';
import express from 'express';
import bodyParser from 'body-parser';
import {randomUUID} from 'crypto';
import dotenv from "dotenv";
dotenv.config({ path: ".env" })
const { RABBITMQ_PORT, RABBITMQ_HOST, APP_PORT } = process.env
	process.env;
const connection = await connect(`${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
const channel = await connection.createChannel();
const queueName = 'someQueue'

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
	const repo = req.body?.repo
	if(!repo){
		res.status(400).send({
			action: 'm1',
			error: 'repo is required'
		})
		return
	}
	const result = await channel.assertQueue('', { exclusive: true });
	const callbackQueue = result.queue;
	const correlationId = randomUUID();
	channel.consume(callbackQueue, (msg) => {
		if (msg.properties.correlationId === correlationId) {
		  const data = JSON.parse(msg.content.toString())
		  console.log({
			action: 'recieve response from m2',
			payload: data
		  });
		  res.send(data);
		}
	  }, {
		noAck: true,
	  });
	console.log({ action: 'recieve HTTP data', payload: repo });
	channel.sendToQueue(queueName,
		Buffer.from(repo),{
			correlationId,
			replyTo: callbackQueue });
	});

app.listen(APP_PORT, () => {
	console.log(`Server is running on port ${ APP_PORT }`);
});