import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import campaignsRouter from "./routes/campaigns";
import creativesRouter from "./routes/creatives";
import budgetRouter from "./routes/budget";
import targetRouter from "./routes/targeting";
import alldataRouter from "./routes/alldata";
import metricsRouter from "./routes/metrics";
// import performanceRouter from "./routes/performance";
import summaryRouter from "./routes/summary";
import campaignimgRouter from "./routes/campaignimg";
import path from 'path';


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

app.use("/upload", express.static(path.join(__dirname, "upload")));

// Routes
app.use("/api/campaigns", campaignsRouter);
app.use("/api/creatives", creativesRouter);
app.use("/api/budget", budgetRouter);
app.use("/api/targeting", targetRouter);
app.use("/api/alldata", alldataRouter);
app.use("/api/metrics", metricsRouter);
// app.use("/api/performance", performanceRouter);
app.use("/api/summary", summaryRouter);
app.use("/api/campaignimg", campaignimgRouter);


// Health Check
app.get("/api/health", (req, res) => {
  res.json({ message: "API is working!" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


