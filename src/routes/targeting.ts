import { Router } from "express";
import db from "../config";
import express, { Request, Response } from 'express';
import * as mysql from 'mysql2/promise';


const router = Router();



// Route to fetch geo-targeting data for a specific campaign by ID
router.get('geo/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
  
    try {
      const [results] = await db.execute<mysql.RowDataPacket[]>(`
        SELECT geo
        FROM campaigns
        WHERE id = ?
      `, [id]);
  
      if (results.length === 0) {
        return res.status(404).json({ message: 'Geo data not found for this campaign' });
      }
  
      res.json(results[0]);
    } catch (error) {
      console.error('Error fetching geo data:', error);
      res.status(500).json({ message: 'Failed to fetch geo data', error });
    }
  });
  
// Route to update geo-targeting data for a specific campaign
router.put('/updateTargeting/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { geo } = req.body; // Updated geo data
  
    try {
      const [result] = await db.execute(`
        UPDATE campaigns
        SET geo = ?
        WHERE id = ?
      `, [geo, id]);
  
      if ((result as mysql.ResultSetHeader).affectedRows === 0) {
        return res.status(404).json({ message: 'Campaign not found or no changes made' });
      }
  
      res.json({ message: 'Geo targeting updated successfully' });
    } catch (error) {
      console.error('Error updating geo targeting:', error);
      res.status(500).json({ message: 'Failed to update geo targeting', error });
    }
  });
  

// Route to fetch targeting data for a specific campaign by ID
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
  
    try {
      const [results] = await db.execute<mysql.RowDataPacket[]>(`
        SELECT c.campaign_name, 
               t.targeting_key, 
               t.targeting_value
        FROM campaigns c
        LEFT JOIN targetingoptions t ON c.id = t.campaign_id
        WHERE c.id = ?
      `, [id]);
  
      if (results.length === 0) {
        return res.status(404).json({ message: 'Targeting data not found for this campaign' });
      }
  
      const campaignName = results[0].campaign_name;
      const targetingData: Record<string, any> = {};
  
      results.forEach((row: any) => {
        if (row.targeting_key) {
          try {
            // Attempt to parse targeting_value as JSON
            targetingData[row.targeting_key] = JSON.parse(row.targeting_value);
          } catch (err) {
            // Handle non-JSON values
            console.warn(`Invalid JSON for key ${row.targeting_key}:`, row.targeting_value);
            targetingData[row.targeting_key] = row.targeting_value; // Use raw value as fallback
          }
        }
      });
  
      const responseData = {
        campaignName: campaignName || '',
        availableKeywords: targetingData.availableKeywords || [],
        selectedKeywords: targetingData.selectedKeywords || [],
        negativeKeywords: targetingData.negativeKeywords || '',
        targetingType: targetingData.targetingType || 'RON',
      };
  
      res.json(responseData);
    } catch (error) {
      console.error('Error fetching targeting data by ID:', error);
      res.status(500).json({ message: 'Failed to fetch targeting data', error });
    }
  });
  
  


  export default router;