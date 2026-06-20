import { createFileRoute } from "@tanstack/react-router";
import { StrategicMapView } from "@/components/nucleo/StrategicMap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mapa Estratégico · Núcleo de Projetos" },
      { name: "description", content: "Visão geral de comando para decidir com clareza e agir com foco." },
    ],
  }),
  component: () => <StrategicMapView />,
});
