import * as moment from "moment";

export function getMillToNow(date: string) {
  return new Date().getTime() - moment(date, "YYYY-MM-DD HH:mm:ss").toDate().getTime();
}
