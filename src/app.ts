import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import campaignsRouter from "./routes/campaigns";
import creativesRouter from "./routes/creatives";

dotenv.config();

const app = express();


const PORT = process.env.PORT || 5000;
// Environment-based settings
// const isProduction = process.env.NODE_ENV === 'production';
// const corsOrigin = "http://localhost:3000"; // Default for localhost development

const corsOptions = {
  origin: ["https://bidvertiserdemo.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
;


// // Configure CORS
// app.use(cors({ origin: process.env.CORS_ORIGIN || "https://bidvertiser-api.vercel.app" }));
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


