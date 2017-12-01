import { config } from "mssql";

export let connectionConfig: config = {
  server: "127.0.0.1",
  user: "travis",
  password: "",
  database: "mssql-i-test",
  port: 1433,
  connectionTimeout: 60000,
  requestTimeout: 60000
};
