// Modal Manager - Orchestrates component launching and modal display

import { useState, useCallback } from 'react';
import type { ModalConfig, ModalDisplayState } from '../types/components';
import { componentRegistry } from '../systems/ComponentRegistry';

interface ModalManagerState {
  activeModals: Map<string, ModalConfig>;
  modalStates: Map<string, ModalDisplayState>;
}

export const useModalManager = () => {
  const [state, setState] = useState<ModalManagerState>({
    activeModals: new Map(),
    modalStates: new Map()
  });

  // Launch a component
  const launchComponent = useCallback((componentId: string) => {
    const component = componentRegistry.getComponent(componentId);
    if (!component) {
      console.warn(`Component ${componentId} not found in registry`);
      return;
    }

    try {
      const modalConfig = component.onLaunch();
      // Add component reference to modal config
      modalConfig.componentId = componentId;
      
      setState(prevState => {
        const newActiveModals = new Map(prevState.activeModals);
        const newModalStates = new Map(prevState.modalStates);
        
        newActiveModals.set(modalConfig.id, modalConfig);
        newModalStates.set(modalConfig.id, modalConfig.initialState || 'modal');
        
        return {
          activeModals: newActiveModals,
          modalStates: newModalStates
        };
      });
    } catch (error) {
      console.error(`Error launching component ${componentId}:`, error);
    }
  }, []);

  // Close a modal
  const closeModal = useCallback((modalId: string) => {
    setState(prevState => {
      const newActiveModals = new Map(prevState.activeModals);
      const newModalStates = new Map(prevState.modalStates);
      
      newActiveModals.delete(modalId);
      newModalStates.delete(modalId);
      
      return {
        activeModals: newActiveModals,
        modalStates: newModalStates
      };
    });
  }, []);

  // Change modal state
  const changeModalState = useCallback((modalId: string, newState: ModalDisplayState) => {
    setState(prevState => {
      const newModalStates = new Map(prevState.modalStates);
      newModalStates.set(modalId, newState);
      
      return {
        ...prevState,
        modalStates: newModalStates
      };
    });
  }, []);

  // Get all active modals
  const getActiveModals = useCallback(() => {
    return Array.from(state.activeModals.entries()).map(([id, config]) => ({
      id,
      config,
      state: state.modalStates.get(id) || 'modal'
    }));
  }, [state]);

  // Check if a modal is open
  const isModalOpen = useCallback((modalId: string) => {
    return state.activeModals.has(modalId);
  }, [state.activeModals]);

  // Close all modals
  const closeAllModals = useCallback(() => {
    setState({
      activeModals: new Map(),
      modalStates: new Map()
    });
  }, []);

  return {
    launchComponent,
    closeModal,
    changeModalState,
    getActiveModals,
    isModalOpen,
    closeAllModals,
    activeModalCount: state.activeModals.size
  };
};
