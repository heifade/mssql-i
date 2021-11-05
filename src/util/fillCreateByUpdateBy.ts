import { ICreateBy, ICreateDate, IUpdateBy, IUpdateDate } from "../interface/iCreateBy";
import { IHash } from "../interface/iHash";

export function fillCreateByUpdateBy({ row, createBy, updateBy, createDate, updateDate }: { row: IHash; createBy?: ICreateBy; updateBy?: IUpdateBy; createDate?: ICreateDate; updateDate?: IUpdateDate }) {
  if (!createBy && !updateBy && !createDate && !updateDate) {
    return row;
  }

  const rowData = { ...row };
  if (createBy !== undefined) {
    if (createBy === null) {
      rowData["createBy"] = null;
    } else {
      if (typeof createBy === "object") {
        rowData[createBy.fieldName] = createBy.value;
      } else {
        rowData["createBy"] = createBy;
      }
    }
  }

  if (updateBy !== undefined) {
    if (updateBy === null) {
      rowData["updateBy"] = null;
    } else {
      if (typeof updateBy === "object") {
        rowData[updateBy.fieldName] = updateBy.value;
      } else {
        rowData["updateBy"] = updateBy;
      }
    }
  }

  if (createDate !== undefined) {
    if (createDate === null) {
      rowData["createDate"] = null;
    } else {
      if (createDate instanceof Date) {
        rowData["createDate"] = createDate;
      } else if (typeof createDate === "string") {
        rowData["createDate"] = createDate;
      } else {
        rowData[createDate.fieldName] = createDate.value;
      }
    }
  }

  if (updateDate !== undefined) {
    if (updateDate === null) {
      rowData["updateDate"] = null;
    } else {
      if (updateDate instanceof Date) {
        rowData["updateDate"] = updateDate;
      } else if (typeof updateDate === "string") {
        rowData["updateDate"] = updateDate;
      } else {
        rowData[updateDate.fieldName] = updateDate.value;
      }
    }
  }
  return rowData;
}
