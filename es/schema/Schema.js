"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Select_1 = require("../Select");
const SchemaModel_1 = require("../model/SchemaModel");
const GlobalCache_1 = require("../global/GlobalCache");
class SchemaCache {
    static getHash() {
        let hash = GlobalCache_1.GlobalCache.get(SchemaCache.globalKey);
        if (!hash) {
            hash = {};
            GlobalCache_1.GlobalCache.set(SchemaCache.globalKey, hash);
        }
        return hash;
    }
    static get(database) {
        return Reflect.get(SchemaCache.getHash(), database);
    }
    static set(database, value) {
        return Reflect.set(SchemaCache.getHash(), database, value);
    }
}
SchemaCache.globalKey = "SchemaModel";
exports.SchemaCache = SchemaCache;
class Schema {
    static clear(database) {
        SchemaCache.set(database, null);
    }
    static getSchema(conn, database) {
        return __awaiter(this, void 0, void 0, function* () {
            let schemaModel = SchemaCache.get(database);
            if (!schemaModel) {
                schemaModel = new SchemaModel_1.SchemaModel();
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
      `;
                let sqlProcedures = `
        select
          obj.schema_id as schemaId,
          schms.name as schemaName,
          sysMod.object_id as objId,
          obj.name as procedureName,
          dis.value as description
        from
          sys.sql_modules as sysMod
          join sys.objects as obj on sysMod.object_id = obj.object_id
          join sys.schemas as schms on obj.schema_id = schms.schema_id
          left join sys.extended_properties dis on dis.major_id = sysMod.object_id and dis.minor_id = 0 and LOWER(dis.name) = 'ms_description'
        where obj.type = 'P'
        order by schemaName asc, procedureName asc
      `;
                let sqlProcedurePars = `
        select
          pars.object_id as objId,
          REPLACE(pars.name, '@', '') as parameterName,
          pars.parameter_id as parameterId,
          case pars.is_output when 0 then 'in' else 'out' end as parameterMode,
          typ.name as dbType,
          pars.max_length as size,
          pars.precision as prec,
          pars.scale,
          pars.has_default_value as hasDefaultValue,
          pars.default_value as defaultValue,
          dis.value as description
        from
          sys.parameters as pars
          join sys.types typ on pars.system_type_id = typ.system_type_id and pars.user_type_id = typ.user_type_id
          left join sys.extended_properties dis on pars.object_id = dis.major_id and dis.minor_id = pars.parameter_id
        order by objId
      `;
                let lists = yield Select_1.Select.selects(conn, [
                    { sql: sqlTables, where: [] },
                    { sql: sqlColumns, where: [] },
                    { sql: sqlProcedures, where: [] },
                    { sql: sqlProcedurePars, where: [] }
                ]);
                let tableList = lists[0];
                let columnList = lists[1];
                schemaModel.tables = new Array();
                tableList.map(table => {
                    let tableModel = new SchemaModel_1.TableSchemaModel();
                    tableModel.name = table.get("tableName");
                    tableModel.columns = [];
                    schemaModel.tables.push(tableModel);
                    columnList
                        .filter(column => column.get("tableName") === table.get("tableName"))
                        .map(column => {
                        let columnModel = new SchemaModel_1.ColumnSchemaModel();
                        columnModel.columnName = column.get("columnName");
                        columnModel.primaryKey = column.get("primaryKey") === 1;
                        columnModel.autoIncrement = column.get("isIdentity") === 1;
                        tableModel.columns.push(columnModel);
                    });
                });
                let procedureList = lists[2];
                let procedureParsList = lists[3];
                schemaModel.procedures = new Array();
                procedureList.map(procedure => {
                    let procedureModel = new SchemaModel_1.ProcedureSchemaModel();
                    procedureModel.name = procedure.get("procedureName");
                    procedureModel.pars = [];
                    schemaModel.procedures.push(procedureModel);
                    procedureParsList
                        .filter(par => par.get("objId") === procedure.get("objId"))
                        .map(par => {
                        let parModel = new SchemaModel_1.ProcedureParSchemaModel();
                        parModel.name = par.get("parameterName");
                        parModel.parameterMode = par.get("parameterMode");
                        procedureModel.pars.push(parModel);
                    });
                });
                SchemaCache.set(database, schemaModel);
                return schemaModel;
            }
            else {
                return schemaModel;
            }
        });
    }
}
exports.Schema = Schema;
//# sourceMappingURL=Schema.js.map