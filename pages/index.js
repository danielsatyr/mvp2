// pages/index.js
import { useState, useEffect } from 'react';

export default function Home() {
  const [form, setForm] = useState({
    nombre: '',
    edad: '',
    ingles: '',
    occupation: ''
  });
  const [occupations, setOccupations] = useState([]);
  const [loadingOcc, setLoadingOcc] = useState(true);
  const [errorOcc, setErrorOcc] = useState(null);
  const [pathways, setPathways] = useState(null);
  const [error, setError] = useState(null);

  // Fetch de ocupaciones al montar
  useEffect(() => {
    fetch('/api/occupations')
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => setOccupations(data))
      .catch(err => setErrorOcc(err.toString()))
      .finally(() => setLoadingOcc(false));
  }, []);

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.id]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/pathways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(res.status);
      const { pathways } = await res.json();
      setPathways(pathways);
    } catch {
      setError('Error al calcular los pathways');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <h1 className="text-xl font-bold mb-4">Evaluación de Elegibilidad</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
          {/* Edad */}
          <div>
            <label htmlFor="edad">Edad</label>
            <input
              id="edad"
              type="number"
              value={form.edad}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
          {/* Inglés */}
          <div>
            <label htmlFor="ingles">Nivel de inglés</label>
            <select
              id="ingles"
              value={form.ingles}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            >
              <option value="">--</option>
              <option value="Competent">Competent</option>
              <option value="Proficient">Proficient</option>
              <option value="Superior">Superior</option>
            </select>
          </div>
          {/* Ocupación */}
          <div>
            <label htmlFor="occupation">Ocupación</label>
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
                <option value="">Selecciona una opción</option>
                {occupations.map(o => (
                  <option key={o.occupationId} value={o.occupationId}>
                    {o.occupationId} – {o.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Calcular
          </button>
        </form>
        {error && <p className="mt-4 text-red-600">{error}</p>}
        {pathways && (
          <div className="mt-6">
            <h2 className="font-semibold mb-2">Pathways sugeridos:</h2>
            <ul className="list-disc list-inside">
              {pathways.map(p => (
                <li key={p.code}>
                  {p.code} – {p.description} (Requiere {p.requiredPoints} puntos)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}