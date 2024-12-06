import { IUser } from "../model/user.model";

declare namespace Express {
  export interface Request {
    user?: IUser;
  }
}
