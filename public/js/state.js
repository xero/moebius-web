/**
 * Global Application State Machine
 * 
 * Centralizes all shared state management for the moebius-web application.
 * Implements pub/sub eventing system to eliminate race conditions and 
 * provide consistent state access across all components.
 */

"use strict";

// State object to hold all application state
const AppState = {
    // Core components
    textArtCanvas: null,
    palette: null,
    font: null,
    cursor: null,
    selectionCursor: null,
    
    // UI components
    positionInfo: null,
    toolPreview: null,
    pasteTool: null,
    chat: null,
    sampleTool: null,
    
    // Network/collaboration
    worker: null,
    
    // Application metadata
    title: null,
    
    // Utility functions
    $: null,
    createCanvas: null,
    
    // Initialization state
    initialized: false,
    initializing: false,
    
    // Dependencies ready flags
    dependenciesReady: {
        palette: false,
        textArtCanvas: false,
        font: false,
        cursor: false,
        selectionCursor: false,
        positionInfo: false,
        toolPreview: false,
        pasteTool: false
    }
};

// Event listeners storage
const stateListeners = new Map();

// Dependency waiting queues
const dependencyWaitQueue = new Map();

/**
 * Global State Management System
 */
class StateManager {
    constructor() {
        this.state = AppState;
        this.listeners = stateListeners;
        this.waitQueue = dependencyWaitQueue;
        
        // Make the state manager globally accessible
        if (typeof window !== 'undefined') {
            window.AppState = this.state;
            window.StateManager = this;
        }
    }
    
    /**
     * Set a state property and notify listeners
     */
    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        // Update dependency ready state
        if (this.state.dependenciesReady.hasOwnProperty(key)) {
            this.state.dependenciesReady[key] = (value !== null && value !== undefined);
        }
        
        // Notify listeners of the change
        this.emit(`${key}:changed`, { key, value, oldValue });
        
        // Check if this satisfies any waiting dependencies
        this.checkDependencyQueue(key);
        
        // Check if all core dependencies are ready
        this.checkInitializationComplete();
        
        return this;
    }
    
    /**
     * Get a state property
     */
    get(key) {
        return this.state[key];
    }
    
    /**
     * Subscribe to state changes
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return this;
    }
    
    /**
     * Unsubscribe from state changes
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
        return this;
    }
    
    /**
     * Emit an event to all listeners
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in state listener for ${event}:`, error);
                }
            });
        }
        return this;
    }
    
    /**
     * Wait for dependencies to be available before executing callback
     */
    waitFor(dependencies, callback) {
        if (typeof dependencies === 'string') {
            dependencies = [dependencies];
        }
        
        // Check if all dependencies are already satisfied
        const allReady = dependencies.every(dep => {
            return this.state[dep] !== null && this.state[dep] !== undefined;
        });
        
        if (allReady) {
            // All dependencies ready, execute immediately
            try {
                callback(dependencies.reduce((acc, dep) => {
                    acc[dep] = this.state[dep];
                    return acc;
                }, {}));
            } catch (error) {
                console.error('Error in waitFor callback:', error);
            }
        } else {
            // Queue the callback for when dependencies are ready
            const waitId = `wait_${Date.now()}_${Math.random()}`;
            this.waitQueue.set(waitId, {
                dependencies,
                callback,
                timestamp: Date.now()
            });
        }
        
        return this;
    }
    
    /**
     * Check if waiting dependencies are satisfied
     */
    checkDependencyQueue(changedKey) {
        const toRemove = [];
        
        this.waitQueue.forEach((waiter, waitId) => {
            const allReady = waiter.dependencies.every(dep => {
                return this.state[dep] !== null && this.state[dep] !== undefined;
            });
            
            if (allReady) {
                try {
                    waiter.callback(waiter.dependencies.reduce((acc, dep) => {
                        acc[dep] = this.state[dep];
                        return acc;
                    }, {}));
                } catch (error) {
                    console.error('Error in dependency wait callback:', error);
                }
                toRemove.push(waitId);
            }
        });
        
        // Remove satisfied waiters
        toRemove.forEach(waitId => this.waitQueue.delete(waitId));
    }
    
    /**
     * Check if core initialization is complete
     */
    checkInitializationComplete() {
        const coreReady = [
            'palette', 'textArtCanvas', 'font', 'cursor', 'selectionCursor', 
            'positionInfo', 'toolPreview', 'pasteTool'
        ].every(key => this.state.dependenciesReady[key]);
        
        if (coreReady && !this.state.initialized && this.state.initializing) {
            this.state.initialized = true;
            this.state.initializing = false;
            this.emit('app:initialized', { state: this.state });
            console.log('🚀 Application initialization complete - all core dependencies ready');
        }
    }
    
    /**
     * Mark initialization as started
     */
    startInitialization() {
        if (this.state.initializing || this.state.initialized) {
            console.warn('Initialization already in progress or complete');
            return;
        }
        
        this.state.initializing = true;
        this.emit('app:initializing', { state: this.state });
        console.log('🔄 Application initialization started');
    }
    
    /**
     * Reset the entire state (for testing or new files)
     */
    reset() {
        // Keep utility functions and core infrastructure
        const keepUtils = {
            $: this.state.$,
            createCanvas: this.state.createCanvas
        };
        
        // Reset to initial state
        Object.assign(this.state, {
            // Core components
            textArtCanvas: null,
            palette: null,
            font: null,
            cursor: null,
            selectionCursor: null,
            
            // UI components  
            positionInfo: null,
            toolPreview: null,
            pasteTool: null,
            chat: null,
            sampleTool: null,
            
            // Network/collaboration
            worker: null,
            
            // Application metadata
            title: null,
            
            // Restore utilities
            ...keepUtils,
            
            // Initialization state
            initialized: false,
            initializing: false,
            
            // Reset dependency flags
            dependenciesReady: {
                palette: false,
                textArtCanvas: false,
                font: false,
                cursor: false,
                selectionCursor: false,
                positionInfo: false,
                toolPreview: false,
                pasteTool: false
            }
        });
        
        this.emit('app:reset', { state: this.state });
        console.log('🔄 Application state reset');
    }
    
    /**
     * Get current initialization status
     */
    getInitializationStatus() {
        return {
            initialized: this.state.initialized,
            initializing: this.state.initializing,
            dependenciesReady: { ...this.state.dependenciesReady },
            readyCount: Object.values(this.state.dependenciesReady).filter(Boolean).length,
            totalCount: Object.keys(this.state.dependenciesReady).length
        };
    }
    
    /**
     * Helper method to safely access nested properties
     */
    safely(callback) {
        try {
            return callback(this.state);
        } catch (error) {
            console.error('Error accessing state:', error);
            return null;
        }
    }
}

// Create the global state manager instance
const stateManager = new StateManager();

// Legacy compatibility functions for existing code
function $(divName) {
    return document.getElementById(divName);
}

function createCanvas(width, height) {
    const canvas = document.createElement("CANVAS");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

/**
 * Convenience methods for common state operations
 */
const State = {
    // Direct property access for better performance and no circular references
    get textArtCanvas() { return stateManager.state.textArtCanvas; },
    get palette() { return stateManager.state.palette; },
    get font() { return stateManager.state.font; },
    get cursor() { return stateManager.state.cursor; },
    get selectionCursor() { return stateManager.state.selectionCursor; },
    get positionInfo() { return stateManager.state.positionInfo; },
    get toolPreview() { return stateManager.state.toolPreview; },
    get pasteTool() { return stateManager.state.pasteTool; },
    get chat() { return stateManager.state.chat; },
    get sampleTool() { return stateManager.state.sampleTool; },
    get worker() { return stateManager.state.worker; },
    get title() { return stateManager.state.title; },
    
    // Core setters
    set textArtCanvas(value) { stateManager.set('textArtCanvas', value); },
    set palette(value) { stateManager.set('palette', value); },
    set font(value) { stateManager.set('font', value); },
    set cursor(value) { stateManager.set('cursor', value); },
    set selectionCursor(value) { stateManager.set('selectionCursor', value); },
    set positionInfo(value) { stateManager.set('positionInfo', value); },
    set toolPreview(value) { stateManager.set('toolPreview', value); },
    set pasteTool(value) { stateManager.set('pasteTool', value); },
    set chat(value) { stateManager.set('chat', value); },
    set sampleTool(value) { stateManager.set('sampleTool', value); },
    set worker(value) { stateManager.set('worker', value); },
    set title(value) { stateManager.set('title', value); },
    
    // Utility methods
    waitFor: stateManager.waitFor.bind(stateManager),
    on: stateManager.on.bind(stateManager),
    off: stateManager.off.bind(stateManager),
    emit: stateManager.emit.bind(stateManager),
    reset: stateManager.reset.bind(stateManager),
    startInitialization: stateManager.startInitialization.bind(stateManager),
    getInitializationStatus: stateManager.getInitializationStatus.bind(stateManager),
    safely: stateManager.safely.bind(stateManager),
    
    // Raw state access (for advanced use cases)
    _manager: stateManager,
    _state: stateManager.state
};

// Export the state system
export { 
    StateManager, 
    stateManager, 
    State, 
    $, 
    createCanvas 
};

// Make globally available for legacy compatibility
if (typeof window !== 'undefined') {
    window.State = State;
    window.stateManager = stateManager;
    window.$ = $;
    window.createCanvas = createCanvas;
}

// Default export
export default State;