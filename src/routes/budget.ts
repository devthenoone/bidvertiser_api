import { Router } from "express";
import db from "../config";
import express, { Request, Response } from 'express';
import * as mysql from 'mysql2/promise';




const router = Router();

// Route to fetch budget data by ID (including campaign name)
router.get('/getBudgetById/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
  
    try {
      const [result] = await db.execute<mysql.RowDataPacket[]>(`
        SELECT b.cost, b.daily_cap, c.campaign_name
        FROM bidding b
        JOIN campaigns c ON b.campaign_id = c.id
        WHERE b.campaign_id = ?
      `, [id]);
  
      if (result.length === 0) {
        return res.status(404).json({ message: 'Budget not found for this campaign ID' });
      }
  
      res.json(result[0]);
    } catch (error) {
      console.error('Error fetching budget and campaign name by ID:', error);
      res.status(500).json({ message: 'Failed to fetch budget and campaign data', error });
    }
  });

  
// Route to update the budget (similar to updateCreative)
router.put('/updateBudget/:id', async (req: Request, res: Response) => {
    const { id } = req.params; // Extract id from URL params
    const { cost, noDailyLimit } = req.body; // Extract updated values
  
    try {
      const [result] = await db.execute(`
        UPDATE bidding
        SET cost = ?
        WHERE campaign_id = ?
      `, [cost, id]);
  
      if ((result as mysql.ResultSetHeader).affectedRows === 0) {
        return res.status(404).json({ message: 'Budget not found or no changes made' });
      }
  
      res.json({ message: 'Budget updated successfully' });
    } catch (error) {
      console.error('Error updating budget:', error);
      res.status(500).json({ message: 'Failed to update budget', error });
    }
  });
  




  export default router;