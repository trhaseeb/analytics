// Component Registry - Central management for all system components
// Enhanced with Standards Enforcement

import type { ComponentDefinition, ComponentCategory } from '../types/components';
import { ComponentEnforcer, ComponentStandardsHelper } from './ComponentStandardsEnforcement';

class ComponentRegistry {
  private components = new Map<string, ComponentDefinition>();
  private listeners = new Set<() => void>();
  private enforcementEnabled = true; // Re-enabled with fixed validation

  // Register a component with standards enforcement
  register(component: ComponentDefinition): void {
    // Standards enforcement check
    if (this.enforcementEnabled) {
      const isValid = ComponentEnforcer.registerComponent(component);
      if (!isValid) {
        const violations = ComponentEnforcer.getViolations(component.id);
        console.error(`🚫 Component ${component.id} rejected due to standards violations:`, violations);
        throw new Error(`Component standards violation: ${violations.join(', ')}`);
      }
    }

    // Quick validation helper for development
    ComponentStandardsHelper.quickValidate(component);

    // Set defaults
    const componentWithDefaults: ComponentDefinition = {
      enabled: true,
      priority: 100,
      category: 'tools',
      iconStyle: 'solid',
      betaComponent: false,
      requiredPermissions: [],
      ...component
    };

    this.components.set(component.id, componentWithDefaults);
    console.log(`✅ Component registered: ${component.id} (${component.name})`);
    this.notifyListeners();
  }

  // Unregister a component
  unregister(id: string): void {
    this.components.delete(id);
    this.notifyListeners();
  }

  // Get all enabled components for home button
  getEnabledComponents(): ComponentDefinition[] {
    return Array.from(this.components.values())
      .filter(component => component.enabled)
      .sort((a, b) => (a.priority || 100) - (b.priority || 100));
  }

  // Get components by category
  getComponentsByCategory(category: ComponentCategory): ComponentDefinition[] {
    return this.getEnabledComponents()
      .filter(component => component.category === category);
  }

  // Get a specific component
  getComponent(id: string): ComponentDefinition | undefined {
    return this.components.get(id);
  }

  // Update component status
  updateComponent(id: string, updates: Partial<ComponentDefinition>): void {
    const component = this.components.get(id);
    if (component) {
      this.components.set(id, { ...component, ...updates });
      this.notifyListeners();
    }
  }

  // Enable/disable a component
  setComponentEnabled(id: string, enabled: boolean): void {
    this.updateComponent(id, { enabled });
  }

  // Standards enforcement control
  setEnforcementEnabled(enabled: boolean): void {
    this.enforcementEnabled = enabled;
    console.log(`🛡️ Component standards enforcement ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  // Get standards violations for all components
  getStandardsViolations(): Map<string, string[]> {
    return ComponentEnforcer.getAllViolations();
  }

  // Generate standards checklist for a component
  generateStandardsChecklist(componentId: string): string {
    return ComponentStandardsHelper.generateChecklist(componentId);
  }

  // Validate all registered components
  validateAllComponents(): void {
    console.group('🧪 Component Standards Validation');
    
    const violations = this.getStandardsViolations();
    const totalComponents = this.components.size;
    const violatingComponents = violations.size;
    
    console.log(`Total components: ${totalComponents}`);
    console.log(`Components with violations: ${violatingComponents}`);
    
    if (violatingComponents > 0) {
      console.warn('Standards violations found:');
      violations.forEach((errors, componentId) => {
        console.group(`❌ ${componentId}`);
        errors.forEach(error => console.error(`  - ${error}`));
        console.groupEnd();
      });
    } else {
      console.log('✅ All components meet standards');
    }
    
    console.groupEnd();
  }

  // Subscribe to registry changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners of changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Get all components (including disabled)
  getAllComponents(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  // Check if component exists
  hasComponent(id: string): boolean {
    return this.components.has(id);
  }

  // Get component count
  getComponentCount(): number {
    return this.components.size;
  }

  // Clear all components (useful for testing)
  clear(): void {
    this.components.clear();
    this.notifyListeners();
  }
}

// Export singleton instance
export const componentRegistry = new ComponentRegistry();

// Export class for testing
export { ComponentRegistry };
