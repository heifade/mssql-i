import { config } from "mssql";
import * as fs from "fs";
import { Command } from "commander";
import { version as v } from "../package.json";

const program = new Command();

const connConfig = {
  server: "",
  user: "",
  password: "",
  database: "",
  port: 1433,
};

program
  .option("--user <n>", "please input sqlserver user")
  .option("--server <n>", "please input sqlserver ip")
  .option("--password <n>", "please input sqlserver password")
  .option("--port <n>", "please input sqlserver port")
  .option("--require", "")
  .action((pars) => {
    if (!pars.server) {
      let configFile = "./test/config.json";
      if (!fs.existsSync(configFile)) {
        let content = `{
        "server": "127.0.0.1",
        "password": "",
        "port": 1433
      }`;

        fs.writeFileSync(configFile, content);
        console.error(`文件${configFile}不存在，已自动创建，请修改配置！`);
      }

      let config = JSON.parse(fs.readFileSync(configFile, { encoding: "utf-8" }));

      connConfig.server = config.server;
      connConfig.user = config.user;
      connConfig.password = config.password;
      connConfig.database = config.database;
      connConfig.port = config.port;
    } else {
      connConfig.server = pars.server;
      connConfig.user = pars.user;
      connConfig.password = pars.password;
      connConfig.database = pars.database;
    }
  });

program.parse(process.argv);

export function getConnectionConfig() {
  return {
    server: connConfig.server || ".",
    user: connConfig.user || "sa",
    password: connConfig.password || "",
    database: connConfig.database,
    port: connConfig.port || 1433,
    connectionTimeout: 60000,
    requestTimeout: 60000,
    options: {
      trustServerCertificate: true,
    },
  } as config;
}
