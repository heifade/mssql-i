import { config } from "mssql";
import * as fs from "fs";
import * as program from "commander";

program
  .option("--server <n>", "please input sqlserver ip")
  .option("--require", "")
  .parse(process.argv);

if (!program.server) {
  let config = JSON.parse(
    fs.readFileSync("./test/config.json", { encoding: "utf-8" })
  );
  program.server = config.server;
}

export let connectionConfig: config = {
  server: program.server || ".",
  user: "travis",
  password: "",
  database: "djd-test",
  port: 1433,
  connectionTimeout: 60000,
  requestTimeout: 60000
};
