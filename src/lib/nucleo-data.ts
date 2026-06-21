export type RiskLevel = "low" | "med" | "high";
export type ProjectStatus = "andamento" | "planejamento" | "bloqueado" | "concluido";

export interface Checkpoint {
  id: string;
  label: string;
  done: boolean;
}

export interface ScopeItem {
  id: string;
  text: string;
  bucket: "v01" | "v02" | "fora";
}

export interface Dependency {
  id: string;
  who: string;
  what: string;
  waitingDays: number;
}

export interface Evidence {
  id: string;
  label: string;
  when: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  emoji: string;
  color: "cyan" | "violet" | "amber" | "emerald" | "rose" | "sky";
  status: ProjectStatus;
  risk: RiskLevel;
  progress: number;
  scopePercent: number;
  isPrimary?: boolean;
  currentState: string;
  destination: string;
  currentMission: string;
  nextAction: string;
  completionCriteria: string;
  scope: ScopeItem[];
  dependencies: Dependency[];
  evidence: Evidence[];
  alerts: string[];
  checkpoints: Checkpoint[];
}

export interface WaitingItem {
  id: string;
  source: string;
  topic: string;
  days: number;
}

export interface Victory {
  id: string;
  text: string;
  when: string;
}

export interface DashboardStats {
  focusStreak: number;
  xpCurrent: number;
  xpTotal: number;
  level: number;
  checkpointsDone: number;
  checkpointsTotal: number;
  portalV02: number;
}

export interface TodayMission {
  sectionTitle: string;
  mission: string;
  projectTag: string;
  nextAction: string;
  cta: string;
  suggestedTime: string;
  progress: number;
  completionChecklist: string[];
  deliveryDate: string;
}

export interface MissionJourneyStep {
  id: string;
  label: string;
  state: "done" | "active" | "blocked";
}

export interface ScopeTerritory {
  id: string;
  projectId?: string;
  name: string;
  subtitle: string;
  progress: number;
  status: "No Trilho" | "Em Progresso" | "Atenção" | "Bloqueado" | "Concluído";
  tone: "cyan" | "violet" | "amber" | "emerald" | "rose";
  position: "north" | "east" | "south" | "west" | "center";
}

export interface BossItem {
  id: string;
  title: string;
  detail: string;
  due: string;
  priority: "Alta" | "Média";
}

export interface RiskRadar {
  headline: string;
  items: string[];
}

export interface MentalEnergy {
  value: number;
  status: string;
  note: string;
  trend: number[];
}

export interface FocusToday {
  duration: string;
  cta: string;
  route: string;
}

export interface OperationalCards {
  doNotToday: string[];
  waitingThirdParties: Array<{ id: string; source: string; topic: string; days: string }>;
  deliveryV01: {
    title: string;
    due: string;
    progress: string;
  };
  recentVictories: Victory[];
}

export const owner = {
  name: "Anibal",
  mode: "Modo Foco Ativo",
  focusToday: 92,
  focusTime: "07:45:12",
  streak: 12,
  xp: 4280,
  xpNextLevel: 5000,
  level: 14,
  energy: 78,
};

export const dashboardStats: DashboardStats = {
  focusStreak: 14,
  xpCurrent: 3420,
  xpTotal: 5000,
  level: 24,
  checkpointsDone: 7,
  checkpointsTotal: 10,
  portalV02: 62,
};

export const todayMission: TodayMission = {
  sectionTitle: "Missão Principal do Dia",
  mission: "Revisar versão V01 do Relatório de Impacto Regulatório",
  projectTag: "Projeto: Parecer Técnico SEPLAN",
  nextAction: "Abrir a última versão e revisar seção 3.2 - Análise de Impacto",
  cta: "Iniciar Agora",
  suggestedTime: "90 min",
  progress: 48,
  completionChecklist: [
    "Seção 3.2 revisada",
    "Análise alinhada com jurídico",
    "Referências validadas",
    "Versão enviada ao orientador",
  ],
  deliveryDate: "21 JUN 2026",
};

export const missionJourney: MissionJourneyStep[] = [
  { id: "received", label: "Recebido", state: "done" },
  { id: "analysis", label: "Análise Inicial", state: "done" },
  { id: "review", label: "Revisão & Ajustes", state: "active" },
  { id: "legal", label: "Validação Jurídica", state: "blocked" },
  { id: "approval", label: "Aprovação Final", state: "blocked" },
  { id: "archive", label: "Entrega & Arquivo", state: "blocked" },
];

export const scopeTerritories: ScopeTerritory[] = [
  {
    id: "seplan-parecer",
    projectId: "seplan-ia",
    name: "SEPLAN IA",
    subtitle: "Parecer Técnico",
    progress: 72,
    status: "No Trilho",
    tone: "cyan",
    position: "center",
  },
  {
    id: "agenda-rotina",
    projectId: "agenda-tdah",
    name: "Agenda TDAH",
    subtitle: "Rotina e Organização",
    progress: 48,
    status: "Em Progresso",
    tone: "violet",
    position: "west",
  },
  {
    id: "docs-oficiais",
    projectId: "docs-seplan",
    name: "Documentos Oficiais",
    subtitle: "Padronização",
    progress: 70,
    status: "No Trilho",
    tone: "amber",
    position: "north",
  },
  {
    id: "bases-dados",
    projectId: "bases-dashboards",
    name: "Bases & Dashboards",
    subtitle: "Dados Estratégicos",
    progress: 55,
    status: "Atenção",
    tone: "emerald",
    position: "east",
  },
  {
    id: "portal-v02",
    projectId: "seplan-ia",
    name: "Portal V02",
    subtitle: "Integração & Entrega",
    progress: 62,
    status: "Em Progresso",
    tone: "violet",
    position: "south",
  },
];

export const bossItems: BossItem[] = [
  {
    id: "oficio-0241",
    title: "Ofício 0241/2026",
    detail: "PAV. Beira Mar 3",
    due: "Hoje 16:00",
    priority: "Alta",
  },
  {
    id: "rir",
    title: "Relatório de Impacto Regulatório",
    detail: "Revisão V01",
    due: "Amanhã 09:00",
    priority: "Alta",
  },
  {
    id: "manuais",
    title: "Atualização de Manuais Operacionais",
    detail: "Padronização interna",
    due: "23/06/2026",
    priority: "Média",
  },
];

export const riskRadar: RiskRadar = {
  headline: "Radar de Risco",
  items: [
    "2 prazos críticos nas próximas 24h",
    "1 entrega sem responsável definido",
    "3 projetos com risco de atraso",
  ],
};

export const mentalEnergy: MentalEnergy = {
  value: 78,
  status: "Alta",
  note: "Excelente para foco profundo. Melhor horário: 09:00 - 11:30.",
  trend: [48, 56, 62, 70, 78, 74, 82],
};

export const focusToday: FocusToday = {
  duration: "3h30m",
  cta: "Iniciar Modo Foco",
  route: "/foco",
};

export const operationalCards: OperationalCards = {
  doNotToday: [
    "Não ajustar detalhes visuais",
    "Não iniciar integrações externas",
    "Não responder e-mails não urgentes",
    "Não criar novas automações",
  ],
  waitingThirdParties: [
    { id: "afc", source: "Dados da AFC", topic: "Auditoria Fiscal", days: "1 dia" },
    { id: "juridico", source: "Parecer Jurídico", topic: "SEPLAN Ofício", days: "3 dias" },
  ],
  deliveryV01: {
    title: "Relatório de Impacto Regulatório",
    due: "Entrega até 21 JUN 2026",
    progress: "2 de 5 entregáveis concluídos",
  },
  recentVictories: [
    { id: "secao-21", text: "Seção 2.1 concluída", when: "Hoje" },
    { id: "refs", text: "Referências atualizadas", when: "Ontem" },
    { id: "juridico", text: "Reunião com jurídico realizada", when: "Ontem" },
  ],
};

export const projects: Project[] = [
  {
    id: "seplan-ia",
    code: "01",
    name: "SEPLAN IA",
    emoji: "◈",
    color: "cyan",
    status: "andamento",
    risk: "med",
    progress: 68,
    scopePercent: 68,
    isPrimary: true,
    currentState: "Escopo espalhado entre atendimento público, análise técnica e pipeline documental.",
    destination: "MVP de triagem e orientação preliminar da SEPLAN, sem substituir análise técnica.",
    currentMission: "Congelar escopo V01",
    nextAction: "Separar V01, V02 e Fora do Escopo",
    completionCriteria: "Documento de escopo V01 assinado + 3 fluxos de triagem mapeados.",
    scope: [
      { id: "s1", text: "Triagem inicial de demandas públicas", bucket: "v01" },
      { id: "s2", text: "Orientação preliminar automática", bucket: "v01" },
      { id: "s3", text: "Roteamento para área técnica", bucket: "v01" },
      { id: "s4", text: "Análise técnica completa", bucket: "fora" },
      { id: "s5", text: "Relatórios gerenciais avançados", bucket: "v02" },
      { id: "s6", text: "App mobile SEPLAN", bucket: "v02" },
      { id: "s7", text: "Integração Power BI", bucket: "v02" },
      { id: "s8", text: "Módulo de IA Generativa", bucket: "v02" },
      { id: "s9", text: "Automação de notificações", bucket: "v02" },
    ],
    dependencies: [
      { id: "d1", who: "TI - Infraestrutura", what: "Acesso aos ambientes", waitingDays: 3 },
      { id: "d2", who: "Procuradoria Geral", what: "Validação de minuta", waitingDays: 1 },
    ],
    evidence: [
      { id: "e1", label: "Estrutura do Escopo V01 validada", when: "Hoje" },
      { id: "e2", label: "Documentos padronizados criados", when: "Ontem" },
    ],
    alerts: ["Risco de virar projeto infinito", "Muitas frentes em paralelo"],
    checkpoints: [
      { id: "c1", label: "Congelar escopo V01", done: false },
      { id: "c2", label: "Separar V01 / V02 / Fora", done: false },
      { id: "c3", label: "Validar fronteiras e dependências", done: false },
      { id: "c4", label: "Aprovação interna", done: false },
    ],
  },
  {
    id: "agenda-tdah",
    code: "02",
    name: "Agenda TDAH",
    emoji: "◉",
    color: "violet",
    status: "andamento",
    risk: "low",
    progress: 55,
    scopePercent: 55,
    currentState: "Estrutura de rotina diária em construção.",
    destination: "Sistema pessoal de foco e ritmo sustentável.",
    currentMission: "Definir blocos de foco diários",
    nextAction: "Mapear horários de pico cognitivo",
    completionCriteria: "Rotina semanal validada por 14 dias.",
    scope: [
      { id: "s1", text: "Blocos de foco diários", bucket: "v01" },
      { id: "s2", text: "Rituais de transição", bucket: "v01" },
      { id: "s3", text: "Integração com calendário", bucket: "v02" },
    ],
    dependencies: [],
    evidence: [{ id: "e1", label: "Rotina piloto iniciada", when: "Esta semana" }],
    alerts: [],
    checkpoints: [
      { id: "c1", label: "Mapear picos cognitivos", done: true },
      { id: "c2", label: "Definir blocos", done: false },
      { id: "c3", label: "Testar por 14 dias", done: false },
    ],
  },
  {
    id: "respostas-mp",
    code: "03",
    name: "Respostas MP/Procuradoria",
    emoji: "◊",
    color: "amber",
    status: "andamento",
    risk: "high",
    progress: 45,
    scopePercent: 45,
    currentState: "Pendências críticas com dependências externas.",
    destination: "Pipeline de resposta com SLA definido.",
    currentMission: "Responder MPCE - 2ª Promotoria",
    nextAction: "Consolidar parecer técnico",
    completionCriteria: "Resposta protocolada com evidências anexas.",
    scope: [
      { id: "s1", text: "Resposta MPCE 2ª Promotoria", bucket: "v01" },
      { id: "s2", text: "Resposta Procuradoria Geral", bucket: "v01" },
    ],
    dependencies: [
      { id: "d1", who: "MPCE - 2ª Promotoria", what: "Resposta sobre parecer técnico", waitingDays: 2 },
    ],
    evidence: [],
    alerts: ["Dependências externas críticas", "Risco alto de atraso"],
    checkpoints: [
      { id: "c1", label: "Consolidar parecer", done: false },
      { id: "c2", label: "Revisar minuta", done: false },
      { id: "c3", label: "Protocolar", done: false },
    ],
  },
  {
    id: "docs-seplan",
    code: "04",
    name: "Documentos Oficiais SEPLAN",
    emoji: "▣",
    color: "sky",
    status: "andamento",
    risk: "med",
    progress: 62,
    scopePercent: 62,
    currentState: "Validações pendentes em série.",
    destination: "Biblioteca documental padronizada.",
    currentMission: "Validar documentos pendentes",
    nextAction: "Revisar minuta de portaria",
    completionCriteria: "Todos documentos com versão final aprovada.",
    scope: [
      { id: "s1", text: "Padronização de modelos", bucket: "v01" },
      { id: "s2", text: "Validação interna", bucket: "v01" },
    ],
    dependencies: [
      { id: "d1", who: "Comunicação", what: "Aprovação de conteúdo", waitingDays: 1 },
    ],
    evidence: [{ id: "e1", label: "Fluxo de triagem desenhado", when: "Ontem" }],
    alerts: ["Validações pendentes"],
    checkpoints: [
      { id: "c1", label: "Revisar minuta", done: false },
      { id: "c2", label: "Validar com jurídico", done: false },
    ],
  },
  {
    id: "bases-dashboards",
    code: "05",
    name: "Bases SEPLAN & Dashboards",
    emoji: "▤",
    color: "emerald",
    status: "andamento",
    risk: "low",
    progress: 70,
    scopePercent: 70,
    currentState: "Dashboards em produção, refinamentos em curso.",
    destination: "Camada analítica unificada.",
    currentMission: "Refinar dashboards prioritários",
    nextAction: "Validar métricas com gestão",
    completionCriteria: "5 dashboards em uso ativo.",
    scope: [
      { id: "s1", text: "Base unificada", bucket: "v01" },
      { id: "s2", text: "Dashboard executivo", bucket: "v01" },
    ],
    dependencies: [],
    evidence: [{ id: "e1", label: "Reunião de alinhamento realizada", when: "2 dias atrás" }],
    alerts: [],
    checkpoints: [
      { id: "c1", label: "Validar métricas", done: false },
      { id: "c2", label: "Publicar v1", done: false },
    ],
  },
  {
    id: "engenharia",
    code: "06",
    name: "Projetos Particulares de Engenharia",
    emoji: "◬",
    color: "rose",
    status: "planejamento",
    risk: "med",
    progress: 40,
    scopePercent: 40,
    currentState: "Planejamento inicial em curso.",
    destination: "Pipeline pessoal de projetos pagos.",
    currentMission: "Definir prioridades do trimestre",
    nextAction: "Listar projetos em backlog",
    completionCriteria: "Plano trimestral aprovado.",
    scope: [{ id: "s1", text: "Backlog pessoal", bucket: "v01" }],
    dependencies: [],
    evidence: [],
    alerts: [],
    checkpoints: [{ id: "c1", label: "Listar backlog", done: false }],
  },
  {
    id: "estudos",
    code: "07",
    name: "Estudos e Capacitação",
    emoji: "◆",
    color: "violet",
    status: "planejamento",
    risk: "low",
    progress: 35,
    scopePercent: 35,
    currentState: "Trilha de estudos sendo desenhada.",
    destination: "Programa pessoal de evolução técnica.",
    currentMission: "Selecionar trilha do mês",
    nextAction: "Reservar 2h/dia para estudo",
    completionCriteria: "1 trilha concluída por mês.",
    scope: [{ id: "s1", text: "Trilha de IA aplicada", bucket: "v01" }],
    dependencies: [],
    evidence: [],
    alerts: [],
    checkpoints: [{ id: "c1", label: "Selecionar curso", done: false }],
  },
];

export const waiting: WaitingItem[] = [
  { id: "w1", source: "MPCE - 2ª Promotoria", topic: "Resposta sobre parecer técnico", days: 2 },
  { id: "w2", source: "Procuradoria Geral", topic: "Validação de minuta", days: 1 },
  { id: "w3", source: "TI - Infraestrutura", topic: "Acesso aos ambientes", days: 3 },
  { id: "w4", source: "Comunicação", topic: "Aprovação de conteúdo", days: 1 },
];

export const victories: Victory[] = [
  { id: "v1", text: "Estrutura do Escopo V01 validada", when: "Hoje" },
  { id: "v2", text: "Documentos padronizados criados", when: "Ontem" },
  { id: "v3", text: "Fluxo de triagem desenhado", when: "Ontem" },
  { id: "v4", text: "Reunião de alinhamento realizada", when: "2 dias atrás" },
];

export const doNotToday: string[] = [
  "Não abrir novas frentes — foque no que já foi iniciado",
  "Não refinar detalhes — evite perfeccionismo",
  "Não responder fora do fluxo — deixe para o horário certo",
  "Não aceitar reuniões não planejadas",
];

export const primaryProject = projects.find((p) => p.isPrimary)!;

export const overallProgress = Math.round(
  projects.reduce((s, p) => s + p.progress, 0) / projects.length,
);
export const scopeAttended = Math.round(
  projects.reduce((s, p) => s + p.scopePercent, 0) / projects.length,
);

export const colorToken: Record<Project["color"], string> = {
  cyan: "var(--cyan)",
  violet: "var(--violet)",
  amber: "var(--amber)",
  emerald: "var(--emerald)",
  rose: "var(--rose)",
  sky: "var(--sky)",
};

export const riskLabel: Record<RiskLevel, string> = {
  low: "Baixo",
  med: "Médio",
  high: "Alto",
};

export const statusLabel: Record<ProjectStatus, string> = {
  andamento: "Em andamento",
  planejamento: "Planejamento",
  bloqueado: "Bloqueado",
  concluido: "Concluído",
};
