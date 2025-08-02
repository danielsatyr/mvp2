// pages/api/pathways.js
import { calculatePathways } from '../../lib/eligibility';
import { getAllOccupations }   from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // 1) Leemos el body con los datos del formulario
    const formData = req.body;

    // 2) Traemos las ocupaciones de la base
    const occupations = await getAllOccupations();

    // 3) Calculamos los pathways usando la lógica centralizada
    const pathways = calculatePathways(formData, occupations);

    // 4) Respondemos con el listado de pathways
    return res.status(200).json({ pathways });
  } catch (error) {
    console.error('🔥 API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}