import bcrypt from "bcryptjs";
import { model, Schema } from "mongoose";
import config from "../../../config";
import { TUser, UserModel } from "./user.interface";

const userSchema = new Schema<TUser, UserModel>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee" },
    avatar: { type: String },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    needsPasswordChange: { type: Boolean, default: true },
    passwordChangedAt: { type: Date },
    lastLoginAt: { type: Date },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, config.bcryptSaltRounds);
  }
  next();
});

userSchema.statics.isPasswordMatched = async function (
  plain: string,
  hashed: string
) {
  return bcrypt.compare(plain, hashed);
};

userSchema.statics.isJWTIssuedBeforePasswordChanged = function (
  passwordChangedAt: Date,
  jwtIssuedAt: number
) {
  return passwordChangedAt.getTime() / 1000 > jwtIssuedAt;
};

export const User = model<TUser, UserModel>("User", userSchema);
