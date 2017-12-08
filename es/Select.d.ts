import { ConnectionPool } from "mssql";
import { SelectParamsModel } from "./model/SelectParamsModel";
import { SplitPageParamsModel } from "./model/SplitPageParamsModel";
import { SplitPageResultModel } from "./model/SplitPageResultModel";
export declare class Select {
    private static selectBase(conn, param);
    static select(conn: ConnectionPool, param: SelectParamsModel): Promise<any>;
    static selects(conn: ConnectionPool, params: SelectParamsModel[]): Promise<{}[][]>;
    static selectTop1(conn: ConnectionPool, param: SelectParamsModel): Promise<any>;
    static selectCount(conn: ConnectionPool, param: SelectParamsModel): Promise<number>;
    static selectSplitPage(conn: ConnectionPool, param: SplitPageParamsModel): Promise<SplitPageResultModel>;
}
