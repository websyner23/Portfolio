import mongoose from "mongoose";
import httpStatus from "http-status";
import { TErrorSource, TGenericErrorResponse } from "../interface/error";

const handleValidationError = (
  err: mongoose.Error.ValidationError
): TGenericErrorResponse => {
  const errorSources: TErrorSource[] = Object.values(err.errors).map(
    (val: mongoose.Error.ValidatorError | mongoose.Error.CastError) => ({
      path: val.path,
      message: val.message,
    })
  );

  return {
    statusCode: httpStatus.BAD_REQUEST,
    message: "Validation error",
    errorSources,
  };
};

export default handleValidationError;
