import { create } from 'zustand';

interface SidebarState {
  /**
   * The user's explicit choice from the collapse button. `null` means automatic:
   * the sidebar folds to icons below 1280px wide.
   */
  collapsedPref: boolean | null;
  isMobileOpen: boolean;
  isProfileOpen: boolean;
  setCollapsedPref: (val: boolean) => void;
  toggleMobileSidebar: () => void;
  closeMobile: () => void;
  openProfile: () => void;
  closeProfile: () => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  collapsedPref: null,
  isMobileOpen: false,
  isProfileOpen: false,

  setCollapsedPref(val) {
    set({ collapsedPref: val });
  },

  toggleMobileSidebar() {
    set({ isMobileOpen: !get().isMobileOpen });
  },

  closeMobile() {
    set({ isMobileOpen: false });
  },

  openProfile() {
    set({ isProfileOpen: true, isMobileOpen: false });
  },

  closeProfile() {
    set({ isProfileOpen: false });
  },
}));
