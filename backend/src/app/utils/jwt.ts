import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import config from "../../config";

export const createToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: string
): string =>
  jwt.sign(payload, secret, { expiresIn } as SignOptions);

export const verifyToken = (token: string, secret: Secret): JwtPayload =>
  jwt.verify(token, secret) as JwtPayload;

export const createAccessToken = (userId: string) =>
  createToken({ userId }, config.jwt.accessSecret, config.jwt.accessExpiresIn);

export const createRefreshToken = (userId: string) =>
  createToken(
    { userId },
    config.jwt.refreshSecret,
    config.jwt.refreshExpiresIn
  );
