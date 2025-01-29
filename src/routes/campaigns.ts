import { Router } from "express";
import db from "../config";
import { ResultSetHeader } from "mysql2"; // Import this at the top

const router = Router();

// Fetch all campaigns
router.get("/", async (req, res) => {
  try {
    const [campaigns] = await db.execute("SELECT * FROM campaigns");
    res.json({ campaigns });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Failed to fetch campaigns", error });
  }
});



// Create a new campaign
router.post("/save", async (req, res) => {
  const { campaignName, adFormat, geo, trafficSourceType } = req.body;

  try {
    const [result] = await db.execute<ResultSetHeader>(
        "INSERT INTO campaigns (campaign_name, ad_format, geo, traffic_source_type) VALUES (?, ?, ?, ?)",
        [campaignName, adFormat, geo, trafficSourceType]
      );
    res.json({ message: "Campaign saved successfully", id: result.insertId });
  } catch (error) {
    console.error("Error saving campaign:", error);
    res.status(500).json({ message: "Failed to save campaign", error });
  }
});

// Update a campaign
router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { geo } = req.body;

  try {
    await db.execute("UPDATE campaigns SET geo = ? WHERE id = ?", [geo, id]);
    res.json({ message: "Campaign updated successfully" });
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({ message: "Failed to update campaign", error });
  }
});

// Delete a campaign
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute("DELETE FROM campaigns WHERE id = ?", [id]);
    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ message: "Failed to delete campaign", error });
  }
});

export default router;
