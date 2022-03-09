import { Request } from "mssql";
import { IHash } from "../interface/iHash";

export function getParameters(request: Request) {
  if (request && request.parameters) {
    const { parameters } = request;
    const hash: IHash = {};
    Object.getOwnPropertyNames(parameters).map((key) => {
      const { value } = parameters[key];
      hash[key] = value;
    });
    return ` pars: ${JSON.stringify(hash)}`;
  }
  return "";
}
