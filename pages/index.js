// pages/index.js
import { useState, useEffect } from 'react';

export default function Home() {
  const [form, setForm] = useState({
    nombre: '',
    edad: '',
    ingles: '',
    occupation: '',
    overseasExp: '',
    australianExp: ''
  });
  const [occupations, setOccupations] = useState([]);
  const [loadingOcc, setLoadingOcc] = useState(true);
  const [errorOcc, setErrorOcc] = useState(null);

  const [points, setPoints] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [pathways, setPathways] = useState(null);
  const [error, setError] = useState(null);

  // Carga de ocupaciones
  useEffect(() => {
    fetch('/api/occupations')
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => setOccupations(data))
      .catch(err => setErrorOcc(err.toString()))
      .finally(() => setLoadingOcc(false));
  }, []);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setPoints(null);
    setBreakdown(null);
    setPathways(null);

    try {
      const res = await fetch('/api/pathways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

      setPoints(json.points);
      setBreakdown(json.breakdown);
      setPathways(json.pathways);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Evaluación de Elegibilidad</h1>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className="block font-medium">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>

          {/* Edad */}
          <div>
            <label htmlFor="edad" className="block font-medium">Edad</label>
            <input
              id="edad"
              type="number"
              min="0"
              value={form.edad}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>

          {/* Nivel de Inglés */}
          <div>
            <label htmlFor="ingles" className="block font-medium">Nivel de inglés</label>
            <select
              id="ingles"
              value={form.ingles}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            >
              <option value="">-- Selecciona --</option>
              <option value="Competent">Competent</option>
              <option value="Proficient">Proficient</option>
              <option value="Superior">Superior</option>
            </select>
          </div>

          {/* Ocupación */}
          <div>
            <label htmlFor="occupation" className="block font-medium">Ocupación</label>
            {loadingOcc ? (
              <p>Cargando ocupaciones…</p>
            ) : errorOcc ? (
              <p className="text-red-600">Error: {errorOcc}</p>
            ) : (
              <select
                id="occupation"
                value={form.occupation}
                onChange={handleChange}
                className="w-full border rounded px-2 py-1"
                required
              >
                <option value="">-- Selecciona --</option>
                {occupations.map(o => (
                  <option key={o.occupationId} value={o.occupationId}>
                    {o.occupationId} – {o.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Overseas Skilled Employment */}
          <div>
            <label htmlFor="overseasExp" className="block font-medium">Años experiencia en el extranjero</label>
            <input
              id="overseasExp"
              type="number"
              min="0"
              value={form.overseasExp}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>

          {/* Australian Skilled Employment */}
          <div>
            <label htmlFor="australianExp" className="block font-medium">Años experiencia en Australia</label>
            <input
              id="australianExp"
              type="number"
              min="0"
              value={form.australianExp}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Calcular
          </button>
        </form>

        {/* Error */}
        {error && <p className="mt-4 text-red-600">{error}</p>}

        {/* Breakdown de puntos */}
        {points !== null && breakdown && (
          <div className="mt-4">
            <p className="font-medium">Total puntos: <strong>{points}</strong></p>
            <ul className="list-disc list-inside ml-4 mt-2 text-gray-700">
              <li>Edad: {breakdown.age} puntos</li>
              <li>Inglés: {breakdown.english} puntos</li>
              <li>Experiencia extranjero: {breakdown.overseas} puntos</li>
              <li>Experiencia Australia: {breakdown.australian} puntos</li>
            </ul>
          </div>
        )}

        {/* Pathways sugeridos */}
        {pathways && (
          <div className="mt-4">
            <h2 className="font-semibold mb-2">Pathways sugeridos:</h2>
            {pathways.length > 0 ? (
              <ul className="list-disc list-inside">
                {pathways.map(p => (
                  <li key={p.code}>{p.code} – {p.description} (Requiere {p.requiredPoints} puntos)</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 italic mt-2">No se encontraron pathways con tus datos.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}