import { config } from "mssql";

export let connectionConfig: config = {
  server: "123.206.217.34",
  user: "travis",
  password: "",
  database: "djd-test",
  port: 1433,
  connectionTimeout: 60000,
  requestTimeout: 60000
};
