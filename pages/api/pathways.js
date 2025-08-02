// pages/api/pathways.js
import { calculatePathways } from '../../lib/eligibility';
import { getAllOccupations } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const formData = req.body; // { nombre, edad, ingles, … }

  try {
    // Ejemplo: si necesitas datos de la DB (ocupaciones, puntos mínimos, etc.)
    const occupations = await getAllOccupations();
    
    // Tu lógica principal, separada en lib/eligibility.js
    const pathways = calculatePathways(formData, occupations);

    return res.status(200).json({ pathways });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}