/**
 * 存储过程参数结构
 *
 * @export
 * @class ProcedureParSchemaModel
 */
export class ProcedureParSchemaModel {
  /**
   * 参数名称
   *
   * @type {string}
   * @memberof ProcedureParSchemaModel
   */
  public name: string = "";
  /**
   * 数据类型
   *
   * @type {string}
   * @memberof ProcedureParSchemaModel
   */
  public dataType: string = "";
  /**
   * 入参/出参: in/out
   *
   * @type {string}
   * @memberof ProcedureParSchemaModel
   */
  public parameterMode: string = "";
}

/**
 * 存储过程结构
 *
 * @export
 * @class ProcedureSchemaModel
 */
export class ProcedureSchemaModel {
  /**
   * 存储过程名称
   *
   * @type {string}
   * @memberof ProcedureSchemaModel
   */
  public name: string = "";
  /**
   * 参数列表
   *
   * @type {ProcedureParSchemaModel[]}
   * @memberof ProcedureSchemaModel
   */
  public pars: ProcedureParSchemaModel[] = [];
}

/**
 * 表字段结构
 *
 * @export
 * @class ColumnSchemaModel
 */
export class ColumnSchemaModel {
  /**
   * 表名称
   *
   * @type {string}
   * @memberof ColumnSchemaModel
   */
  public tableName: string = "";
  /**
   * 字段名称
   *
   * @type {string}
   * @memberof ColumnSchemaModel
   */
  public columnName: string = "";
  /**
   * 数据类型
   *
   * @type {string}
   * @memberof ColumnSchemaModel
   */
  public dataType: string = "";
  /**
   * 字节长度
   *
   * @type {number}
   * @memberof ColumnSchemaModel
   */
  public bytes: number = 0;
  /**
   * 字符长度
   *
   * @type {number}
   * @memberof ColumnSchemaModel
   */
  public chars: number = 0;
  /**
   * 小数位长度
   *
   * @type {number}
   * @memberof ColumnSchemaModel
   */
  public scale: number = 0;
  /**
   * 是否可空
   *
   * @type {boolean}
   * @memberof ColumnSchemaModel
   */
  public isNullable: boolean = false;
  /**
   * 是否主键
   *
   * @type {boolean}
   * @memberof ColumnSchemaModel
   */
  public primaryKey: boolean = false;
  /**
   * 是否自增
   *
   * @type {boolean}
   * @memberof ColumnSchemaModel
   */
  public autoIncrement: boolean = false;
  /**
   * 默认值
   *
   * @type {string}
   * @memberof ColumnSchemaModel
   */
  public defaultValue: string = "";
  /**
   * 字段描述
   *
   * @type {string}
   * @memberof ColumnSchemaModel
   */
  public description: string = "";
}

/**
 * 表结构
 *
 * @export
 * @class TableSchemaModel
 */
export class TableSchemaModel {
  /**
   * 表名称
   *
   * @type {string}
   * @memberof TableSchemaModel
   */
  public name: string = "";
  /**
   * 表描述
   *
   * @type {string}
   * @memberof TableSchemaModel
   */
  public description: string = "";
  /**
   * 字段列表
   *
   * @type {ColumnSchemaModel[]}
   * @memberof TableSchemaModel
   */
  public columns: ColumnSchemaModel[] = [];
}

/**
 * 数据库结构
 *
 * @export
 * @class SchemaModel
 */
export class SchemaModel {
  /**
   * 表列表
   *
   * @type {TableSchemaModel[]}
   * @memberof SchemaModel
   */
  public tables: TableSchemaModel[] = [];
  /**
   * 存储过程列表
   *
   * @type {ProcedureSchemaModel[]}
   * @memberof SchemaModel
   */
  public procedures: ProcedureSchemaModel[] = [];
  /**
   * 获取表结构
   *
   * @param {string} tableName
   * @returns
   * @memberof SchemaModel
   */
  public getTableSchemaModel(tableName: string) {
    return this.tables.find((item) => item.name === tableName);
  }
  /**
   * 获取存储过程结构
   *
   * @param {string} procedureName
   * @returns
   * @memberof SchemaModel
   */
  public getProcedureSchemaModel(procedureName: string) {
    return this.procedures.find((item) => item.name === procedureName);
  }
}
