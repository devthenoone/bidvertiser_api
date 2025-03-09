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




//Updating data of Creatives
router.put('/updateCreative/:id', async (req: Request, res: Response) => {
  const { id } = req.params; // Extract id from URL params
  const { adName, title, description1, description2, displayURL, destinationURL } = req.body;

  console.log('Received campaign ID:', id); // Log the ID received

  try {
    const [result] = await db.execute(`
      UPDATE creativedetails
      SET ad_name = ?, title = ?, description_1 = ?, description_2 = ?, 
          display_url = ?, destination_url = ?
      WHERE campaign_id = ?
    `, [adName, title, description1, description2, displayURL, destinationURL, id]);

    if ((result as mysql.ResultSetHeader).affectedRows === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json({ message: 'Record updated successfully' });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ message: 'Failed to update data', error });
  }
});






export default router;
