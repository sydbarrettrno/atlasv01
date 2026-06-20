import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/nucleo/Shell";
import { victories } from "@/lib/nucleo-data";
import { Archive, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/arquivo")({
  head: () => ({ meta: [{ title: "Arquivo · Núcleo" }] }),
  component: ArchivePage,
});

function ArchivePage() {
  return (
    <Shell>
      <div className="space-y-6">
        <header>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            <Archive className="h-3.5 w-3.5" /> Arquivo
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold">Memória de execução.</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tudo que foi concluído, organizado por timeline.</p>
        </header>

        <section className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
          {victories.map((v) => (
            <div key={v.id} className="relative mb-4">
              <span className="absolute -left-[18px] top-1 grid h-4 w-4 place-items-center rounded-full border border-[color:var(--emerald)] bg-background">
                <CheckCircle2 className="h-3 w-3 text-[color:var(--emerald)]" />
              </span>
              <div className="rounded-2xl border border-border bg-surface/60 p-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{v.when}</div>
                <div className="mt-0.5 text-sm font-semibold">{v.text}</div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </Shell>
  );
}
