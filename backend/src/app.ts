import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import realtimeBroadcast from "./app/middlewares/realtimeBroadcast";
import router from "./app/routes";

const app: Application = express();

app.use(
  cors({
    origin: [config.frontendUrl, config.adminUrl],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.json({ success: true, message: "WebSyner API is running" });
});

app.get("/api/v1/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1", realtimeBroadcast);
app.use("/api/v1", router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
