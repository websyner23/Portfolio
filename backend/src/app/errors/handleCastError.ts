import mongoose from "mongoose";
import httpStatus from "http-status";
import { TErrorSource, TGenericErrorResponse } from "../interface/error";

const handleCastError = (
  err: mongoose.Error.CastError
): TGenericErrorResponse => {
  const errorSources: TErrorSource[] = [
    { path: err.path, message: `Invalid value for ${err.path}` },
  ];

  return {
    statusCode: httpStatus.BAD_REQUEST,
    message: "Invalid ID",
    errorSources,
  };
};

export default handleCastError;
