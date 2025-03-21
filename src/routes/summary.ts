import { Router } from "express";
import db from "../config";
import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2/promise';


const router = Router();




// Summary data API
router.get('/getData', async (req: Request, res: Response) => {
  try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
          return res.status(400).json({ message: 'startDate and endDate are required.' });
      }

      // Query the database for daily metrics data
      const [rows] = await db.execute<RowDataPacket[]>(`
          SELECT 
              dm.id AS daily_metric_id,
              dm.campaign_id,
              dm.date,
              dm.visitors,
              dm.bid_requests,
              dm.cost,
              dm.cpc
          FROM daily_metrics dm
          WHERE dm.date BETWEEN ? AND ?
          ORDER BY dm.date ASC
      `, [startDate, endDate]);

      if (!rows.length) {
          return res.status(404).json({ message: 'No data found for the selected date range.' });
      }

      const result = rows.map((row) => {
          return {
              dailyMetricId: row.daily_metric_id,
              campaignId: row.campaign_id,
              date: row.date, // Keeping date as is
              visitors: row.visitors || 0,
              bidRequests: row.bid_requests || 0,
              cost: `${(row.cost ? Number(row.cost) : 0).toFixed(2)}`, // Ensure cost is formatted
              cpc: `${(row.cpc ? Number(row.cpc) : 0).toFixed(2)}` // Ensure CPC is formatted
          };
      });

      res.json(result);
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ message: 'Failed to fetch data', error });
  }
});


  export default router;