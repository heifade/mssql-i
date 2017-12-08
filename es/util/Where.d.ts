import { TableSchemaModel } from "../model/SchemaModel";
export declare class Where {
    static getWhereSQL(where: {}, tableSchemaModel: TableSchemaModel): {
        whereSQL: string;
        whereList: any[];
        wherePars: {};
    };
}
