// components/VisaPanel.tsx
// Renderiza cada visa (campo booleano en `Occupation`) y despliega elegibilidad estatal si aplica
import React from 'react';
import { Disclosure } from '@headlessui/react';
import { StateEligibility } from './StateEligibility';

type VisaFlag = { code: string; enabled: boolean };

type StateFactor = { state: string; pathway: string | null; requisito: string; valor: string };

export function VisaPanel({
  visa,
  stateFactors,
}: {
  visa: VisaFlag;
  stateFactors: StateFactor[];
}) {
  if (!visa.enabled) return null;
  return (
    <Disclosure>
      {({ open }) => (
        <div className="mb-2 bg-white rounded-2xl shadow">
          <Disclosure.Button className="w-full text-left p-4">
            <span className="font-medium">Visa {visa.code}</span>
          </Disclosure.Button>
          <Disclosure.Panel className="p-4 border-t">
            {/* Aquí podrás listar requisitos generales si los tienes definidos */}
            {visa.code.startsWith('491') && (
              <StateEligibility stateFactors={stateFactors} />
            )}
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
}