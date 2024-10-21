import { Redis } from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisClient = () => {
<<<<<<< HEAD
  if (process.env.REDIS_URL) {
    console.log(`Redis Connected `);
    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
    return redis;
  }
  throw new Error("Redis Connection failed");
};

export const redis = redisClient();
=======
    if(process.env.REDIS_URL){
        console.log(`Redis Connected `)
        return process.env.REDIS_URL
    }
    throw new Error ("Redis Connection failed")
}

export const redis = new Redis(redisClient())
>>>>>>> parent of 68e8279 ({UPDATE}: LMS-project update socket server for notification correcting the other controllers and model.)
