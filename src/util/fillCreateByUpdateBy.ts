import { ICreateBy, ICreateDate, IUpdateBy, IUpdateDate } from "../interface/iCreateBy";
import { IHash } from "../interface/iHash";

export function fillCreateByUpdateBy({ row, createBy, updateBy, createDate, updateDate }: { row: IHash; createBy?: ICreateBy; updateBy?: IUpdateBy; createDate?: ICreateDate; updateDate?: IUpdateDate }) {
  if (!createBy && !updateBy && !createDate && !updateDate) {
    return row;
  }

  const rowData = { ...row };
  if (createBy !== undefined && createBy !== null) {
    if (typeof createBy === "object") {
      rowData[createBy.fieldName] = createBy.value;
    } else {
      rowData["createBy"] = createBy;
    }
  }

  if (updateBy !== undefined && updateBy !== null) {
    if (typeof updateBy === "object") {
      rowData[updateBy.fieldName] = updateBy.value;
    } else {
      rowData["updateBy"] = updateBy;
    }
  }

  if (createDate !== undefined && createDate !== null) {
    if (createDate instanceof Date) {
      rowData["createDate"] = createDate;
    } else if (typeof createDate === "string") {
      rowData["createDate"] = createDate;
    } else {
      rowData[createDate.fieldName] = createDate.value;
    }
  }

  if (updateDate !== undefined && updateDate !== null) {
    if (updateDate instanceof Date) {
      rowData["updateDate"] = updateDate;
    } else if (typeof updateDate === "string") {
      rowData["updateDate"] = updateDate;
    } else {
      rowData[updateDate.fieldName] = updateDate.value;
    }
  }
  return rowData;
}
