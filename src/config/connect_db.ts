import dotenv from 'dotenv';
import { User, Package, Feature, Car, Salon, Notification, Purchase, Message, Conversation, Appointment, Permission, Invoice } from "../entities";
import { DataSourceOptions } from 'typeorm';


dotenv.config({ path: './server/.env' });

export const connectionString: DataSourceOptions = {
    type: "postgres",
    host: process.env.DB_HOT_NAME_CLOUD,
    port: Number(process.env.DB_PORT_CLOUD),
    username: process.env.DB_USERNAME_CLOUD,
    password: process.env.DB_PASSWORD_CLOUD,
    database: process.env.DB_NAME_CLOUD,
    url: process.env.DB_URL_CLOUD,
    entities: [User, Package, Feature, Car, Salon, Notification, Purchase, Message, Conversation, Appointment, Permission, Invoice],
    synchronize: true,
    ssl: {
      rejectUnauthorized: false
    }
  }

