// Global Error Handler and Recovery System
window.App = window.App || {};

App.ErrorHandler = {
    errorLog: [],
    recoveryStrategies: new Map(),
    performanceMetrics: {
        initTime: 0,
        renderTime: 0,
        dataLoadTime: 0,
        memoryUsage: 0
    },

    init() {
        this.setupGlobalErrorHandlers();
        this.setupRecoveryStrategies();
        this.initializePerformanceMonitoring();
        this.createErrorUI();
    },

    setupGlobalErrorHandlers() {
        // Global JavaScript error handler
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Network error detection
        window.addEventListener('offline', () => {
            this.handleNetworkError('offline');
        });

        window.addEventListener('online', () => {
            this.handleNetworkError('online');
        });
    },

    setupRecoveryStrategies() {
        // Map initialization recovery
        this.recoveryStrategies.set('map_init_failed', {
            attempts: 0,
            maxAttempts: 3,
            strategy: async () => {
                console.log('Attempting map initialization recovery...');
                
                // Try alternative map sources
                const alternativeSources = [
                    () => App.MapController.initializeMapLibre(),
                    () => App.MapController.initializeFallback(),
                    () => this.createMinimalMap()
                ];

                for (let i = 0; i < alternativeSources.length; i++) {
                    try {
                        await alternativeSources[i]();
                        App.UI.showMessage('Recovery', 'Map initialized with fallback method');
                        return true;
                    } catch (error) {
                        console.warn(`Recovery attempt ${i + 1} failed:`, error);
                    }
                }
                
                return false;
            }
        });

        // Data loading recovery
        this.recoveryStrategies.set('data_load_failed', {
            attempts: 0,
            maxAttempts: 3,
            strategy: async (originalError, retryFunction) => {
                console.log('Attempting data load recovery...');
                
                // Exponential backoff retry
                const delay = Math.pow(2, this.recoveryStrategies.get('data_load_failed').attempts) * 1000;
                await this.sleep(delay);
                
                try {
                    if (retryFunction) {
                        await retryFunction();
                        return true;
                    }
                } catch (error) {
                    console.warn('Data load recovery failed:', error);
                }
                
                return false;
            }
        });

        // Rendering recovery
        this.recoveryStrategies.set('render_failed', {
            attempts: 0,
            maxAttempts: 2,
            strategy: async () => {
                console.log('Attempting render recovery...');
                
                try {
                    // Clear current layers and re-render with simplified options
                    if (App.state.deckgl) {
                        App.state.deckgl.setProps({ layers: [] });
                    }
                    
                    // Wait a moment then try simplified rendering
                    await this.sleep(500);
                    
                    if (App.Map && App.Map.renderLayers) {
                        App.Map.renderLayers();
                        return true;
                    }
                } catch (error) {
                    console.warn('Render recovery failed:', error);
                }
                
                return false;
            }
        });

        // Memory recovery
        this.recoveryStrategies.set('memory_high', {
            attempts: 0,
            maxAttempts: 1,
            strategy: async () => {
                console.log('Attempting memory recovery...');
                
                try {
                    // Clear cached data
                    if (App.GeoDataHandler) {
                        App.GeoDataHandler.cache.clear();
                    }
                    
                    // Clear visualization cache
                    if (App.VisualizationEngine) {
                        App.VisualizationEngine.clearActiveVisualizations();
                    }
                    
                    // Force garbage collection if available
                    if (window.gc) {
                        window.gc();
                    }
                    
                    App.UI.showMessage('Recovery', 'Memory cleaned up successfully');
                    return true;
                } catch (error) {
                    console.warn('Memory recovery failed:', error);
                    return false;
                }
            }
        });
    },

    initializePerformanceMonitoring() {
        // Monitor performance metrics
        if (window.performance) {
            const startTime = performance.now();
            
            // Monitor initialization time
            window.addEventListener('load', () => {
                this.performanceMetrics.initTime = performance.now() - startTime;
                this.checkPerformanceThresholds();
            });

            // Monitor memory usage
            setInterval(() => {
                if (performance.memory) {
                    this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
                    this.checkMemoryUsage();
                }
            }, 10000); // Check every 10 seconds
        }
    },

    createErrorUI() {
        // Create error notification system
        const errorContainer = document.createElement('div');
        errorContainer.id = 'error-notifications';
        errorContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
        errorContainer.style.maxWidth = '400px';
        document.body.appendChild(errorContainer);

        // Create error log panel
        const errorLogPanel = document.createElement('div');
        errorLogPanel.innerHTML = `
            <div id="error-log-panel" class="fixed bottom-4 left-4 bg-gray-900 bg-opacity-95 text-white p-4 rounded-lg shadow-lg" style="display: none; max-width: 500px; max-height: 300px; overflow-y: auto;">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-semibold">Error Log</h3>
                    <button id="close-error-log" class="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div id="error-log-content" class="text-sm space-y-2"></div>
                <div class="mt-2 flex gap-2">
                    <button id="clear-error-log" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Clear</button>
                    <button id="export-error-log" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">Export</button>
                </div>
            </div>
        `;
        document.body.appendChild(errorLogPanel);

        // Bind error log events
        document.getElementById('close-error-log')?.addEventListener('click', () => {
            document.getElementById('error-log-panel').style.display = 'none';
        });

        document.getElementById('clear-error-log')?.addEventListener('click', () => {
            this.clearErrorLog();
        });

        document.getElementById('export-error-log')?.addEventListener('click', () => {
            this.exportErrorLog();
        });

        // Add error log toggle to controls
        const controlsContainer = document.getElementById('controls-container');
        if (controlsContainer) {
            const errorSection = document.createElement('div');
            errorSection.innerHTML = `
                <div class="mb-4">
                    <button id="show-error-log" class="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
                        View Error Log (${this.errorLog.length})
                    </button>
                </div>
            `;
            controlsContainer.appendChild(errorSection);

            document.getElementById('show-error-log')?.addEventListener('click', () => {
                document.getElementById('error-log-panel').style.display = 'block';
                this.updateErrorLogDisplay();
            });
        }
    },

    handleError(error) {
        // Add to error log
        this.errorLog.push(error);
        
        // Update error count in UI
        const errorLogBtn = document.getElementById('show-error-log');
        if (errorLogBtn) {
            errorLogBtn.textContent = `View Error Log (${this.errorLog.length})`;
        }

        // Show error notification
        this.showErrorNotification(error);

        // Log to console
        console.error('Application Error:', error);

        // Attempt recovery based on error type
        this.attemptRecovery(error);

        // Report to external service if configured
        this.reportError(error);
    },

    handleNetworkError(status) {
        const error = {
            type: 'network',
            message: `Network status changed to: ${status}`,
            timestamp: new Date().toISOString()
        };

        this.handleError(error);

        if (status === 'offline') {
            App.UI.showMessage('Network', 'You are now offline. Some features may not work properly.');
        } else {
            App.UI.showMessage('Network', 'Connection restored.');
        }
    },

    showErrorNotification(error) {
        const container = document.getElementById('error-notifications');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = 'bg-red-600 text-white p-3 rounded-lg shadow-lg relative';
        notification.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <div class="font-semibold">${this.getErrorTitle(error)}</div>
                    <div class="text-sm mt-1">${this.getErrorMessage(error)}</div>
                </div>
                <button class="text-red-200 hover:text-white ml-2" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        container.appendChild(notification);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    },

    getErrorTitle(error) {
        switch (error.type) {
            case 'javascript': return 'JavaScript Error';
            case 'promise': return 'Promise Rejection';
            case 'network': return 'Network Issue';
            case 'map': return 'Map Error';
            case 'data': return 'Data Error';
            case 'render': return 'Rendering Error';
            default: return 'Application Error';
        }
    },

    getErrorMessage(error) {
        let message = error.message || 'Unknown error occurred';
        if (message.length > 100) {
            message = message.substring(0, 100) + '...';
        }
        return message;
    },

    async attemptRecovery(error) {
        // Determine recovery strategy based on error
        let strategyKey = null;
        
        if (error.message?.includes('map') || error.message?.includes('Map')) {
            strategyKey = 'map_init_failed';
        } else if (error.message?.includes('data') || error.message?.includes('load')) {
            strategyKey = 'data_load_failed';
        } else if (error.message?.includes('render') || error.message?.includes('layer')) {
            strategyKey = 'render_failed';
        }

        if (strategyKey && this.recoveryStrategies.has(strategyKey)) {
            const recovery = this.recoveryStrategies.get(strategyKey);
            
            if (recovery.attempts < recovery.maxAttempts) {
                recovery.attempts++;
                
                try {
                    const success = await recovery.strategy();
                    if (success) {
                        App.UI.showMessage('Recovery', 'Error recovered successfully');
                        return;
                    }
                } catch (recoveryError) {
                    console.error('Recovery failed:', recoveryError);
                }
            }
        }

        // If no recovery possible, show user-friendly message
        this.showRecoveryOptions(error);
    },

    showRecoveryOptions(error) {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const footer = document.getElementById('modal-footer');

        if (!modal || !title || !body || !footer) return;

        title.textContent = 'Application Error';
        body.innerHTML = `
            <p class="mb-4">An error occurred that couldn't be automatically recovered:</p>
            <div class="bg-gray-100 p-3 rounded text-sm mb-4">
                <strong>Error:</strong> ${error.message}
            </div>
            <p class="mb-2">You can try the following options:</p>
            <ul class="list-disc list-inside space-y-1 text-sm">
                <li>Refresh the page to restart the application</li>
                <li>Clear browser cache and reload</li>
                <li>Try using a different browser</li>
                <li>Contact support if the problem persists</li>
            </ul>
        `;
        
        footer.innerHTML = `
            <button id="reload-app" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2">
                Reload Application
            </button>
            <button id="close-error-modal" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
                Continue Anyway
            </button>
        `;

        document.getElementById('reload-app')?.addEventListener('click', () => {
            location.reload();
        });

        document.getElementById('close-error-modal')?.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        modal.classList.remove('hidden');
    },

    checkPerformanceThresholds() {
        const thresholds = {
            initTime: 5000, // 5 seconds
            renderTime: 1000, // 1 second
            dataLoadTime: 10000 // 10 seconds
        };

        Object.keys(thresholds).forEach(metric => {
            if (this.performanceMetrics[metric] > thresholds[metric]) {
                this.handleError({
                    type: 'performance',
                    message: `Performance threshold exceeded: ${metric} took ${this.performanceMetrics[metric]}ms`,
                    timestamp: new Date().toISOString()
                });
            }
        });
    },

    checkMemoryUsage() {
        const memoryThreshold = 100 * 1024 * 1024; // 100MB
        
        if (this.performanceMetrics.memoryUsage > memoryThreshold) {
            this.handleError({
                type: 'memory',
                message: `High memory usage detected: ${Math.round(this.performanceMetrics.memoryUsage / 1024 / 1024)}MB`,
                timestamp: new Date().toISOString()
            });
            
            // Attempt memory recovery
            this.attemptRecovery({ message: 'memory_high' });
        }
    },

    updateErrorLogDisplay() {
        const content = document.getElementById('error-log-content');
        if (!content) return;

        content.innerHTML = '';
        
        if (this.errorLog.length === 0) {
            content.innerHTML = '<p class="text-gray-400">No errors logged</p>';
            return;
        }

        // Show last 20 errors
        const recentErrors = this.errorLog.slice(-20).reverse();
        
        recentErrors.forEach(error => {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'border-l-2 border-red-500 pl-2 py-1';
            errorDiv.innerHTML = `
                <div class="font-medium">${this.getErrorTitle(error)}</div>
                <div class="text-xs text-gray-300">${error.timestamp}</div>
                <div class="text-sm">${error.message}</div>
                ${error.stack ? `<details class="mt-1"><summary class="text-xs cursor-pointer">Stack trace</summary><pre class="text-xs mt-1 p-2 bg-gray-800 rounded overflow-x-auto">${error.stack}</pre></details>` : ''}
            `;
            content.appendChild(errorDiv);
        });
    },

    clearErrorLog() {
        this.errorLog = [];
        this.updateErrorLogDisplay();
        
        const errorLogBtn = document.getElementById('show-error-log');
        if (errorLogBtn) {
            errorLogBtn.textContent = `View Error Log (0)`;
        }
    },

    exportErrorLog() {
        const exportData = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            performanceMetrics: this.performanceMetrics,
            errors: this.errorLog
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `error-log-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    reportError(error) {
        // Placeholder for external error reporting
        // In a real application, you might send this to a service like Sentry, LogRocket, etc.
        if (window.errorReportingEndpoint) {
            fetch(window.errorReportingEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                })
            }).catch(() => {
                // Ignore reporting errors
            });
        }
    },

    createMinimalMap() {
        // Create a very basic fallback map
        const mapContainer = document.getElementById('map');
        if (!mapContainer) throw new Error('Map container not found');

        mapContainer.innerHTML = `
            <div style="
                width: 100%; 
                height: 100%; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                display: flex; 
                align-items: center; 
                justify-content: center;
                color: white;
                font-family: Inter, sans-serif;
                position: relative;
            ">
                <div style="text-align: center;">
                    <h3 style="margin: 0 0 10px 0;">Minimal Map Mode</h3>
                    <p style="margin: 0;">Limited functionality available</p>
                </div>
                <div style="position: absolute; bottom: 10px; right: 10px; font-size: 12px; opacity: 0.7;">
                    Click and drag to pan
                </div>
            </div>
        `;

        // Add basic interactivity
        let isDragging = false;
        let lastX = 0, lastY = 0;

        mapContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });

        mapContainer.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - lastX;
                const deltaY = e.clientY - lastY;
                // Simple visual feedback for panning
                mapContainer.style.backgroundPosition = `${deltaX}px ${deltaY}px`;
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });

        mapContainer.addEventListener('mouseup', () => {
            isDragging = false;
            mapContainer.style.backgroundPosition = '0 0';
        });

        return Promise.resolve();
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
