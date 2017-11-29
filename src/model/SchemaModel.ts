export class TableSchemaModel {
  public name: string;
  public columns: ColumnSchemaModel[];
}

export class ColumnSchemaModel {
  public columnName: string;
  public primaryKey: boolean; //是否主键
  public autoIncrement: boolean; //是否自增
}

export class ProcedureSchemaModel {
  public name: string;
  public pars: ProcedureParSchemaModel[];
}

export class ProcedureParSchemaModel {
  public name: string;
  public parameterMode: string; //入参/出参: in/out
}

export class SchemaModel {
  public tables: TableSchemaModel[];
  public procedures: ProcedureSchemaModel[];

  public getTableSchemaModel(tableName: string) {
    return this.tables.filter(table => table.name === tableName)[0];
  }

  public getProcedureSchemaModel(name: string) {
    return this.procedures.filter(procedure => (procedure.name === name))[0];
  }
}
