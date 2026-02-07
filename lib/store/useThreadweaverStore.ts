import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  SessionState,
  TimelineThread,
  TimelineNode,
  MetricsState,
  UIState,
} from '../types';
import { INITIAL_METRICS } from '../types';

interface ThreadweaverStore extends SessionState {
  // UI State
  uiState: UIState;

  // Actions - Session Management
  createSession: (scenario: string) => void;
  loadSession: (sessionId: string) => void;

  // Actions - Thread Management
  setActiveThread: (threadId: string) => void;
  createThread: (label: string, color: TimelineThread['color'], parentThreadId?: string, branchPoint?: number) => void;
  deleteThread: (threadId: string) => void;

  // Actions - Node Management
  addNode: (threadId: string, node: TimelineNode) => void;
  updateNode: (threadId: string, nodeId: string, updates: Partial<TimelineNode>) => void;

  // Actions - Time Travel
  jumpToStep: (step: number) => void;
  rewindToStep: (step: number) => void;

  // Actions - Autopilot
  toggleAutopilot: () => void;

  // Actions - UI State
  setShowDecisionModal: (show: boolean) => void;
  setShowCompareView: (show: boolean) => void;
  setShowNodeDetails: (show: boolean, step?: number) => void;
  setSelectedCompareThreads: (threads: [string | null, string | null]) => void;
  setHoveredNode: (nodeId: string | null) => void;
  toggleExpandedExplanation: (nodeId: string) => void;

  // Computed Values
  getActiveThread: () => TimelineThread | undefined;
  getCurrentMetrics: () => MetricsState;
  getThreadById: (threadId: string) => TimelineThread | undefined;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const createInitialThread = (): TimelineThread => ({
  id: generateId(),
  label: 'Baseline Timeline',
  color: 'gold',
  nodes: [
    {
      id: generateId(),
      step: 0,
      timestamp: Date.now(),
      cardId: 'initial',
      metricsAfter: INITIAL_METRICS,
      explanation: 'Starting point: Campus Dining sustainability journey begins.',
      businessState: 'Your campus dining operation serves 5,000+ students daily across three dining halls. Currently running traditional operations with standard food service practices. The business is stable but facing growing pressure from students and administration to improve sustainability practices. Food waste, carbon emissions, and operational costs are at baseline industry levels. This is your starting point—where will you take the business from here?',
    },
  ],
  createdAt: Date.now(),
});

export const useThreadweaverStore = create<ThreadweaverStore>()(
  persist(
    (set, get) => ({
      // Initial State
      sessionId: generateId(),
      scenario: 'Campus Dining / Restaurant Group',
      threads: [createInitialThread()],
      activeThreadId: '',
      currentStep: 0,
      autopilotEnabled: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),

      uiState: {
        showDecisionModal: false,
        showCompareView: false,
        showNodeDetails: false,
        selectedNodeStep: null,
        selectedCompareThreads: [null, null],
        hoveredNode: null,
        expandedExplanations: new Set<string>(),
      },

      // Session Management
      createSession: (scenario: string) => {
        const initialThread = createInitialThread();
        set({
          sessionId: generateId(),
          scenario,
          threads: [initialThread],
          activeThreadId: initialThread.id,
          currentStep: 0,
          autopilotEnabled: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          uiState: {
            showDecisionModal: false,
            showCompareView: false,
            showNodeDetails: false,
            selectedNodeStep: null,
            selectedCompareThreads: [null, null],
            hoveredNode: null,
            expandedExplanations: new Set<string>(),
          },
        });
      },

      loadSession: (sessionId: string) => {
        // In a real app, this would load from API/DB
        console.log('Loading session:', sessionId);
      },

      // Thread Management
      setActiveThread: (threadId: string) => {
        set((state) => {
          const thread = state.threads.find((t) => t.id === threadId);
          if (!thread) return state;

          return {
            activeThreadId: threadId,
            currentStep: Math.max(0, thread.nodes.length - 1),
            updatedAt: Date.now(),
          };
        });
      },

      createThread: (label: string, color: TimelineThread['color'], parentThreadId?: string, branchPoint?: number) => {
        set((state) => {
          const newThread: TimelineThread = {
            id: generateId(),
            label,
            color,
            nodes: [],
            createdAt: Date.now(),
            parentThreadId,
            branchPoint,
          };

          // If branching from a parent, copy nodes up to branch point
          if (parentThreadId && branchPoint !== undefined) {
            const parentThread = state.threads.find((t) => t.id === parentThreadId);
            if (parentThread) {
              newThread.nodes = parentThread.nodes
                .filter((n) => n.step <= branchPoint)
                .map((n) => ({ ...n, id: generateId() })); // New IDs for copied nodes
            }
          }

          return {
            threads: [...state.threads, newThread],
            activeThreadId: newThread.id,
            currentStep: Math.max(0, newThread.nodes.length - 1),
            updatedAt: Date.now(),
          };
        });
      },

      deleteThread: (threadId: string) => {
        set((state) => {
          const filteredThreads = state.threads.filter((t) => t.id !== threadId);

          // If deleting active thread, switch to first thread
          const newActiveThreadId = state.activeThreadId === threadId
            ? filteredThreads[0]?.id || ''
            : state.activeThreadId;

          return {
            threads: filteredThreads,
            activeThreadId: newActiveThreadId,
            updatedAt: Date.now(),
          };
        });
      },

      // Node Management
      addNode: (threadId: string, node: TimelineNode) => {
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? { ...thread, nodes: [...thread.nodes, node] }
              : thread
          ),
          currentStep: node.step,
          updatedAt: Date.now(),
        }));
      },

      updateNode: (threadId: string, nodeId: string, updates: Partial<TimelineNode>) => {
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  nodes: thread.nodes.map((node) =>
                    node.id === nodeId ? { ...node, ...updates } : node
                  ),
                }
              : thread
          ),
          updatedAt: Date.now(),
        }));
      },

      // Time Travel
      jumpToStep: (step: number) => {
        set({
          currentStep: Math.min(Math.max(0, step), 10),
          updatedAt: Date.now(),
        });
      },

      rewindToStep: (step: number) => {
        set({
          currentStep: Math.min(Math.max(0, step), 10),
          uiState: {
            ...get().uiState,
            showDecisionModal: true, // Open decision modal to allow reweaving
          },
          updatedAt: Date.now(),
        });
      },

      // Autopilot
      toggleAutopilot: () => {
        set((state) => ({
          autopilotEnabled: !state.autopilotEnabled,
          updatedAt: Date.now(),
        }));
      },

      // UI State
      setShowDecisionModal: (show: boolean) => {
        set((state) => ({
          uiState: { ...state.uiState, showDecisionModal: show },
        }));
      },

      setShowCompareView: (show: boolean) => {
        set((state) => ({
          uiState: { ...state.uiState, showCompareView: show },
        }));
      },

      setShowNodeDetails: (show: boolean, step?: number) => {
        set((state) => ({
          uiState: {
            ...state.uiState,
            showNodeDetails: show,
            selectedNodeStep: show && step !== undefined ? step : null,
          },
        }));
      },

      setSelectedCompareThreads: (threads: [string | null, string | null]) => {
        set((state) => ({
          uiState: { ...state.uiState, selectedCompareThreads: threads },
        }));
      },

      setHoveredNode: (nodeId: string | null) => {
        set((state) => ({
          uiState: { ...state.uiState, hoveredNode: nodeId },
        }));
      },

      toggleExpandedExplanation: (nodeId: string) => {
        set((state) => {
          const newSet = new Set(state.uiState.expandedExplanations);
          if (newSet.has(nodeId)) {
            newSet.delete(nodeId);
          } else {
            newSet.add(nodeId);
          }
          return {
            uiState: { ...state.uiState, expandedExplanations: newSet },
          };
        });
      },

      // Computed Values
      getActiveThread: () => {
        const state = get();
        return state.threads.find((t) => t.id === state.activeThreadId);
      },

      getCurrentMetrics: () => {
        const state = get();
        const activeThread = state.threads.find((t) => t.id === state.activeThreadId);
        if (!activeThread || activeThread.nodes.length === 0) {
          return INITIAL_METRICS;
        }

        // Get metrics from the node at currentStep
        const currentNode = activeThread.nodes.find((n) => n.step === state.currentStep);
        return currentNode?.metricsAfter || INITIAL_METRICS;
      },

      getThreadById: (threadId: string) => {
        return get().threads.find((t) => t.id === threadId);
      },
    }),
    {
      name: 'threadweaver-storage',
      partialize: (state) => ({
        sessionId: state.sessionId,
        scenario: state.scenario,
        threads: state.threads,
        activeThreadId: state.activeThreadId,
        currentStep: state.currentStep,
        autopilotEnabled: state.autopilotEnabled,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
        // Don't persist UI state
      }),
    }
  )
);

// Initialize active thread on first load
const store = useThreadweaverStore.getState();
if (!store.activeThreadId && store.threads.length > 0) {
  useThreadweaverStore.setState({ activeThreadId: store.threads[0].id });
}
