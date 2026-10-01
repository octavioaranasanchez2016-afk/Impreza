import { FincaNav } from "@/components/admin/FincaNav";

export default function FincaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-ink">Finca</h1>
      <FincaNav />
      {children}
    </div>
  );
}
