import { create } from 'zustand';

/** The organization a super admin is currently looking at, shared across pages. */
interface ScopeState {
  orgId: string;
  setOrgId: (orgId: string) => void;
}

export const useScopeStore = create<ScopeState>((set) => ({
  orgId: '',
  setOrgId(orgId) {
    set({ orgId });
  },
}));
