import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

import auth from "./routes/auth.js";
import admin from "./routes/admin.js";
import clients from "./routes/clients.js";
import sessionsRouter from "./routes/sessions.js";
import notes from "./routes/notes.js";
import homework from "./routes/homework.js";
import paymentsRouter from "./routes/payments.js";
import files from "./routes/files.js";
import pushTokensRouter from "./routes/push-tokens.js";
import cron from "./routes/cron.js";

const app = new Hono().basePath("/api/v1");

// Global middleware
app.use("*", logger());
app.use(
	"*",
	cors({
		origin: [
			"http://localhost:8081", // Expo dev
			"http://localhost:19006", // Expo web
		],
		credentials: true,
	}),
);

// Routes
app.route("/auth", auth);
app.route("/admin", admin);
app.route("/therapist/clients", clients);
app.route("/sessions", sessionsRouter);
app.route("/sessions", notes); // /sessions/:id/notes
app.route("/homework", homework);
app.route("/payments", paymentsRouter);
app.route("/files", files);
app.route("/push-tokens", pushTokensRouter);
app.route("/cron", cron);

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// Global error handler
app.onError((err, c) => {
	if (err instanceof HTTPException) {
		return c.json({ error: err.message }, err.status);
	}
	if (err instanceof ZodError) {
		return c.json({ error: "Validation error", details: err.flatten() }, 400);
	}
	console.error("Unhandled error:", err);
	return c.json({ error: "Internal server error" }, 500);
});

const port = Number(process.env.PORT ?? 3000);
console.log(`TherapySync API running on port ${port}`);

export default {
	port,
	fetch: app.fetch,
};
