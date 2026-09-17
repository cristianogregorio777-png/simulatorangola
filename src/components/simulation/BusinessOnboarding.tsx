"use client";

import { useMemo, useState } from "react";
import { MOCK_MUNICIPALITIES } from "@/data/municipalities.mock";
import { MOCK_PROVINCES } from "@/data/provinces.mock";
import { MOCK_COMMUNES, MOCK_NEIGHBORHOODS } from "@/data/neighborhoods.mock";
import type { BusinessCategory } from "@/types/geo";
import type { CreateBusinessInput } from "@/types/simulation";

interface BusinessOnboardingProps {
  selectedProvinceId: string | null;
  selectedMunicipalityId: string | null;
  onCreate: (input: CreateBusinessInput) => boolean;
}

const categories: Array<{ value: BusinessCategory; label: string }> = [
  { value: "retail", label: "Cantina / Comércio" },
  { value: "services", label: "Prestação de Serviços / TI" },
  { value: "food_and_beverage", label: "Restauração / Lanchonete" },
  { value: "technology", label: "Tecnologia" },
  { value: "logistics", label: "Logística / Transporte" },
];

export function BusinessOnboarding({ selectedProvinceId, selectedMunicipalityId, onCreate }: BusinessOnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BusinessCategory>("retail");
  const [capital, setCapital] = useState(200000);
  const [provinceId, setProvinceId] = useState(selectedProvinceId ?? "prov-luanda");
  const [municipalityId, setMunicipalityId] = useState(selectedMunicipalityId ?? "mun-luanda");
  const [zoneId, setZoneId] = useState("");
  const [targetAudience, setTargetAudience] = useState<CreateBusinessInput["targetAudience"]>("mid");
  const [error, setError] = useState("");
  const municipalities = useMemo(() => MOCK_MUNICIPALITIES.filter((item) => item.provinceId === provinceId), [provinceId]);
  const neighborhoods = useMemo(() => {
    const communeIds = new Set(MOCK_COMMUNES.filter((item) => item.municipalityId === municipalityId).map((item) => item.id));
    return MOCK_NEIGHBORHOODS.filter((item) => communeIds.has(item.communeId));
  }, [municipalityId]);

  const submit = () => {
    const province = MOCK_PROVINCES.find((item) => item.id === provinceId);
    const municipality = municipalities.find((item) => item.id === municipalityId) ?? municipalities[0];
    if (!name.trim() || capital < 20_000 || !province || !municipality) {
      setError("Preencha o nome, escolha uma localização e indique pelo menos 20.000 Kz de capital.");
      return;
    }
    const created = onCreate({ name: name.trim(), category, capitalAoa: capital, zoneId: zoneId || municipality.id, targetAudience });
    if (!created) setError("Não foi possível criar o negócio neste momento.");
  };

  return (
    <section className="mx-auto w-full max-w-3xl rounded-[8px] border border-white/10 bg-[#0b1116] p-6 shadow-2xl sm:p-8">
      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ochre">Novo negócio · etapa {step} de 3</p>
      <h1 className="mt-3 font-display text-3xl text-white">Vamos configurar a sua operação.</h1>
      <p className="mt-2 text-sm leading-6 text-sand-muted">Nada será iniciado até confirmar estes dados. O capital indicado será o caixa inicial real.</p>
      {step === 1 ? <div className="mt-7 space-y-4"><Field label="Nome da empresa"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Mercado Kwanza" className="control" /></Field><Field label="Ramo de atuação"><select value={category} onChange={(event) => setCategory(event.target.value as BusinessCategory)} className="control">{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field><button type="button" onClick={() => setStep(2)} className="primary">Continuar</button></div> : null}
      {step === 2 ? <div className="mt-7 space-y-4"><Field label="Capital inicial (Kz)"><input type="number" min="20000" step="10000" value={capital} onChange={(event) => setCapital(Number(event.target.value))} className="control" /></Field><Field label="Público-alvo e estratégia de preço"><select value={targetAudience} onChange={(event) => setTargetAudience(event.target.value as CreateBusinessInput["targetAudience"])} className="control"><option value="economic">Econômico</option><option value="mid">Médio</option><option value="premium">Premium</option></select></Field><div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="secondary">Voltar</button><button type="button" onClick={() => setStep(3)} className="primary">Continuar</button></div></div> : null}
      {step === 3 ? <div className="mt-7 space-y-4"><Field label="Província"><select value={provinceId} onChange={(event) => { setProvinceId(event.target.value); setMunicipalityId(""); setZoneId(""); }} className="control">{MOCK_PROVINCES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Município"><select value={municipalityId} onChange={(event) => { setMunicipalityId(event.target.value); setZoneId(""); }} className="control">{municipalities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>{neighborhoods.length ? <Field label="Bairro / zona"><select value={zoneId} onChange={(event) => setZoneId(event.target.value)} className="control"><option value="">Escolher zona</option>{neighborhoods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field> : null}<div className="flex gap-3"><button type="button" onClick={() => setStep(2)} className="secondary">Voltar</button><button type="button" onClick={submit} className="primary">Criar e iniciar simulação</button></div></div> : null}
      {error ? <p className="mt-4 text-sm text-red-200">{error}</p> : null}
      <style jsx>{`.control{width:100%;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#111a21;padding:.75rem;color:#eee8dc;outline:none}.control:focus{border-color:#c98a3c}.primary,.secondary{border-radius:8px;padding:.75rem 1rem;font-size:.875rem}.primary{background:rgba(201,138,60,.16);border:1px solid rgba(201,138,60,.55);color:#eee8dc}.secondary{border:1px solid rgba(255,255,255,.12);color:#aaa49a}`}</style>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.12em] text-sand-muted">{label}</span>{children}</label>; }