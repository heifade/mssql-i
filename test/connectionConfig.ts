import { config } from "mssql";
import * as program from "commander";

program
  .version("0.0.1")
  .option("-p, --ip <n>", "please input sqlserver ip")
  .option("-u, --user <n>", "please input sqlserver user")
  .option("--require", "")
  .parse(process.argv);

export let connectionConfig: config = {
  server: program.ip || '127.0.0.1',
  user: program.user || 'travis',
  password: "",
  database: "djd-test",
  port: 1433,
  connectionTimeout: 60000,
  requestTimeout: 60000
};

console.log(connectionConfig);