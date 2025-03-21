import { Router } from "express";
import db from "../config";
import * as mysql from 'mysql2/promise';
import multer from 'multer';
import express, { Request, Response } from 'express';
import path from 'path';
const router = Router();
import fs from 'fs';
import { put } from "@vercel/blob";

import dotenv from "dotenv";
dotenv.config();

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

if (!blobToken) {
  throw new Error("BLOB_READ_WRITE_TOKEN is missing from environment variables!");
}

// Use blobToken in your upload logic...

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "src/upload/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage });

// router.post("/upload", upload.single("file"), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }

//   const filePath = `/upload/${req.file.filename}`;
//   res.json({ filePath });
// });



// Multer setup (stores file in memory as buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const { url } = await put(fileName, req.file.buffer, {
      access: "public",
      contentType: req.file.mimetype,
    });

    res.json({ fileUrl: url });
  } catch (error) {
    console.error("Upload Error:", error);

    // ✅ Fix: Cast 'error' to 'Error' before accessing 'message'
    const err = error as Error;

    res.status(500).json({ message: "Failed to upload file", error: err.message });
  }
});






// Fetch all campaigns
router.get("/", async (req, res) => {
  console.log("ouchh dont touch me i am parent");
  try {
    const [campaigns] = await db.execute("SELECT * FROM campaigns");
    console.log("ouchh dont touch me i am parent");
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
  console.log('Hay dont touch mee You getting all my data');
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



// Route to save campaign data
router.post('/saveCampaign', upload.single("image"), async (req: Request, res: Response) => {
  console.log("Uploaded File:", req.file);
  console.log("Request Body:", req.body);

  // Extracting campaign details from the request body
  const {
    campaignName,
    adFormat,
    geo,
    trafficSourceType,
    bid,
    dailyCap,
    cost,
    adName,
    title,
    description1,
    description2,
    displayURL,
    destinationURL,
    impressions,
    clicks,
    conversions,
    winRate,
    videoImp,
    advancedSettings,
    imgLocation,
        image
  } = req.body;


  // Replace empty or undefined fields with null
  const sanitizedData = {
    campaignName: adName,
    adFormat: adFormat || null,
    geo: geo || null,
    trafficSourceType: trafficSourceType || null,
    bid: bid || null,
    dailyCap: cost || null,
    cost: dailyCap || null,
    adName: adName || null,
    title: title || null,
    description1: description1 || null,
    description2: description2 || null,
    displayURL: displayURL || null,
    destinationURL: destinationURL || null,
    impressions: impressions || null,
    clicks: clicks || null,
    conversions: conversions || null,
    winRate: winRate || null,
    videoImp: videoImp || null,
    advancedSettings: Array.isArray(advancedSettings) ? advancedSettings : [],
    imgLocation: imgLocation || null,  // Updated to use uploaded image path
    image: image || null
  };

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Insert into Campaigns table
    const campaignQuery = `
        INSERT INTO campaigns (campaign_name, ad_format, geo, traffic_source_type)
        VALUES (?, ?, ?, ?)
    `;
    const [campaignResult] = await connection.execute<mysql.ResultSetHeader>(campaignQuery, [
      sanitizedData.adName,
      sanitizedData.adFormat,
      sanitizedData.geo,
      sanitizedData.trafficSourceType,
    ]);
    const campaignId = campaignResult.insertId;

    // Insert into bidding table
    await connection.execute(
      `INSERT INTO bidding (campaign_id, bid, daily_cap, cost) VALUES (?, ?, ?, ?)`,
      [campaignId, sanitizedData.bid, sanitizedData.dailyCap, sanitizedData.cost]
    );

    // Insert into creativedetails table
    await connection.execute(
      `INSERT INTO creativedetails (campaign_id, ad_name, title, description_1, description_2, display_url, destination_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,

      [
        campaignId,
        sanitizedData.adName,
        sanitizedData.title,
        sanitizedData.description1,
        sanitizedData.description2,
        sanitizedData.displayURL,
        sanitizedData.destinationURL,
      ]
    );

    // Insert into performancemetrics table
    await connection.execute(
      `INSERT INTO performancemetrics (campaign_id, impressions, clicks, conversions, win_rate, video_impressions)
       VALUES (?, ?, ?, ?, ?, ?)`,

      [
        campaignId,
        sanitizedData.impressions,
        sanitizedData.clicks,
        sanitizedData.conversions,
        sanitizedData.winRate,
        sanitizedData.videoImp,
      ]
    );


    await connection.execute(
      `INSERT INTO campaign_images (img_location, campaign_id) VALUES (?, ?)`,
      [sanitizedData.imgLocation, campaignId]
    );
  


      const advancedSettingsQuery = `
          INSERT INTO advancedsettings (campaign_id, setting_name, setting_value)
          VALUES (?, ?, ?)
      `;
      for (const setting of sanitizedData.advancedSettings) {
        const settingName = setting.name || null;
        const settingValue = setting.value || null;
        await connection.execute(advancedSettingsQuery, [campaignId, settingName, settingValue]);
      }
    

    await connection.commit();
    res.status(200).json({ message: 'Campaign saved successfully', imgPath: sanitizedData.image });

  } catch (error) {
    await connection.rollback();
    console.error('Error saving campaign:', error);
    res.status(500).json({ message: 'Failed to save campaign', error });
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

// Route to fetch all campaign names
router.get('/campaignNames', async (req: Request, res: Response) => {
  try {
    const [results] = await db.execute<mysql.RowDataPacket[]>(`
      SELECT DISTINCT campaign_name
      FROM campaigns
    `);

    if (results.length === 0) {
      return res.status(404).json({ message: 'No campaigns found' });
    }

    const campaignNames = results.map((row: any) => row.campaign_name);
    res.json({ campaignNames });
  } catch (error) {
    console.error('Error fetching campaign names:', error);
    res.status(500).json({ message: 'Failed to fetch campaign names', error });
  }
});





export default router;
