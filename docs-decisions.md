# Decisions & Notes

## 2025-08-20 — Iteración 1
**Objetivo:** Desbloquear el `build` y estabilizar el `dashboard` sin tocar lógica de negocio.

### Cambios
1) **TypeScript en `pages/dashboard.tsx`**
   - Dejamos de reutilizar el tipo `Profile` del hook para el `SSR profile` (venía con forma distinta y cruzaba tipos).
   - `DashboardProps.profile` ahora usa un tipo local de UI (o `any` si prefieres ultra-minimal).
   - Añadí un extractor seguro de ANZSCO que evita `.match` sobre `never`.
   - El objeto que se pasa al hook se tipa como `GraphProfile` (el tipo exportado por el hook).

2) **`next.config.js`**
   - Eliminado `experimental.appDir` (Next.js 15 ya no lo reconoce).

3) **Tip CLI**
   - Si quieres puerto efímero: usar `npm run dev -- -p 0` o `npm run dev -- --port=0`
     (evita `-- --port 0` porque Next interpreta `0` como ruta de proyecto).

### Resultado esperado
- `npm run -s build` debe compilar.
- En `npm run dev`, el `dashboard` renderiza y no explota el diagrama; el panel de depuración muestra el `anzscoCode` calculado.

### Next (propuesto para Iteración 2)
- Conectar `skillAssessmentBody` al **Nodo 4 Skill Assessment** del grafo (UI + tooltip).
- Armar contenedor de **States** (nivel 3) como lista desplegable + selección de **Pathway**.
- Añadir prueba ligera para el extractor ANZSCO.

---
# Decisiones de diseño — 2025-08-20

## Contexto actual
- El dashboard renderiza el `DecisionDiagram` con nodos y enlaces provenientes de `mapToGraphWithEligibility`.
- Se corrigió la integración con `states` y `pathways` desde los endpoints `/api/eligibility/states` y `/api/eligibility/pathways`.
- Se creó un puente en `features/decision-graph/services/mapToGraph.ts` para exportar correctamente `mapToGraphWithEligibility` y `visaStatus`.
- Ahora el grafo incluye:
  - Start (Total points).
  - Visas (189/190/491).
  - Estados bajo visa 190/491.
  - Pathways bajo estado seleccionado, con resumen de brechas.

## Reglas de status por visa
- Se introdujo `visaStatus`:
  - **ok**: total ≥ 65.
  - **warn**: total ≥ 55.
  - **fail**: total < 55.
- Bonus: 190 (+5), 491 (+15).

## Pendientes
- Nodo 4: Skill Assessment → usar `occupation.skill_assessment_body`.
- Nodo 5: Estudio.
- Nodo 6: Experiencia.
- Nodo 7: Residencia.
- Nodo 8: Invitación.
- Refinar UX:
  - Mostrar estados como lista desplegable (no múltiples nodos).
  - Selección de pathway con drop list (no nodos múltiples).