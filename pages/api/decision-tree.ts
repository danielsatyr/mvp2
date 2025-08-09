// pages/api/decision-tree.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Por ahora simulamos que recibimos los puntos del usuario
  // En el futuro, los obtendremos del formulario (req.body o BD)
  const currentPoints = Number(req.query.points ?? 0);

  

  // Insertamos nodo raíz con los puntos actuales
  const rootNode = { key: "Start", text: `Tus puntos actuales: ${currentPoints}` };

  // Si el usuario tiene suficientes puntos, expandimos el árbol
const root = {
  key: "Start",
  text: `Tus puntos actuales: ${currentPoints}`,
  isTreeExpanded: true,
  status: "info", // 👈 root en azul
  tooltipHtml: `
    <div style="font-weight:600;margin-bottom:4px;">Resumen</div>
    <div>Este es tu puntaje total calculado con base en tu formulario.</div>
    <ul style="margin:6px 0 0 18px;padding:0;">
      <li>Edad, Inglés, Educación, Experiencia</li>
      <li>Bonos: NAATI, PY, Estudio Regional</li>
    </ul>
  `,
};

  // Nodos existentes
const nodes = [
  {
    key: "AgeCheck",
    text: "Edad ≥ 25?",
    isTreeExpanded: false,
    status: currentPoints >= 65 ? "ok" : "warn", // ej. simple
    tooltipHtml: `<div><b>Regla:</b> 25–32 otorga más puntos.</div>`,
  },
  {
    key: "ELICheck",
    text: "Inglés Proficiente?",
    isTreeExpanded: false,
    status: "fail", // ej. demo
    tooltipHtml: `<div><b>Sugerido:</b> IELTS 7 en cada banda.</div>`,
  },
];

  const payload = {
    nodeDataArray: [root, ...nodes],
    linkDataArray: [
      { from: "Start", to: "AgeCheck", label: "Continuar" },
      { from: "AgeCheck", to: "ELICheck", label: "Sí" },
    ],
  };

  // Unimos el nodo raíz al resto
  const links = [
   { from: "Start", to: "AgeCheck", label: "Continuar" }, // o "Sí"
  { from: "AgeCheck", to: "ELICheck", label: "Sí" },
  // ejemplo de rama alternativa:
  // { from: "AgeCheck", to: "OtraRuta", label: "No" },
  ];

  const tree = {
    nodeDataArray: [rootNode, ...nodes],
    linkDataArray: links,
  };

    // 👇 Log explícito del root
  console.log("API /decision-tree root:", root);

  return res.status(200).json(tree);
}