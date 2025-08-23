# Component Standards & Guidelines

## 🎯 **MANDATORY COMPONENT STANDARDS**

All components MUST follow these strict guidelines to be allowed to connect to the application.

---

## **1. FORBIDDEN UI ELEMENTS**

Components are **STRICTLY PROHIBITED** from creating:

### ❌ **NEVER ALLOWED**
- **Save buttons** - Use auto-save only
- **Submit buttons** - Actions happen immediately
- **Apply buttons** - Changes are applied on interaction
- **Close buttons** - Modal system handles closing
- **OK/Cancel dialogs** - Use native browser confirm() if absolutely necessary
- **Custom modals within modals** - Use the main modal system only
- **Navigation elements** - Only the HomeButton provides navigation
- **Custom headers/footers** - Modal system provides these
- **External links that navigate away** - Use `target="_blank"` if needed

### ⚠️ **RESTRICTED ELEMENTS**
- **Action buttons** - Must be functional, not just UI fluff
- **Form submissions** - Must use real-time validation and auto-save
- **File inputs** - Must handle files immediately, no "upload" button
- **Dropdowns** - Changes must apply immediately

---

## **2. REQUIRED BEHAVIORS**

### ✅ **DATA PERSISTENCE**
- **Auto-save**: All data changes must save automatically via StorageManager
- **Real-time updates**: Changes must be visible immediately
- **Event dispatch**: Must dispatch `window.dispatchEvent(new CustomEvent('componentUpdated'))` on data changes
- **Loading states**: Show loading indicators for async operations

### ✅ **INTEGRATION**
- **StorageManager**: Must use centralized storage system
- **TypeScript**: Full type safety required
- **Error handling**: Graceful error handling with user feedback
- **Validation**: Real-time input validation

### ✅ **UX STANDARDS**
- **Immediate feedback**: Users see changes instantly
- **Progressive enhancement**: Core functionality works without JavaScript
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Responsive design**: Must work in both modal and sidebar modes

---

## **3. COMPONENT LIFECYCLE**

### **Initialization**
1. Load data from StorageManager
2. Set up event listeners for external updates
3. Initialize UI state

### **User Interactions**
1. Validate input immediately
2. Update UI state immediately
3. Save to StorageManager immediately
4. Dispatch update event for other components

### **Cleanup**
1. Save any pending data
2. Remove event listeners
3. Clean up resources

---

## **4. TECHNICAL REQUIREMENTS**

### **File Structure**
```
ComponentName.tsx
├── Component Definition (export const ComponentName)
├── Content Component (internal function)
├── Helper Functions (pure functions)
├── Icons (React components)
└── Types (if complex)
```

### **Dependencies**
- **Required**: React, StorageManager, ComponentDefinition types
- **Allowed**: Tailwind CSS, Heroicons, standard browser APIs
- **Forbidden**: External UI libraries, custom CSS files, third-party modals

### **Performance**
- **Lazy loading**: Use React.lazy() for heavy components
- **Memoization**: Use React.memo() and useMemo() appropriately
- **Bundle size**: Keep individual components under 50KB

---

## **5. TESTING REQUIREMENTS**

### **Manual Testing Checklist**
- [ ] Component loads without errors
- [ ] Data persists across modal open/close
- [ ] Real-time updates work
- [ ] Modal and sidebar modes work
- [ ] No console errors
- [ ] All interactions provide immediate feedback
- [ ] Component integrates with App.tsx event system

### **Code Review Checklist**
- [ ] No forbidden UI elements
- [ ] Uses StorageManager correctly
- [ ] Dispatches events on data changes
- [ ] Follows TypeScript best practices
- [ ] Error handling implemented
- [ ] Responsive design implemented

---

## **6. APPROVAL PROCESS**

### **Before Development**
1. Create component specification following this template
2. Review specification against standards
3. Get architectural approval

### **Before Integration**
1. Complete manual testing checklist
2. Pass code review checklist
3. Test integration with existing components
4. Verify no regression in other components

### **Quality Gates**
- **Build**: Must compile without TypeScript errors
- **Lint**: Must pass ESLint without warnings
- **Size**: Bundle analysis shows reasonable impact
- **Integration**: Must work with all existing components

---

## **7. ENFORCEMENT**

### **Automated Checks**
- TypeScript compilation
- ESLint rules for forbidden patterns
- Bundle size analysis
- Import restrictions

### **Manual Review**
- UI/UX adherence to standards
- Integration testing
- Performance impact assessment
- Architecture alignment

### **Violation Consequences**
- **First violation**: Component development halt until fixed
- **Repeated violations**: Complete component rewrite required
- **Pattern violations**: Update to component standards document

---

## **8. EXAMPLES**

### ✅ **GOOD COMPONENT BEHAVIOR**
```typescript
// ✅ Auto-save on change
const updateSetting = (key: string, value: any) => {
  setData(prev => ({ ...prev, [key]: value }));
  storageManager.saveData(data);
  window.dispatchEvent(new CustomEvent('componentUpdated'));
};

// ✅ Immediate validation feedback
<input 
  value={data.name}
  onChange={(e) => updateSetting('name', e.target.value)}
  className={isValid ? 'border-green-500' : 'border-red-500'}
/>
```

### ❌ **BAD COMPONENT BEHAVIOR**
```typescript
// ❌ Never do this - save button
<button onClick={saveData}>Save Changes</button>

// ❌ Never do this - custom modal
<div className="fixed inset-0 bg-black bg-opacity-50">
  <div className="modal-content">...</div>
</div>

// ❌ Never do this - external navigation
<a href="/other-page">Go to other page</a>
```

---

## **📋 COMPLIANCE CHECKLIST**

Before submitting any component, verify:

- [ ] **No forbidden UI elements**
- [ ] **Auto-save functionality implemented**
- [ ] **Event dispatching on data changes**
- [ ] **Real-time validation and feedback**
- [ ] **StorageManager integration**
- [ ] **TypeScript compliance**
- [ ] **Modal and sidebar compatibility**
- [ ] **Error handling**
- [ ] **Performance optimizations**
- [ ] **Accessibility features**
- [ ] **Testing completed**
- [ ] **Documentation updated**

**Remember**: These standards exist to ensure a consistent, reliable, and maintainable application. They are non-negotiable for component approval.
