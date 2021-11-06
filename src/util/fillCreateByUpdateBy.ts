import { CREATE_BY, CREATE_DATE, UPDATE_BY, UPDATE_DATE } from "../const";
import { ICreateBy, ICreateDate, IUpdateBy, IUpdateDate } from "../interface/iCreateBy";
import { IHash } from "../interface/iHash";

export function fillCreateByUpdateBy({ row, createBy, updateBy, createDate, updateDate }: { row: IHash; createBy?: ICreateBy; updateBy?: IUpdateBy; createDate?: ICreateDate; updateDate?: IUpdateDate }) {
  if (createBy === undefined && updateBy === undefined && createDate === undefined && updateDate === undefined) {
    return row;
  }

  const rowData = { ...row };
  fillData(rowData, CREATE_BY, createBy);
  fillData(rowData, CREATE_DATE, createDate);
  fillData(rowData, UPDATE_BY, updateBy);
  fillData(rowData, UPDATE_DATE, updateDate);

  return rowData;
}

function fillData(rowData: IHash, fieldName: string, value: any) {
  if (!Reflect.has(rowData, fieldName) && value !== undefined) {
    if (value === null) {
      rowData[fieldName] = null;
    } else {
      rowData[fieldName] = value;
    }
  }
}
