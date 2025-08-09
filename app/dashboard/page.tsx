// app/dashboard/page.tsx
import DecisionDiagramContainer from "@/features/decision-graph/ui/DecisionDiagramContainer";

export default function DashboardPage() {
  const mockProfile = {
    occupationCode: "2613",
    age: 32,
    englishLevel: "Proficient",
    yearsExperience: 6,
    statePreference: "NSW",
  } as const;

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Decision Graph</h1>
      <DecisionDiagramContainer profile={mockProfile} />
    </main>
  );
}