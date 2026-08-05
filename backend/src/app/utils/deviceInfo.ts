import { Request } from "express";
import { UAParser } from "ua-parser-js";

export type TDeviceInfo = {
  ip: string;
  userAgent: string;
  device: {
    browser: string;
    os: string;
    deviceType: string;
  };
};

export const getDeviceInfo = (req: Request): TDeviceInfo => {
  const userAgent = req.headers["user-agent"] ?? "unknown";
  const parsed = new UAParser(userAgent).getResult();

  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "") ||
    req.ip ||
    req.socket.remoteAddress ||
    "unknown";

  return {
    ip,
    userAgent,
    device: {
      browser: [parsed.browser.name, parsed.browser.version]
        .filter(Boolean)
        .join(" ") || "unknown",
      os: [parsed.os.name, parsed.os.version].filter(Boolean).join(" ") || "unknown",
      deviceType: parsed.device.type ?? "desktop",
    },
  };
};
