"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TableSchemaModel {
}
exports.TableSchemaModel = TableSchemaModel;
class ColumnSchemaModel {
}
exports.ColumnSchemaModel = ColumnSchemaModel;
class ProcedureSchemaModel {
}
exports.ProcedureSchemaModel = ProcedureSchemaModel;
class ProcedureParSchemaModel {
}
exports.ProcedureParSchemaModel = ProcedureParSchemaModel;
class SchemaModel {
    getTableSchemaModel(tableName) {
        return this.tables.filter(table => table.name === tableName)[0];
    }
    getProcedureSchemaModel(name) {
        return this.procedures.filter(procedure => (procedure.name === name))[0];
    }
}
exports.SchemaModel = SchemaModel;
//# sourceMappingURL=SchemaModel.js.map