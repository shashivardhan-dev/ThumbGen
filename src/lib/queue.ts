// src/lib/queue.ts
import 'dotenv/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
console.log('process.env.REDIS_HOST', process.env.REDIS_HOST);
console.log('process.env.REDIS_PORT', process.env.REDIS_PORT);
const connection = new IORedis({
  port: parseInt(process.env.REDIS_PORT as string, 10), // Redis port
  host: process.env.REDIS_HOST, // Redis host
  username: process.env.REDIS_USERNAME, // needs Redis >= 6
  password: process.env.REDIS_PASSWORD,
  db: 0, // Defaults to 0
   maxRetriesPerRequest: null, // Required for BullMQ
//   retryDelayOnFailover: 100,
//   enableReadyCheck: false,
});

export const thumbnailQueue = new Queue('thumbnailQueue', { connection });

export default connection;
