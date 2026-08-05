import httpStatus from "http-status";
import { TErrorSource, TGenericErrorResponse } from "../interface/error";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleDuplicateError = (err: any): TGenericErrorResponse => {
  const field = Object.keys(err.keyValue ?? {})[0] ?? "field";
  const value = err.keyValue?.[field];

  const errorSources: TErrorSource[] = [
    { path: field, message: `${value ?? field} already exists` },
  ];

  return {
    statusCode: httpStatus.CONFLICT,
    message: "Duplicate value",
    errorSources,
  };
};

export default handleDuplicateError;
