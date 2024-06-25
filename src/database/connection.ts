import { createConnection } from "typeorm";
import { connectionString } from "../config/connect_db";

export = async () => {  
 
  try {
    createConnection(connectionString);
    console.log("Connected Db successfully!");
  } catch (error) {
    console.log("Error with connecting Db.");
  }
}
