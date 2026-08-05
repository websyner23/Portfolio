import { Model, Types } from "mongoose";

export type TUserStatus = "active" | "blocked";

export type TUser = {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: Types.ObjectId;
  employee?: Types.ObjectId;
  avatar?: string;
  status: TUserStatus;
  needsPasswordChange: boolean;
  passwordChangedAt?: Date;
  lastLoginAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
};

export interface UserModel extends Model<TUser> {
  isPasswordMatched(plain: string, hashed: string): Promise<boolean>;
  isJWTIssuedBeforePasswordChanged(
    passwordChangedAt: Date,
    jwtIssuedAt: number
  ): boolean;
}
