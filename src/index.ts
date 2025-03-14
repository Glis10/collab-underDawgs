import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { envConfig } from '@/config/env.config';
import userRouter from '@/routes/v1/user.routes';

const app = express();
const port = envConfig.port;

app.use(
	cors({
		origin: '*',
		allowedHeaders: ['Content-Type', 'Authorization'],
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
	})
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/v1/healthcheck', (req, res) => {
	res.send('Server is up and running');
});

app.use('/api/v1/user', userRouter);

app.listen(port, () => {
	console.log(`Server is listening on: ${port}`);
});
