export declare class TableSchemaModel {
    name: string;
    columns: ColumnSchemaModel[];
}
export declare class ColumnSchemaModel {
    columnName: string;
    primaryKey: boolean;
    autoIncrement: boolean;
}
export declare class ProcedureSchemaModel {
    name: string;
    pars: ProcedureParSchemaModel[];
}
export declare class ProcedureParSchemaModel {
    name: string;
    parameterMode: string;
}
export declare class SchemaModel {
    tables: TableSchemaModel[];
    procedures: ProcedureSchemaModel[];
    getTableSchemaModel(tableName: string): TableSchemaModel;
    getProcedureSchemaModel(name: string): ProcedureSchemaModel;
}
