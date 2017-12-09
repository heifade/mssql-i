import { config } from "mssql";
import * as fs from "fs";
import * as program from "commander";

program
  .option("--server <n>", "please input sqlserver ip")
  .option("--user <n>", "please input sqlserver user")
  .option("--database <n>", "please input sqlserver database")
  .option("--require", "")
  .parse(process.argv);

if (!program.server || !program.user || !program.database) {
  let config = JSON.parse(
    fs.readFileSync("./test/config.json", { encoding: "utf-8" })
  );
  program.server = config.server;
  program.user = config.user;
  program.database = config.database;
}

export let connectionConfig: config = {
  server: program.server,
  user: program.user,
  password: "",
  database: program.database,
  port: 1433,
  connectionTimeout: 60000,
  requestTimeout: 60000
};