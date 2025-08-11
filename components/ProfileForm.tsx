// components/ProfileForm.tsx
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import { Profile as ProfileModel } from "@prisma/client";

interface Occupation {
  occupationId: string;
  name: string;
}

export type ProfileFormProps = {
  initialProfile: ProfileModel | null;
};


export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    edad: initialProfile?.age.toString() ?? "",
    ingles: initialProfile?.englishLevel ?? "",
    occupation: initialProfile?.occupation ?? "",
    overseasExp: initialProfile?.workExperience_out.toString() ?? "",
    australianExp: initialProfile?.workExperience_in.toString() ?? "",
    eduQualification: initialProfile?.education_qualification ?? "",
    australianStudy: initialProfile?.study_requirement ?? "",
    regionalStudy: initialProfile?.regional_study ?? "",
    professionalYear: initialProfile?.professional_year ?? "",
    communityLanguage: initialProfile?.natti ?? "",
    partnerSkill: initialProfile?.partner ?? "",
    nominationType: initialProfile?.nomination_sponsorship ?? "",
  });

  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [loadingOcc, setLoadingOcc] = useState(true);
  const [errorOcc, setErrorOcc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/occupations")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => setOccupations(data))
      .catch((err) => setErrorOcc(String(err)))
      .finally(() => setLoadingOcc(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        age: Number(form.edad),
        occupation: form.occupation,
        englishLevel: form.ingles,
        workExperience_in: Number(form.australianExp),
        workExperience_out: Number(form.overseasExp),
        nationality: "",
        education_qualification: form.eduQualification,
        study_requirement: form.australianStudy,
        regional_study: form.regionalStudy,
        professional_year: form.professionalYear,
        natti: form.communityLanguage,
        partner: form.partnerSkill,
        nomination_sponsorship: form.nominationType,
      };
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      await res.json();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {initialProfile ? "Modificar perfil" : "Evaluación de elegibilidad"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Edad */}
          <div>
            <label htmlFor="edad" className="block font-medium">
              Edad
            </label>
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
          {/* Nivel de inglés */}
          <div>
            <label htmlFor="ingles" className="block font-medium">
              Nivel de inglés
            </label>
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
            <label htmlFor="occupation" className="block font-medium">
              Ocupación (ANZSCO Code)
            </label>
            {loadingOcc ? (
              <p>Cargando...</p>
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
                {occupations.map((o) => (
                  <option key={o.occupationId} value={o.occupationId}>
                    {o.occupationId} – {o.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {/* Experiencia fuera de AU */}
          <div>
            <label htmlFor="overseasExp" className="block font-medium">
              Años experiencia fuera de Australia
            </label>
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
          {/* Experiencia en AU */}
          <div>
            <label htmlFor="australianExp" className="block font-medium">
              Años experiencia en Australia
            </label>
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
          {/* Calificación educativa */}
          <div>
            <label htmlFor="eduQualification" className="block font-medium">
              Educational qualifications
            </label>
            <select
              id="eduQualification"
              value={form.eduQualification}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            >
              <option value="">-- Selecciona --</option>
              <option value="doctorate">Doctorate (20 points)</option>
              <option value="bachelor">Bachelor (15 points)</option>
              <option value="diploma">Diploma (10 points)</option>
              <option value="assessed">
                Assessed qualification (10 points)
              </option>
              <option value="none">No recognised (0 points)</option>
            </select>
          </div>
          {/* Requisito de estudios en AU */}
          <div>
            <label htmlFor="australianStudy" className="block font-medium">
              Australian study requirement met?
            </label>
            <select
              id="australianStudy"
              value={form.australianStudy}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            >
              <option value="">-- Selecciona --</option>
              <option value="yes">Yes (5 points)</option>
              <option value="no">No (0 points)</option>
            </select>
          </div>
          {/* Estudio regional */}
          <div>
            <label htmlFor="regionalStudy" className="block font-medium">
              Study in regional Australia?
            </label>
            <select
              id="regionalStudy"
              value={form.regionalStudy}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            >
              <option value="">-- Selecciona --</option>
              <option value="yes">Yes (5 points)</option>
              <option value="no">No (0 points)</option>
            </select>
          </div>

          {/* Año profesional */}
          <div>
            <label htmlFor="professionalYear" className="block font-medium">
              Professional Year in Australia?
            </label>
            <select
              id="professionalYear"
              value={form.professionalYear}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            >
              <option value="">-- Selecciona --</option>
              <option value="yes">Yes (5 points)</option>
              <option value="no">No (0 points)</option>
            </select>
          </div>

          {/* Idioma comunitario */}
          <div>
            <label htmlFor="communityLanguage" className="block font-medium">
              Credentialed community language?
            </label>
            <select
              id="communityLanguage"
              value={form.communityLanguage}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            >
              <option value="">-- Selecciona --</option>
              <option value="yes">Yes (5 points)</option>
              <option value="no">No (0 points)</option>
            </select>
          </div>

          {/* Partner skills */}
          <div>
            <label htmlFor="partnerSkill" className="block font-medium">
              Partner skills
            </label>
            <select
              id="partnerSkill"
              value={form.partnerSkill}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            >
              <option value="">-- Selecciona --</option>
              <option value="meets_all">
                Your partner meets all DOHA criteria (10 points)
              </option>
              <option value="competent_english">
                Your partner has at least competent english (5 points)
              </option>
              <option value="single_or_au_partner">
                You are single or AU_partner (10 points)
              </option>
            </select>
          </div>

          {/* Nominación/Patrocinio */}
          <div>
            <label htmlFor="nominationType" className="block font-medium">
              Nomination or sponsorship
            </label>
            <select
              id="nominationType"
              value={form.nominationType}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
              required
            >
              <option value="">-- Selecciona --</option>
              <option value="state">
                Invited by State/Territory (15 points)
              </option>
              <option value="family">
                Family sponsorship accepted (15 points)
              </option>
              <option value="none">No (0 points)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading
              ? "Guardando..."
              : initialProfile
                ? "Actualizar perfil"
                : "Calcular"}
          </button>
        </form>

        {/* Error global */}
        {errorOcc && (
          <p className="mt-4 text-red-600">Error ocupaciones: {errorOcc}</p>
        )}
        {error && <p className="mt-4 text-red-600">{error}</p>}
      </div>
    </div>
  );
}
