import { createFileRoute } from "@tanstack/react-router";
import { RPGJourneyView } from "@/components/nucleo/RPGJourney";

export const Route = createFileRoute("/jornada")({
  head: () => ({
    meta: [
      { title: "Jornada RPG · Núcleo de Projetos" },
      { name: "description", content: "Modo imersivo de missões, checkpoints e progressão pessoal." },
    ],
  }),
  component: () => <RPGJourneyView />,
});
