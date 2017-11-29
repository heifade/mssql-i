import { config } from "mssql";

export let connectionConfig: config = {
  server: "",
  user: "",
  password: "",
  database: "",
  // port: 3306,
  connectionTimeout: 10000
};
