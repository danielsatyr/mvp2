// pages/api/decision-tree.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: reemplaza este JSON de ejemplo con tu lógica real o consulta a BD
  const tree = {
    nodes: [
      { key: 'Start',    text: 'Inicio' },
      { key: 'AgeCheck', text: 'Edad ≥ 25?' },
      { key: 'ELICheck', text: 'Inglés Proficiente?' },
    ],
    links: [
      { from: 'Start',    to: 'AgeCheck' },
      { from: 'AgeCheck', to: 'ELICheck' },
      { from: 'ELICheck', to: 'Start' }, // solo ejemplo
    ],
  };

  return res.status(200).json(tree);
}
