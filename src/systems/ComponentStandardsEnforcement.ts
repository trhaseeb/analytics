// Component Standards Enforcement System
// This module provides validation and enforcement for component standards

import type { ComponentDefinition } from '../types/components';

// ==========================================
// FORBIDDEN PATTERNS DETECTION
// ==========================================

export const FORBIDDEN_PATTERNS = {
  // UI Elements that are forbidden
  SAVE_BUTTONS: [
    /save\s*(changes|data|settings|project)/i,
    /\bsave\b.*button/i,
    /<button[^>]*save[^>]*>/i
  ],
  
  SUBMIT_BUTTONS: [
    /submit/i,
    /type=["']submit["']/,
    /<button[^>]*type=["']submit["'][^>]*>/
  ],
  
  CLOSE_BUTTONS: [
    /close.*button/i,
    /\bclose\b.*onClick/i,
    /×.*onClick/i // Close X buttons
  ],
  
  CUSTOM_MODALS: [
    /fixed\s+inset-0/,
    /position:\s*fixed.*top:\s*0.*left:\s*0/,
    /z-index:\s*[9]{2,}/,
    /backdrop/i
  ],
  
  EXTERNAL_NAVIGATION: [
    /window\.location\.href/,
    /window\.location\.replace/,
    /history\.push/,
    /<a[^>]*href=["'][^#]/ // External links
  ]
};

// ==========================================
// REQUIRED PATTERNS DETECTION
// ==========================================

export const REQUIRED_PATTERNS = {
  STORAGE_MANAGER: [
    /storageManager\./,
    /storageManager\.save/,
    /storageManager\.load/
  ],
  
  EVENT_DISPATCH: [
    /window\.dispatchEvent/,
    /new CustomEvent/,
    /componentUpdated/
  ],
  
  AUTO_SAVE: [
    /onChange.*save/i,
    /onBlur.*save/i,
    /immediate.*save/i
  ],
  
  ERROR_HANDLING: [
    /try\s*{[\s\S]*catch/,
    /\.catch\(/,
    /error.*state/i
  ]
};

// ==========================================
// COMPONENT VALIDATION
// ==========================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
}

export class ComponentValidator {
  
  static validateComponent(
    componentCode: string, 
    componentDefinition: ComponentDefinition
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check for forbidden patterns
    this.checkForbiddenPatterns(componentCode, errors);
    
    // Check for required patterns
    this.checkRequiredPatterns(componentCode, errors, warnings);
    
    // Validate component definition
    this.validateComponentDefinition(componentDefinition, errors);
    
    // Calculate score
    score -= (errors.length * 20) + (warnings.length * 5);
    score = Math.max(0, score);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  private static checkForbiddenPatterns(code: string, errors: string[]): void {
    // Check for save buttons
    if (FORBIDDEN_PATTERNS.SAVE_BUTTONS.some(pattern => pattern.test(code))) {
      errors.push('FORBIDDEN: Save buttons detected. Use auto-save only.');
    }

    // Check for submit buttons
    if (FORBIDDEN_PATTERNS.SUBMIT_BUTTONS.some(pattern => pattern.test(code))) {
      errors.push('FORBIDDEN: Submit buttons detected. Actions must happen immediately.');
    }

    // Check for close buttons
    if (FORBIDDEN_PATTERNS.CLOSE_BUTTONS.some(pattern => pattern.test(code))) {
      errors.push('FORBIDDEN: Close buttons detected. Modal system handles closing.');
    }

    // Check for custom modals
    if (FORBIDDEN_PATTERNS.CUSTOM_MODALS.some(pattern => pattern.test(code))) {
      errors.push('FORBIDDEN: Custom modal detected. Use the main modal system only.');
    }

    // Check for external navigation
    if (FORBIDDEN_PATTERNS.EXTERNAL_NAVIGATION.some(pattern => pattern.test(code))) {
      errors.push('FORBIDDEN: External navigation detected. Use target="_blank" for external links.');
    }
  }

  private static checkRequiredPatterns(
    code: string, 
    errors: string[], 
    warnings: string[]
  ): void {
    // Check for StorageManager usage
    if (!REQUIRED_PATTERNS.STORAGE_MANAGER.some(pattern => pattern.test(code))) {
      errors.push('REQUIRED: StorageManager integration missing.');
    }

    // Check for event dispatching
    if (!REQUIRED_PATTERNS.EVENT_DISPATCH.some(pattern => pattern.test(code))) {
      errors.push('REQUIRED: Event dispatching on data changes missing.');
    }

    // Check for auto-save patterns
    if (!REQUIRED_PATTERNS.AUTO_SAVE.some(pattern => pattern.test(code))) {
      warnings.push('WARNING: Auto-save patterns not detected.');
    }

    // Check for error handling
    if (!REQUIRED_PATTERNS.ERROR_HANDLING.some(pattern => pattern.test(code))) {
      warnings.push('WARNING: Error handling patterns not detected.');
    }
  }

  private static validateComponentDefinition(
    definition: ComponentDefinition, 
    errors: string[]
  ): void {
    if (!definition.id || definition.id.length < 3) {
      errors.push('INVALID: Component ID must be at least 3 characters.');
    }

    if (!definition.name || definition.name.length < 3) {
      errors.push('INVALID: Component name must be at least 3 characters.');
    }

    if (!definition.description || definition.description.length < 10) {
      errors.push('INVALID: Component description must be at least 10 characters.');
    }

    if (!definition.primaryColor || !/^#[0-9A-F]{6}$/i.test(definition.primaryColor)) {
      errors.push('INVALID: Primary color must be a valid hex color.');
    }

    if (!definition.onLaunch || typeof definition.onLaunch !== 'function') {
      errors.push('INVALID: onLaunch function is required.');
    }
  }
}

// ==========================================
// RUNTIME ENFORCEMENT
// ==========================================

export class ComponentEnforcer {
  private static violations: Map<string, string[]> = new Map();

  static registerComponent(definition: ComponentDefinition): boolean {
    // For now, we'll validate only the component definition, not source code
    // Source code validation is handled by the separate validation script
    const errors: string[] = [];
    
    // Basic definition validation
    if (!definition.id || definition.id.length < 3) {
      errors.push('INVALID: Component ID must be at least 3 characters.');
    }

    if (!definition.name || definition.name.length < 3) {
      errors.push('INVALID: Component name must be at least 3 characters.');
    }

    if (!definition.description || definition.description.length < 10) {
      errors.push('INVALID: Component description must be at least 10 characters.');
    }

    if (!definition.onLaunch || typeof definition.onLaunch !== 'function') {
      errors.push('INVALID: onLaunch function is required.');
    }
    
    if (errors.length > 0) {
      console.error(`Component ${definition.id} failed validation:`, errors);
      this.violations.set(definition.id, errors);
      return false;
    }

    console.log(`Component ${definition.id} passed definition validation`);
    return true;
  }

  static getViolations(componentId: string): string[] {
    return this.violations.get(componentId) || [];
  }

  static getAllViolations(): Map<string, string[]> {
    return new Map(this.violations);
  }
}

// ==========================================
// DEVELOPMENT HELPERS
// ==========================================

export const ComponentStandardsHelper = {
  
  // Generate checklist for manual review
  generateChecklist(componentId: string): string {
    return `
COMPONENT STANDARDS CHECKLIST: ${componentId}

UI STANDARDS:
□ No save/submit/apply buttons
□ No custom close buttons  
□ No custom modals within modals
□ Real-time feedback on all interactions
□ Auto-save on data changes

TECHNICAL STANDARDS:
□ Uses StorageManager for persistence
□ Dispatches 'componentUpdated' events
□ Handles loading and error states
□ TypeScript types defined
□ Performance optimized

INTEGRATION STANDARDS:
□ Follows ComponentDefinition interface
□ Works in both modal and sidebar modes
□ No external dependencies beyond allowed list
□ Proper event cleanup in useEffect

TESTING STANDARDS:
□ Component loads without errors
□ Data persists across modal open/close
□ Real-time updates work correctly
□ No console errors
□ Responsive design implemented

CODE QUALITY:
□ ESLint passes without warnings
□ TypeScript compiles without errors
□ Bundle size impact acceptable
□ Documentation updated
`;
  },

  // Quick validation for development
  quickValidate(definition: ComponentDefinition): void {
    console.group(`🧪 Quick Validation: ${definition.name}`);
    
    const issues: string[] = [];
    
    if (!definition.id.match(/^[a-z-]+$/)) {
      issues.push('ID should be lowercase with hyphens only');
    }
    
    if (!definition.category) {
      issues.push('Category is recommended');
    }
    
    if (!definition.enabled) {
      issues.push('Component is disabled');
    }

    if (issues.length === 0) {
      console.log('✅ Basic validation passed');
    } else {
      console.warn('⚠️ Issues found:', issues);
    }
    
    console.groupEnd();
  }
};

// ==========================================
// TYPE GUARDS AND UTILITIES
// ==========================================

export const isValidComponentDefinition = (obj: any): obj is ComponentDefinition => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.onLaunch === 'function' &&
    typeof obj.primaryColor === 'string'
  );
};

export const createStandardizedComponent = (
  baseDefinition: Partial<ComponentDefinition>
): ComponentDefinition => {
  if (!baseDefinition.id || !baseDefinition.name || !baseDefinition.onLaunch) {
    throw new Error('Missing required fields: id, name, onLaunch');
  }

  return {
    description: '',
    icon: '📄',
    primaryColor: '#2563EB',
    secondaryColor: '#3B82F6',
    category: 'tools',
    priority: 50,
    enabled: true,
    ...baseDefinition
  } as ComponentDefinition;
};
