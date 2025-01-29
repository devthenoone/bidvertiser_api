"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const campaigns_1 = __importDefault(require("./routes/campaigns"));
const creatives_1 = __importDefault(require("./routes/creatives"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Configure CORS
app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express_1.default.json());
// Routes
app.use("/api/campaigns", campaigns_1.default);
app.use("/api/creatives", creatives_1.default);
// Health Check
app.get("/api/health", (req, res) => {
    res.json({ message: "API is working!" });
});
// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
