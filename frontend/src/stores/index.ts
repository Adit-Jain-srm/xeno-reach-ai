import { create } from 'zustand'

interface AgentState {
  sessionId: string | null
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    tool_calls?: any[]
    campaign_plan?: any
    timestamp: string
  }>
  isLoading: boolean
  setSessionId: (id: string) => void
  addMessage: (msg: AgentState['messages'][0]) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAgentStore = create<AgentState>((set) => ({
  sessionId: null,
  messages: [],
  isLoading: false,
  setSessionId: (id) => set({ sessionId: id }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set({ sessionId: null, messages: [], isLoading: false }),
}))

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
