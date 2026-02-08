import { z } from 'zod';

// ==================== Metrics & State ====================

export const MetricsStateSchema = z.object({
  waste: z.number().min(0).max(100),
  emissions: z.number().min(0).max(100),
  cost: z.number().min(0).max(100),
  efficiency: z.number().min(0).max(100),
  communityTrust: z.number().min(0).max(100),
  sustainabilityScore: z.number().min(0).max(100),
});

export type MetricsState = z.infer<typeof MetricsStateSchema>;

// ==================== Decision Cards ====================

export const DecisionOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  deltas: z.object({
    waste: z.number(),
    emissions: z.number(),
    cost: z.number(),
    efficiency: z.number(),
    communityTrust: z.number(),
  }),
  explanation: z.string(),
});

export type DecisionOption = z.infer<typeof DecisionOptionSchema>;

export const DecisionCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  prompt: z.string(),
  tags: z.array(z.enum(['waste', 'emissions', 'cost', 'efficiency', 'trust', 'policy'])),
  severity: z.enum(['easy', 'medium', 'hard']),
  triggers: z.object({
    waste_min: z.number().optional(),
    waste_max: z.number().optional(),
    emissions_min: z.number().optional(),
    emissions_max: z.number().optional(),
    cost_min: z.number().optional(),
    cost_max: z.number().optional(),
    efficiency_min: z.number().optional(),
    efficiency_max: z.number().optional(),
    trust_min: z.number().optional(),
    trust_max: z.number().optional(),
  }).optional(),
  options: z.array(DecisionOptionSchema).min(2).max(3),
});

export type DecisionCard = z.infer<typeof DecisionCardSchema>;

// ==================== Timeline & Threads ====================

export const TimelineNodeSchema = z.object({
  id: z.string(),
  step: z.number().min(0).max(10),
  timestamp: z.number(),
  cardId: z.string(),
  chosenOptionId: z.string().optional(),
  metricsAfter: MetricsStateSchema,
  explanation: z.string().optional(),
  businessState: z.string().optional(), // Narrative describing current business state
});

export type TimelineNode = z.infer<typeof TimelineNodeSchema>;

export const TimelineThreadSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.enum(['gold', 'emerald', 'cyan', 'purple']),
  nodes: z.array(TimelineNodeSchema),
  createdAt: z.number(),
  parentThreadId: z.string().optional(),
  branchPoint: z.number().optional(), // Step where this thread diverged
});

export type TimelineThread = z.infer<typeof TimelineThreadSchema>;

// ==================== Company Profile ====================

export const CompanyProfileSchema = z.object({
  companyName: z.string(),
  industry: z.string(),
  size: z.enum(['small', 'medium', 'large', 'enterprise']), // <50, 50-500, 500-5000, >5000 employees
  location: z.string().optional(),
  description: z.string().optional(),
  currentChallenges: z.array(z.string()).optional(),
  sustainabilityGoals: z.array(z.string()).optional(),
  customMetrics: z.object({
    wasteUnit: z.string().optional(), // e.g., "tons/month", "kg/day"
    emissionsUnit: z.string().optional(), // e.g., "tons CO2/year"
    costCurrency: z.string().optional(), // e.g., "USD", "EUR"
    operationalScale: z.string().optional(), // e.g., "5000 meals/day"
  }).optional(),
});

export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

// ==================== Session State ====================

export const SessionStateSchema = z.object({
  sessionId: z.string(),
  scenario: z.string(),
  companyProfile: CompanyProfileSchema.optional(),
  threads: z.array(TimelineThreadSchema),
  activeThreadId: z.string(),
  currentStep: z.number().min(0).max(10),
  autopilotEnabled: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type SessionState = z.infer<typeof SessionStateSchema>;

// ==================== API Request/Response Types ====================

export const GenerateDecisionRequestSchema = z.object({
  currentMetrics: MetricsStateSchema,
  usedCardIds: z.array(z.string()),
  step: z.number().min(0).max(10),
  seed: z.number().optional(),
});

export type GenerateDecisionRequest = z.infer<typeof GenerateDecisionRequestSchema>;

export const GenerateDecisionResponseSchema = z.object({
  card: DecisionCardSchema,
  rationale: z.string(),
  scoringDetails: z.object({
    topFactors: z.array(z.object({
      factor: z.string(),
      score: z.number(),
      reason: z.string(),
    })),
  }),
});

export type GenerateDecisionResponse = z.infer<typeof GenerateDecisionResponseSchema>;

export const ApplyDecisionRequestSchema = z.object({
  currentMetrics: MetricsStateSchema,
  cardId: z.string(),
  optionId: z.string(),
});

export type ApplyDecisionRequest = z.infer<typeof ApplyDecisionRequestSchema>;

export const ApplyDecisionResponseSchema = z.object({
  newMetrics: MetricsStateSchema,
  explanation: z.string(),
  businessState: z.string(), // Narrative describing the business state after this decision
});

export type ApplyDecisionResponse = z.infer<typeof ApplyDecisionResponseSchema>;

export const SimulateAutopilotRequestSchema = z.object({
  initialMetrics: MetricsStateSchema,
  steps: z.number().min(1).max(10),
  startStep: z.number().min(0).max(10).optional().default(1),
  usedCardIds: z.array(z.string()).optional().default([]),
  seed: z.number().optional(),
});

export type SimulateAutopilotRequest = z.infer<typeof SimulateAutopilotRequestSchema>;

export const SimulateAutopilotResponseSchema = z.object({
  nodes: z.array(TimelineNodeSchema),
  finalMetrics: MetricsStateSchema,
});

export type SimulateAutopilotResponse = z.infer<typeof SimulateAutopilotResponseSchema>;

// ==================== Custom Card Generation ====================

export const GenerateCustomCardsRequestSchema = z.object({
  companyProfile: CompanyProfileSchema,
  numberOfCards: z.number().min(5).max(30).default(10),
  focusAreas: z.array(z.string()).optional(), // e.g., ["waste", "emissions", "cost"]
});

export type GenerateCustomCardsRequest = z.infer<typeof GenerateCustomCardsRequestSchema>;

export const GenerateCustomCardsResponseSchema = z.object({
  cards: z.array(DecisionCardSchema),
  customizedMetrics: z.object({
    initialMetrics: MetricsStateSchema,
    scalingContext: z.string(), // Explanation of how metrics are scaled
  }),
});

export type GenerateCustomCardsResponse = z.infer<typeof GenerateCustomCardsResponseSchema>;

// ==================== Helper Types ====================

export type MetricKey = keyof Omit<MetricsState, 'sustainabilityScore'>;

export interface OracleInsight {
  summary: string;
  topDrivers: Array<{
    metric: MetricKey;
    change: number;
    reason: string;
  }>;
}

export interface ComparisonResult {
  threadAId: string;
  threadBId: string;
  metricDiffs: Partial<Record<MetricKey | 'sustainabilityScore', number>>;
  keyDivergences: Array<{
    step: number;
    cardId: string;
    threadAOption: string;
    threadBOption: string;
  }>;
}

// ==================== UI State Types ====================

export interface UIState {
  showDecisionModal: boolean;
  showCompareView: boolean;
  showNodeDetails: boolean;
  selectedNodeStep: number | null;
  selectedCompareThreads: [string | null, string | null];
  hoveredNode: string | null;
  expandedExplanations: Set<string>;
}

// ==================== Constants ====================

export const INITIAL_METRICS: MetricsState = {
  waste: 50,
  emissions: 50,
  cost: 50,
  efficiency: 50,
  communityTrust: 50,
  sustainabilityScore: 50,
};

export const METRIC_LABELS: Record<MetricKey | 'sustainabilityScore', string> = {
  waste: 'Waste',
  emissions: 'Emissions',
  cost: 'Cost',
  efficiency: 'Efficiency',
  communityTrust: 'Community Trust',
  sustainabilityScore: 'Sustainability Score',
};

export const METRIC_ICONS: Record<MetricKey | 'sustainabilityScore', string> = {
  waste: '🗑️',
  emissions: '💨',
  cost: '💰',
  efficiency: '⚡',
  communityTrust: '🤝',
  sustainabilityScore: '🌱',
};

export const TIME_MILESTONES = [
  { label: 'Now', step: 0 },
  { label: '3 months', step: 3 },
  { label: '6 months', step: 6 },
  { label: '12 months', step: 10 },
] as const;
