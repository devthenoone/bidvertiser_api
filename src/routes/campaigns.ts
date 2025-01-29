import { Router } from "express";
import db from "../config";
import { ResultSetHeader } from "mysql2"; // Import this at the top
import express, { Request, Response } from 'express';
import * as mysql from 'mysql2/promise';

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




// Route to delete a campaign by ID
router.delete('/deleteCampaign/:id', async (req: Request, res: Response) => {
  const { id } = req.params; // Extract the ID from the route parameter

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if the campaign exists
    const [campaignCheck] = await connection.execute(
      `SELECT id FROM campaigns WHERE id = ?`,
      [id]
    );

    if ((campaignCheck as any[]).length === 0) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Delete from performancemetrics table
    await connection.execute(
      `DELETE FROM performancemetrics WHERE campaign_id = ?`,
      [id]
    );

    // Delete from CreativeDetails table
    await connection.execute(
      `DELETE FROM creativedetails WHERE campaign_id = ?`,
      [id]
    );

    // Delete from Bidding table
    await connection.execute(
      `DELETE FROM bidding WHERE campaign_id = ?`,
      [id]
    );

    // Delete from AdvancedSettings table (if exists)
    await connection.execute(
      `DELETE FROM advancedsettings WHERE campaign_id = ?`,
      [id]
    );

    // Finally, delete from Campaigns table
    await connection.execute(
      `DELETE FROM campaigns WHERE id = ?`,
      [id]
    );

    await connection.commit();
    res.status(200).json({ message: `Campaign with ID ${id} deleted successfully` });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting campaign:', error);
    res.status(500).json({ message: 'Failed to delete campaign', error });
  } finally {
    connection.release();
  }
});





// Route to update campaign data
router.post('/updateCampaign', async (req: Request, res: Response) => {
  const {
    id,
    geo,
    impressions,
    video_impressions,
    clicks,
    win_rate
  } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Update the GEO field in the Campaigns table
    const updateGeoQuery = `
      UPDATE campaigns
      SET geo = ?
      WHERE id = ?
    `;
    await connection.execute(updateGeoQuery, [geo, id]);

    // Update metrics in the performancemetrics table
    const updateMetricsQuery = `
      UPDATE performancemetrics
      SET impressions = ?, video_impressions = ?, clicks = ?, win_rate = ?
      WHERE campaign_id = ?
    `;
    await connection.execute(updateMetricsQuery, [
      impressions,
      video_impressions,
      clicks,
      win_rate,
      id,
    ]);

    await connection.commit();
    res.status(200).json({ message: 'Campaign updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating campaign:', error);
    res.status(500).json({ message: 'Failed to update campaign', error });
  } finally {
    connection.release();
  }
});




router.get('/getCreativeById/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log("Received campaign ID:", id);

  try {
    const [results] = await db.execute<mysql.RowDataPacket[]>(`
      SELECT c.*, ca.traffic_source_type
      FROM creativedetails c
      LEFT JOIN campaigns ca ON c.campaign_id = ca.id
      WHERE c.campaign_id = ?
    `, [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching data by ID:', error);
    res.status(500).json({ message: 'Failed to fetch data', error });
  }
});






/// Route to fetch all data (Campaigns, Bidding, CreativeDetails) in one go
router.get('/allData', async (req: Request, res: Response) => {
  try {
    // Query for campaigns
    const [campaigns] = await db.execute(`
      SELECT c.id, c.campaign_name, c.ad_format, c.geo, c.traffic_source_type,
             b.bid, b.daily_cap, b.cost,
             p.impressions, p.clicks, p.conversions, p.win_rate, p.video_impressions
      FROM campaigns c
      JOIN bidding b ON c.id = b.campaign_id
      JOIN performancemetrics p ON c.id = p.campaign_id
    `);

    // Query for bidding
    const [bidding] = await db.execute(`
      SELECT b.campaign_id, b.bid, b.daily_cap, b.cost
      FROM bidding b
      JOIN performancemetrics p ON b.campaign_id = p.campaign_id
    `);

    // Query for creative details
    const [creatives] = await db.execute(`
      SELECT c.id AS creative_id, c.campaign_id, c.ad_name, c.title, c.description_1, c.description_2, c.display_url, c.destination_url
      FROM creativedetails c
      JOIN performancemetrics p ON c.campaign_id = p.campaign_id
    `);

    res.json({ campaigns, bidding, creatives });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Failed to fetch data', error });
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
