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
// Fetch creative by ID
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const [results] = yield config_1.default.execute("SELECT * FROM creativedetails WHERE campaign_id = ?", [id]);
        res.json(results);
    }
    catch (error) {
        console.error("Error fetching creative:", error);
        res.status(500).json({ message: "Failed to fetch creative", error });
    }
}));
// Update creative details
router.put("/update/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { adName, title, description1, description2, displayURL, destinationURL } = req.body;
    try {
        yield config_1.default.execute(`UPDATE creativedetails SET ad_name = ?, title = ?, description_1 = ?, 
       description_2 = ?, display_url = ?, destination_url = ? WHERE campaign_id = ?`, [adName, title, description1, description2, displayURL, destinationURL, id]);
        res.json({ message: "Creative updated successfully" });
    }
    catch (error) {
        console.error("Error updating creative:", error);
        res.status(500).json({ message: "Failed to update creative", error });
    }
}));
exports.default = router;
