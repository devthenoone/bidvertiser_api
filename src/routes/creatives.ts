import { Router } from "express";
import db from "../config";

const router = Router();

// Fetch creative by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.execute(
      "SELECT * FROM creativedetails WHERE campaign_id = ?",
      [id]
    );
    res.json(results);
  } catch (error) {
    console.error("Error fetching creative:", error);
    res.status(500).json({ message: "Failed to fetch creative", error });
  }
});

// Update creative details
router.put("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { adName, title, description1, description2, displayURL, destinationURL } = req.body;

  try {
    await db.execute(
      `UPDATE creativedetails SET ad_name = ?, title = ?, description_1 = ?, 
       description_2 = ?, display_url = ?, destination_url = ? WHERE campaign_id = ?`,
      [adName, title, description1, description2, displayURL, destinationURL, id]
    );
    res.json({ message: "Creative updated successfully" });
  } catch (error) {
    console.error("Error updating creative:", error);
    res.status(500).json({ message: "Failed to update creative", error });
  }
});

export default router;
