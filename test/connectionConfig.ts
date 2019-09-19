import { config } from "mssql";
import * as fs from "fs";
// import * as program from "commander";

// program
//   .option("--server <n>", "please input sqlserver ip")
//   .option("--password <n>", "please input sqlserver password")
//   .option("--require", "")
//   .parse(process.argv);

let server = "$SQLSERVER_IP";
let password = "$SQLSERVER_PASSWORD";

if (server.endsWith("SQLSERVER_IP")) {
  let configFile = "./test/config.json";
  if (!fs.existsSync(configFile)) {
    let content = `{
      "server": "127.0.0.1",
      "password": ""
    }`;

    fs.writeFileSync(configFile, content);

    console.error(`文件${configFile}不存在，已自动创建，请修改配置！`);
  }

  let config = JSON.parse(fs.readFileSync(configFile, { encoding: "utf-8" }));
  server = config.server;
  password = config.password;
}

export let connectionConfig: config = {
  server: server || ".",
  user: "sa",
  password: password || "",
  database: "mssql-i",
  port: 1433,
  connectionTimeout: 60000,
  requestTimeout: 60000
};
