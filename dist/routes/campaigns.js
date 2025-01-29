"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const config_1 = __importDefault(require("../config"));
const router = (0, express_1.Router)();
// Fetch all campaigns
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [campaigns] = yield config_1.default.execute("SELECT * FROM campaigns");
        res.json({ campaigns });
    }
    catch (error) {
        console.error("Error fetching campaigns:", error);
        res.status(500).json({ message: "Failed to fetch campaigns", error });
    }
}));
// Create a new campaign
router.post("/save", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { campaignName, adFormat, geo, trafficSourceType } = req.body;
    try {
        const [result] = yield config_1.default.execute("INSERT INTO campaigns (campaign_name, ad_format, geo, traffic_source_type) VALUES (?, ?, ?, ?)", [campaignName, adFormat, geo, trafficSourceType]);
        res.json({ message: "Campaign saved successfully", id: result.insertId });
    }
    catch (error) {
        console.error("Error saving campaign:", error);
        res.status(500).json({ message: "Failed to save campaign", error });
    }
}));
// Update a campaign
router.put("/update/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { geo } = req.body;
    try {
        yield config_1.default.execute("UPDATE campaigns SET geo = ? WHERE id = ?", [geo, id]);
        res.json({ message: "Campaign updated successfully" });
    }
    catch (error) {
        console.error("Error updating campaign:", error);
        res.status(500).json({ message: "Failed to update campaign", error });
    }
}));
// Delete a campaign
router.delete("/delete/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield config_1.default.execute("DELETE FROM campaigns WHERE id = ?", [id]);
        res.json({ message: "Campaign deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting campaign:", error);
        res.status(500).json({ message: "Failed to delete campaign", error });
    }
}));
exports.default = router;
