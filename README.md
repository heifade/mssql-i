# mssql-i

[![NPM version](https://img.shields.io/npm/v/mssql-i.svg?style=flat-square)](https://npmjs.org/package/mssql-i)
[![NPM Downloads](https://img.shields.io/npm/dm/mssql-i.svg?style=flat-square)](https://npmjs.org/package/mssql-i)
[![License](https://img.shields.io/npm/l/mssql-i.svg?style=flat-square)](https://github.com/heifade/mssql-i/blob/master/LICENSE)

基于 [mssql](https://www.npmjs.com/package/mssql) 的 SQL Server 高层封装，提供简洁的 Promise API，让 Node.js 操作 SQL Server 更简单。

## 特性

- **简单易用** — 增删改查一行代码搞定，无需手写 SQL
- **基于 Promise** — 全面支持 async/await，告别回调地狱
- **事务支持** — 简单直观的事务封装，支持多种隔离级别
- **类型安全** — 内置 TypeScript 类型声明
- **参数化查询** — 自动参数绑定，防止 SQL 注入
- **连接池管理** — 内置连接池，开箱即用
- **存储过程** — 支持输入/输出参数及返回值

## 安装

```bash
npm install mssql-i
```

## 快速开始

```javascript
const { ConnectionHelper, Exec, Save, SaveType, Select } = require("mssql-i");

async function main() {
  // 1. 创建连接
  const conn = await ConnectionHelper.create({
    server: "localhost",
    user: "sa",
    password: "your_password",
    database: "your_db",
    port: 1433,
  });

  try {
    // 2. 建表
    await Exec.exec(conn, `
      CREATE TABLE tbl_test (
        id    INT PRIMARY KEY,
        value VARCHAR(255)
      )
    `);

    // 3. 插入数据
    await Save.save(conn, {
      table: "tbl_test",
      data: { id: 1, value: "hello" },
      saveType: SaveType.insert,
    });

    // 4. 查询数据
    const rows = await Select.select(conn, {
      sql: "SELECT * FROM tbl_test WHERE id = ?",
      where: [1],
    });
    console.log(rows); // [{ id: 1, value: 'hello' }]
  } finally {
    // 5. 关闭连接
    await ConnectionHelper.close(conn);
  }
}

main();
```

## 连接配置

`ConnectionHelper.create()` 接收 [mssql 连接池配置](https://www.npmjs.com/package/mssql#general-same-for-all-drivers)，常用参数如下：

| 参数 | 类型 | 说明 |
|------|------|------|
| `server` | `string` | 数据库服务器地址 |
| `port` | `number` | 端口号，默认 `1433` |
| `user` | `string` | 用户名 |
| `password` | `string` | 密码 |
| `database` | `string` | 数据库名 |
| `options.encrypt` | `boolean` | 是否启用加密（Azure 需设为 `true`） |
| `pool.max` | `number` | 连接池最大连接数，默认 `10` |
| `pool.min` | `number` | 连接池最小连接数，默认 `0` |
| `pool.idleTimeoutMillis` | `number` | 空闲连接超时时间（毫秒） |

```javascript
const conn = await ConnectionHelper.create({
  server: "localhost",
  user: "sa",
  password: "your_password",
  database: "your_db",
  options: { encrypt: false },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
});
```

> 💡 `ConnectionHelper.close(conn)` 可安全传入 `null` 或 `undefined`，不会抛出异常。

## API 一览

### Insert — 插入

| 方法 | 说明 |
|------|------|
| `Insert.insert(conn, { table, data })` | 插入一条数据，返回插入的记录 |

### Update — 更新

| 方法 | 说明 |
|------|------|
| `Update.update(conn, { table, data })` | 根据主键更新一条数据 |
| `Update.updateByWhere(conn, { table, data, where })` | 根据条件更新一条或多条数据 |

### Delete — 删除

| 方法 | 说明 |
|------|------|
| `Delete.delete(conn, { table, data })` | 根据主键删除一条数据 |
| `Delete.deleteByWhere(conn, { table, where })` | 根据条件删除一条或多条数据 |

### Replace — 替换

| 方法 | 说明 |
|------|------|
| `Replace.replace(conn, { table, data })` | 根据主键替换数据（存在则更新，不存在则插入） |

### Save — 保存（统一入口）

| 方法 | 说明 |
|------|------|
| `Save.save(conn, { table, data, saveType })` | 保存一条数据 |
| `Save.saves(conn, items[])` | 保存多条数据（**并发**执行） |
| `Save.savesSeq(conn, items[])` | 保存多条数据（**顺序**执行） |
| `Save.savesSeqWithTran(conn, items[])` | 保存多条数据（顺序执行，**事务**包裹） |

`saveType` 取值：`SaveType.insert` / `SaveType.update` / `SaveType.delete` / `SaveType.replace`

### Select — 查询

| 方法 | 说明 |
|------|------|
| `Select.select(conn, { sql, where })` | 执行查询，返回结果集 |
| `Select.selects(conn, queries[])` | 执行多个查询（并发） |
| `Select.selectTop1(conn, { sql, where })` | 查询并返回**第一行**数据 |
| `Select.selectOneValue(conn, { sql, where })` | 查询并返回第一行的**第一个字段值** |
| `Select.selectCount(conn, { sql, where })` | 查询结果的总行数 |
| `Select.selectSplitPage(conn, { sql, where, pageSize, index })` | 分页查询，返回总行数与当前页数据 |
| `Select.selectGUID(conn)` | 获取一个 GUID |

### Exec — 执行 SQL

| 方法 | 说明 |
|------|------|
| `Exec.exec(conn, sql)` | 执行一条 SQL 语句 |
| `Exec.execs(conn, sqls[])` | 执行多条 SQL 语句（**并发**） |
| `Exec.execsSeq(conn, sqls[])` | 执行多条 SQL 语句（**顺序**） |

### Procedure — 存储过程

| 方法 | 说明 |
|------|------|
| `Procedure.exec(conn, { procedure, data })` | 执行存储过程，支持输入/输出参数 |

### Transaction — 事务

| 方法 | 说明 |
|------|------|
| `Transaction.begin(conn)` | 开启事务 |
| `Transaction.commit(tran)` | 提交事务 |
| `Transaction.rollback(tran)` | 回滚事务 |

### ConnectionHelper — 连接管理

| 方法 | 说明 |
|------|------|
| `ConnectionHelper.create(config)` | 创建连接池 |
| `ConnectionHelper.close(conn)` | 关闭连接池 |

---

## 使用示例

### 插入数据

```javascript
await Save.save(conn, {
  table: "tbl_test",
  data: { id: 1, value: "hello" },
  saveType: SaveType.insert,
});
// 等效 SQL: INSERT INTO tbl_test (id, value) VALUES (1, 'hello')
```

### 根据主键更新

```javascript
await Save.save(conn, {
  table: "tbl_test",
  data: { id: 1, value: "world" },
  saveType: SaveType.update,
});
// 等效 SQL: UPDATE tbl_test SET value='world' WHERE id=1
```

### 根据条件更新

```javascript
await Update.updateByWhere(conn, {
  table: "tbl_test",
  data: { value: "updated" },
  where: { id: 1 },
});
// 等效 SQL: UPDATE tbl_test SET value='updated' WHERE id=1
```

### 删除数据

```javascript
await Save.save(conn, {
  table: "tbl_test",
  data: { id: 1 },
  saveType: SaveType.delete,
});
// 等效 SQL: DELETE FROM tbl_test WHERE id=1
```

### 替换数据（存在则更新，不存在则插入）

```javascript
await Save.save(conn, {
  table: "tbl_test",
  data: { id: 1, value: "replaced" },
  saveType: SaveType.replace,
});
```

### 批量操作

```javascript
// 并发执行（无顺序保证）
await Save.saves(conn, [
  { table: "tbl_test", data: { id: 1, value: "a" }, saveType: SaveType.insert },
  { table: "tbl_test", data: { id: 2, value: "b" }, saveType: SaveType.insert },
]);

// 顺序执行
await Save.savesSeq(conn, [
  { table: "tbl_test", data: { id: 1, value: "a" }, saveType: SaveType.insert },
  { table: "tbl_test", data: { id: 1, value: "b" }, saveType: SaveType.update },
]);
```

### 事务操作

```javascript
const { Transaction, Save, SaveType } = require("mssql-i");

let tran;
try {
  tran = await Transaction.begin(conn);

  await Save.savesSeq(
    conn,
    [
      { table: "tbl_test", data: { id: 1, value: "a" }, saveType: SaveType.insert },
      { table: "tbl_test", data: { id: 2, value: "b" }, saveType: SaveType.insert },
    ],
    tran
  );

  await Transaction.commit(tran);
} catch (err) {
  await Transaction.rollback(tran);
  throw err;
}
```

### 查询

```javascript
const { Select } = require("mssql-i");

// 普通查询
const rows = await Select.select(conn, {
  sql: "SELECT * FROM tbl_test WHERE id = ?",
  where: [1],
});

// 查询单个值
const count = await Select.selectOneValue(conn, {
  sql: "SELECT COUNT(*) FROM tbl_test",
});

// 分页查询
const page = await Select.selectSplitPage(conn, {
  sql: "SELECT *, ROW_NUMBER() OVER(ORDER BY id) AS row_number FROM tbl_test",
  pageSize: 10,
  index: 1, // 第 1 页
});
console.log(page.totalCount); // 总行数
console.log(page.data);       // 当前页数据
```

### 执行存储过程

```javascript
const { Procedure } = require("mssql-i");

const result = await Procedure.exec(conn, {
  procedure: "p_insert",
  data: { par1: "value1", par2: "value2" },
});
console.log(result);
```

## TypeScript 使用

```typescript
import { ConnectionHelper, Save, SaveType, Select, IOptions } from "mssql-i";

async function main() {
  const config: IOptions = {
    server: "localhost",
    user: "sa",
    password: "your_password",
    database: "your_db",
  };

  const conn = await ConnectionHelper.create(config);
  try {
    await Save.save(conn, {
      table: "tbl_test",
      data: { id: 1, value: "hello" },
      saveType: SaveType.insert,
    });

    const rows = await Select.select(conn, {
      sql: "SELECT * FROM tbl_test WHERE id = ?",
      where: [1],
    });
    console.log(rows);
  } finally {
    await ConnectionHelper.close(conn);
  }
}
```

## 许可证

[MIT](https://github.com/heifade/mssql-i/blob/master/LICENSE)
