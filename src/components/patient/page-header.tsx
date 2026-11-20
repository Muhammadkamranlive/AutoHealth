export function PatientPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-medical-950 sm:text-3xl dark:text-white">{title}</h1>
      {description && <p className="mt-1 text-slate-600 dark:text-slate-400">{description}</p>}
    </div>
  );
}
