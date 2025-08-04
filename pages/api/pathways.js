// pages/api/pathways.js
import { calculatePathways } from '../../lib/eligibility';
import { getAllOccupations }   from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const formData    = req.body;
    const occupations = await getAllOccupations();
    const result      = calculatePathways(formData, occupations);
    return res.status(200).json(result);
  } catch (error) {
    console.error('🔥 API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}