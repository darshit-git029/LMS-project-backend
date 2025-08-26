import { Response } from "express";
import dotenv from "dotenv";
import { IUser } from "../model/user.model";
dotenv.config();

interface ITokenOption {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
}

//parsh enviorment varialble to integreat with fallback value
const accesstokenexpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "300", 10);
const refreshtokenexpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "1200", 10);

//options for cookie
export const accessTokenOption: ITokenOption = {
  expires: new Date(Date.now() + accesstokenexpire * 60 * 60 * 1000),
  maxAge: accesstokenexpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};
export const refreshTokenOption: ITokenOption = {
  expires: new Date(Date.now() + refreshtokenexpire * 24 * 60 * 60 * 1000),
  maxAge: refreshtokenexpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  //upload session in redis

  res.cookie("access_token", accessToken, accessTokenOption);
  res.cookie("refresh_token", refreshToken, refreshTokenOption);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
