import { Router } from "express";
import db from "../config";
import express, { Request, Response } from 'express';
import * as mysql from 'mysql2/promise';



const router = Router();



// Getting data of Creatives along with Image Location
router.get('/getCreativeById/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log("Received campaign ID:", id);

  try {
    const [results] = await db.execute<mysql.RowDataPacket[]>(`
      SELECT 
        c.*, 
        ca.traffic_source_type,
        ci.img_location
      FROM creativedetails c
      LEFT JOIN campaigns ca ON c.campaign_id = ca.id
      LEFT JOIN campaign_images ci ON c.campaign_id = ci.campaign_id
      WHERE c.campaign_id = ?
    `, [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json(results[0]); // Returns all data including img_location
  } catch (error) {
    console.error('Error fetching data by ID:', error);
    res.status(500).json({ message: 'Failed to fetch data', error });
  }
});

// Updating data of Creatives, including Image URL
router.put('/updateCreative/:id', async (req: Request, res: Response) => {
  const { id } = req.params; // Extract campaign ID from URL params
  const { adName, title, description1, description2, displayURL, destinationURL, imgLocation } = req.body;

  console.log('Received campaign ID:', id); // Log the ID received

  const connection = await db.getConnection(); // Get database connection for transactions

  try {
    await connection.beginTransaction(); // Start transaction

    // Update creative details
    const [result] = await connection.execute(`
      UPDATE creativedetails
      SET ad_name = ?, title = ?, description_1 = ?, description_2 = ?, 
          display_url = ?, destination_url = ?
      WHERE campaign_id = ?
    `, [adName, title, description1, description2, displayURL, destinationURL, id]);

    if ((result as mysql.ResultSetHeader).affectedRows === 0) {
      throw new Error('Record not found');
    }

    // Check if an image already exists for this campaign
    const [existingImage] = await connection.execute(
      `SELECT img_location FROM campaign_images WHERE campaign_id = ?`, [id]
    ) as any[];

    if (existingImage.length > 0) {
      // Update the existing image (replace img_location with new URL or BLOB data)
      await connection.execute(`
        UPDATE campaign_images 
        SET img_location = ?
        WHERE campaign_id = ?
      `, [imgLocation, id]);
    } else {
      // Insert new image if none exists
      await connection.execute(`
        INSERT INTO campaign_images (campaign_id, img_location) 
        VALUES (?, ?)
      `, [id, imgLocation]);
    }

    await connection.commit(); // Commit transaction

    res.json({ message: 'Record updated successfully' });
  } catch (error) {
    await connection.rollback(); // Rollback in case of error
    console.error('Error updating data:', error);
    res.status(500).json({ message: 'Failed to update data', error });
  } finally {
    connection.release(); // Release connection
  }
});



export default router;
