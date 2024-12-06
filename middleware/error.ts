import ErrorHandler from "../Utils/ErrorHandler";
import { NextFunction, Request, Response } from "express";

export const ErrorMiddleWare = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statuscode || 500;
  err.message = err.message || "Internal Server Error";

  //wrong mongodb id error
  if (err.name === "CastError") {
    const message = `resource not found, Invaild ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  //DiplicateKey error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }
  //wrong jwt token
  if (err.name === "JsonWebTokenError") {
    const message = `Json WebToken is invalid, try again`;
    err = new ErrorHandler(message, 400);
  }

  //Josntoken Expired error
  if (err.name === "TokenExpiredError") {
    const message = `Json WebToken is Expired, try again`;
    err = new ErrorHandler(message, 400);
  }
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
