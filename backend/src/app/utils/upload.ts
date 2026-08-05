import { v2 as cloudinary } from "cloudinary";
import httpStatus from "http-status";
import multer from "multer";
import config from "../../config";
import AppError from "../errors/AppError";

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
];

/**
 * Memory storage keeps uploads off disk — no temp-file permissions to manage
 * on Windows, and the buffer streams straight to Cloudinary.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new AppError(httpStatus.BAD_REQUEST, `Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

export type TUploadResult = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
};

export const isCloudinaryConfigured = () =>
  Boolean(
    config.cloudinary.cloudName &&
      config.cloudinary.apiKey &&
      config.cloudinary.apiSecret
  );

export const uploadToCloudinary = (
  buffer: Buffer,
  folder = "websyner"
): Promise<TUploadResult> =>
  new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      reject(
        new AppError(
          httpStatus.SERVICE_UNAVAILABLE,
          "Image uploads are not configured — add CLOUDINARY_* values to backend/.env"
        )
      );
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error || !result) {
          reject(
            new AppError(
              httpStatus.INTERNAL_SERVER_ERROR,
              `Upload failed: ${error?.message ?? "unknown error"}`
            )
          );
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    stream.end(buffer);
  });

export const destroyFromCloudinary = async (publicId: string) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn(`[cloudinary] could not delete ${publicId}:`, (err as Error).message);
  }
};
