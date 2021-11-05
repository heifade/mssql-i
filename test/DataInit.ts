import { Save, Exec, SaveType, Schema, Utils, ConnectionPool } from "../src/index";

export let initTable = async function (conn: ConnectionPool, tableName: string, autoIncrement: boolean) {
  await Exec.exec(conn, `if exists (select top 1 1 from sys.tables where name = '${tableName}') drop table ${tableName}`);
  await Exec.exec(
    conn,
    `create table ${tableName} (
        id int not null ${autoIncrement ? "identity(1,1)" : ""} primary key,
        value varchar(50),
        dateValue datetime,
        createBy varchar(100),
        createDate datetime,
        updateBy varchar(100),
        updateDate datetime
      )`
  );

  Schema.clear(Utils.getDataBaseFromConnection(conn));

  for (let i = 0; i < 10; i++) {
    let data = autoIncrement ? { value: `value${Math.random()}` } : { id: i, value: `value${Math.random()}` };

    await Save.save(conn, {
      data: data,
      table: tableName,
      saveType: SaveType.insert,
    });
  }
};

export let initTableWith2PrimaryKey = async function (conn: ConnectionPool, tableName: string) {
  await Exec.exec(conn, `if exists (select top 1 1 from sys.tables where name = '${tableName}') drop table ${tableName}`);
  await Exec.exec(
    conn,
    `create table ${tableName} (
        id1 int not null,
        id2 int not null,
        value varchar(50),
        dateValue datetime,
        createBy varchar(100),
        createDate datetime,
        updateBy varchar(100),
        updateDate datetime,
        primary key(id1, id2)
      )`
  );

  Schema.clear(Utils.getDataBaseFromConnection(conn));

  for (let i = 0; i < 10; i++) {
    let data = { id1: i, id2: i, value: `value${Math.random()}` };

    await Save.save(conn, {
      data: data,
      table: tableName,
      saveType: SaveType.insert,
    });
  }
};
