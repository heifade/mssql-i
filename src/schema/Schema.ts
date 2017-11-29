import { Select } from "../Select";

import {
  SchemaModel,
  TableSchemaModel,
  ColumnSchemaModel,
  ProcedureSchemaModel,
  ProcedureParSchemaModel
} from "../model/SchemaModel";
import { GlobalCache } from "../global/GlobalCache";
import { Connection } from "mysql";

/**
 * 数据库架构信息缓存
 *
 * @class SchemaCache
 */
export class SchemaCache {
  private static globalKey = "SchemaModel";
  private static getHash() {
    let hash = GlobalCache.get(SchemaCache.globalKey);
    if (!hash) {
      hash = {};
      GlobalCache.set(SchemaCache.globalKey, hash);
    }
    return hash;
  }
  /**
   * 获取指定数据库的架构信息
   *
   * @static
   * @param {string} database - 数据库名称
   * @returns
   * @memberof SchemaCache
   */
  public static get(database: string) {
    return Reflect.get(SchemaCache.getHash(), database);
  }
  /**
   * 设置指定数据库的架构信息
   *
   * @static
   * @param {string} database - 数据库名称
   * @param {*} value - 架构信息
   * @returns
   * @memberof SchemaCache
   */
  public static set(database: string, value: SchemaModel) {
    return Reflect.set(SchemaCache.getHash(), database, value);
  }
}

/**
 * 数据库架构信息
 *
 * @export
 * @class Schema
 */
export class Schema {
  /**
   * 清空指定数据库的架构信息
   *
   * @static
   * @param {string} database - 数据库名称
   * @memberof SchemaCache
   */
  public static clear(database: string) {
    SchemaCache.set(database, null);
  }
  /**
   * 获取数据库架构信息
   *
   * @static
   * @param {Connection} conn
   * @param {string} database
   * @returns
   * @memberof Schema
   */
  public static getSchema(conn: Connection, database: string) {
    return new Promise<SchemaModel>((resolve, reject) => {
      let schemaModel = SchemaCache.get(database);
      if (!schemaModel) {
        schemaModel = new SchemaModel();

        let sqlTables = `
          select
            obj.schema_id as schemaId,
            schms.name as schemaName,
            obj.object_id as objId,
            obj.name as tableName,
            dis.value as description
          from
          sys.objects as obj
          join sys.schemas as schms on obj.schema_id = schms.schema_id
          left join sys.extended_properties dis on dis.major_id = obj.object_id and dis.minor_id = 0 and LOWER(dis.name) = 'ms_description'
          where obj.type in('U')
        `;



        let sqlColumns = `
          select
            sches.schema_id as schemaId,
            sches.name as schemaName,
            tbs.object_id as tableId,
            tbs.name as tableName,
            sysCols.colid as position,
            sysCols.name as columnName,
            columnProperty(sysCols.id, sysCols.name, 'IsIdentity') as isIdentity ,
            case when pk.object_id is not null then 1 else 0 end as primaryKey,
            sysType.name as dbType,
            sysCols.length AS size,
            sysCols.prec,
            sysCols.scale,
            sysCols.isnullable as canNull,
            isnull(e.text, '')  as defaultValue,
            isNull(dis1.value, '') as description
          from
            sys.syscolumns as sysCols
            join sys.tables as tbs on sysCols.id = tbs.object_id
            join sys.schemas as sches on tbs.schema_id = sches.schema_id
            left join sys.systypes as sysType on sysCols.xusertype = sysType.xusertype
            left join sys.syscomments as e on sysCols.cdefault = e.id
            left join sys.extended_properties as dis1 on sysCols.id = dis1.major_id and sysCols.colid = dis1.minor_id
            left join (

              select
                indexs.object_id,
                indexs.index_id as indexId,
                indCols.column_id as columnId
              from
                sys.indexes as indexs
                join sys.index_columns as indCols on indexs.object_id = indCols.object_id and indexs.index_id = indCols.index_id
              where indexs.type <> 0 and indexs.is_primary_key = 1

            ) pk on sysCols.id = pk.object_id and pk.columnId = sysCols.colid
          order by tableName asc, sysCols.colid asc


          `

        let sqlProcedures = `select SPECIFIC_NAME as procedureName
          from
          information_schema.ROUTINES
          where ROUTINE_SCHEMA = ?`;

          `
          select
            obj.schema_id as schemaId,
            schms.name as schemaName,
            sysMod.object_id as objId,
            obj.name as objName,
            dis.value as description
          from
            sys.sql_modules as sysMod
            join sys.objects as obj on sysMod.object_id = obj.object_id
            join sys.schemas as schms on obj.schema_id = schms.schema_id
            left join sys.extended_properties dis on dis.major_id = sysMod.object_id and dis.minor_id = 0 and LOWER(dis.name) = 'ms_description'
          where obj.type = 'P'
          order by schemaName asc, objName asc
          `

        let sqlProcedurePars = `select PARAMETER_NAME as parameterName,
          SPECIFIC_NAME as procedureName,
          lower(PARAMETER_MODE) as parameterMode
          from information_schema.PARAMETERS
          where SPECIFIC_SCHEMA = ?
          order by ORDINAL_POSITION`;

        Select.selects(conn, [
          { sql: sqlTables, where: [database] },
          { sql: sqlColumns, where: [database] },
          { sql: sqlProcedures, where: [database] },
          { sql: sqlProcedurePars, where: [database] }
        ]).then(lists => {
          let tableList = lists[0];
          let columnList = lists[1];
          schemaModel.tables = new Array<TableSchemaModel>();
          tableList.map(table => {
            let tableModel = new TableSchemaModel();
            tableModel.name = table.get("tableName");
            tableModel.columns = [];
            schemaModel.tables.push(tableModel);

            columnList
              .filter(
                column => column.get("tableName") === table.get("tableName")
              )
              .map(column => {
                let columnModel = new ColumnSchemaModel();
                columnModel.columnName = column.get("columnName");
                columnModel.primaryKey = column.get("primaryKey") === "1";
                tableModel.columns.push(columnModel);
              });
          });

          let procedureList = lists[2];
          let procedureParsList = lists[3];
          schemaModel.procedures = new Array<ProcedureSchemaModel>();
          procedureList.map(procedure => {
            let procedureModel = new ProcedureSchemaModel();
            procedureModel.name = procedure.get("procedureName");
            procedureModel.pars = [];
            schemaModel.procedures.push(procedureModel);

            procedureParsList
              .filter(
                par =>
                  par.get("procedureName") === procedure.get("procedureName")
              )
              .map(par => {
                let parModel = new ProcedureParSchemaModel();
                parModel.name = par.get("parameterName");
                parModel.parameterMode = par.get("parameterMode");
                procedureModel.pars.push(parModel);
              });
          });

          SchemaCache.set(database, schemaModel);

          resolve(schemaModel);
        });
      } else {
        resolve(schemaModel);
      }
    });
  }
}
