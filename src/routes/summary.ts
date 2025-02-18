import { Router } from "express";
import db from "../config";
import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2/promise';


const router = Router();




//Summary data api is here
router.get('/getData', async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
  
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'startDate and endDate are required.' });
      }
  
      // Query the database for campaign, bidding, and performance data
      const [rows] = await db.execute<RowDataPacket[]>(`
       SELECT 
  c.id AS campaign_id,
  c.campaign_name,
  b.bid,
  b.daily_cap,
  b.cost,
  SUM(p.impressions) AS total_impressions,
  SUM(p.clicks) AS total_clicks,
  ROUND(SUM(b.cost) / NULLIF(SUM(p.clicks), 0), 2) AS cpc,
  c.created_at AS start_date,
  c.updated_at AS end_date
FROM campaigns c
LEFT JOIN bidding b ON c.id = b.campaign_id
LEFT JOIN performancemetrics p ON c.id = p.campaign_id
WHERE c.created_at BETWEEN ? AND ?
GROUP BY c.id, b.bid, b.daily_cap, b.cost

      `, [startDate, endDate]);
  
      if (!rows.length) {
        return res.status(404).json({ message: 'No data found for the selected date range.' });
      }
  
      const result = rows.map((row) => {
        // Calculate win rate and cpc
        const winRate = (row.total_clicks / row.total_impressions) * 100;
        const cpc = row.cost / (row.total_clicks || 1);  // Avoid division by zero
  
        // Format startDate and endDate
        const formatDate = (date: string) => {
          const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
          const formattedDate = new Date(date).toLocaleDateString('en-GB', options); // 'en-GB' ensures the format is DD/MM/YYYY
          return formattedDate;
        };
  
        return {
          startDate: formatDate(row.start_date), // Formatted startDate
          endDate: formatDate(row.end_date), // Formatted endDate
          total: row.total_impressions || 0,
          adRequests: row.total_impressions || 0,
          visits: row.total_clicks || 0,
          cost: `$ ${(row.cost ? Number(row.cost) : 0).toFixed(2)}`, // Ensure cost is a number
          cpc: `$ ${cpc.toFixed(2)}`, // Ensure CPC is calculated and formatted
          winRate: `${winRate.toFixed(2)}%`, // Win Rate in percentage
        };
      });
  
      res.json(result);
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ message: 'Failed to fetch data', error });
    }
  });
  

  export default router;