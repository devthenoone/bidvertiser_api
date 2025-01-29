import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import campaignsRouter from "./routes/campaigns";
import creativesRouter from "./routes/creatives";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

// Routes
app.use("/api/campaigns", campaignsRouter);
app.use("/api/creatives", creativesRouter);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ message: "API is working!" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
