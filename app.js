import { DEFAULT_ASSISTANT_PROMPT } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    // Defensive checks for key elements
    const requiredElements = [
        'prompt-form', 'prompt-input', 'preview-container', 'code-container', 
        'loading-indicator', 'model-toggle', 'new-chat-btn', 'sidebar-toggle-btn', 
        'sidebar', 'sidebar-overlay', 'websites-content', 'dark-mode-toggle',
        'copy-code-btn', 'selected-model-display', 'model-dropdown',
        'loginButton', 'discordModal', 'closeModal', 'discordLoginBtn',
        'import-html'
    ];

    // Check if all required elements exist
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Missing required DOM elements:', missingElements);
        // Optionally, you could display a user-friendly error message
        const errorContainer = document.createElement('div');
        errorContainer.className = 'fixed inset-0 bg-red-100 text-red-800 p-4 text-center';
        errorContainer.innerHTML = `
            <div class="max-w-md mx-auto mt-20">
                <h2 class="text-2xl font-bold mb-4">Application Error</h2>
                <p>Some page elements are missing. Please refresh the page or contact support.</p>
                <p class="text-sm mt-4">Missing elements: ${missingElements.join(', ')}</p>
            </div>
        `;
        document.body.appendChild(errorContainer);
        return; // Stop further script execution
    }

    // Wrap critical element selections and event bindings in try-catch
    try {
        // Additional defensive programming techniques
        const getElement = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`Element with id ${id} not found`);
            }
            return element;
        };

        // Add file import handler
        const importHtmlInput = getElement('import-html');
        if (importHtmlInput) {
            importHtmlInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const htmlContent = e.target.result;
                        
                        // Create a new website with the imported content
                        const newWebsite = {
                            id: Date.now(),
                            name: `Imported ${file.name}`,
                            prompt: 'Imported HTML file',
                            html: htmlContent,
                            messages: [
                                {role: "assistant", content: getAssistantPrompt()}
                            ],
                            lastUpdated: new Date(),
                            versions: [{
                                id: Date.now(),
                                html: htmlContent,
                                messages: [
                                    {role: "assistant", content: getAssistantPrompt()}
                                ],
                                prompt: 'Imported HTML file',
                                timestamp: new Date(),
                                model: 'imported'
                            }]
                        };
                        
                        // Add to websites array
                        let websites = [];
                        let currentWebsiteIndex = -1;
                        let currentVersionIndex = -1;

                        // Try to load websites from localStorage with validation
                        try {
                            const savedWebsites = localStorage.getItem('websites');
                            if (savedWebsites) {
                                const parsed = JSON.parse(savedWebsites);
                                // Validate the data structure
                                if (Array.isArray(parsed) && parsed.every(site => 
                                    site && 
                                    typeof site === 'object' && 
                                    'id' in site && 
                                    'name' in site && 
                                    'html' in site
                                )) {
                                    websites = parsed;
                                } else {
                                    // Invalid data structure, initialize fresh
                                    websites = [];
                                    localStorage.setItem('websites', JSON.stringify(websites));
                                }
                            }
                        } catch (error) {
                            console.error('Error loading websites from localStorage:', error);
                            websites = [];
                            localStorage.setItem('websites', JSON.stringify(websites));
                        }

                        websites.push(newWebsite);
                        currentWebsiteIndex = websites.length - 1;
                        currentVersionIndex = 0;
                        
                        // Update preview and lists
                        const chatMessages = [
                            {role: "assistant", content: getAssistantPrompt()}
                        ];
                        updatePreview(htmlContent);
                        renderWebsitesList();
                        renderVersionsList();
                        
                        // Save to localStorage
                        localStorage.setItem('websites', JSON.stringify(websites));
                        localStorage.setItem('currentWebsiteIndex', currentWebsiteIndex);
                        localStorage.setItem('currentVersionIndex', currentVersionIndex);
                        
                        // Clear the input for future imports
                        importHtmlInput.value = '';
                    };
                    reader.readAsText(file);
                }
            });
        }

        if (importHtmlInput) {
            const importHtmlButton = document.querySelector('label[for="import-html"]');
            const importHtmlModal = document.getElementById('importHtmlModal');

            importHtmlButton.addEventListener('click', function(e) {
                // Prevent the file input from immediately opening
                e.preventDefault();
                
                // Show the "Coming Soon" modal
                if (importHtmlModal) {
                    importHtmlModal.classList.remove('hidden');
                }
            });
        }

        // Replace direct document.getElementById calls with the defensive getElement function
        const promptForm = getElement('prompt-form');
        const promptInput = getElement('prompt-input');
        const previewContainer = getElement('preview-container');
        const codeContainer = getElement('code-container');
        const loadingIndicator = getElement('loading-indicator');
        const modelToggle = getElement('model-toggle');
        const newChatBtn = getElement('new-chat-btn');
        const sidebarToggleBtn = getElement('sidebar-toggle-btn');
        const sidebar = getElement('sidebar');
        const sidebarOverlay = getElement('sidebar-overlay');
        const closeSidebarBtn = getElement('close-sidebar');
        const websitesContainer = getElement('websites-content');
        const darkModeToggle = getElement('dark-mode-toggle');
        const copyCodeBtn = getElement('copy-code-btn');
        const selectedModelDisplay = getElement('selected-model-display');
        const modelDropdown = getElement('model-dropdown');
        
        // Consolidate login-related elements into a single declaration section
        const loginElements = {
            button: getElement('loginButton'),
            modal: getElement('discordModal'),
            closeBtn: getElement('closeModal'),
            discordBtn: getElement('discordLoginBtn')
        };

        // Websites collection - Load from localStorage if available
        let websites = [];
        let currentWebsiteIndex = -1;
        let currentVersionIndex = -1;

        // Try to load websites from localStorage with validation
        try {
            const savedWebsites = localStorage.getItem('websites');
            if (savedWebsites) {
                const parsed = JSON.parse(savedWebsites);
                // Validate the data structure
                if (Array.isArray(parsed) && parsed.every(site => 
                    site && 
                    typeof site === 'object' && 
                    'id' in site && 
                    'name' in site && 
                    'html' in site
                )) {
                    websites = parsed;
                } else {
                    // Invalid data structure, initialize fresh
                    websites = [];
                    localStorage.setItem('websites', JSON.stringify(websites));
                }
            }
        } catch (error) {
            console.error('Error loading websites from localStorage:', error);
            websites = [];
            localStorage.setItem('websites', JSON.stringify(websites));
        }

        // Check for dark mode preference
        let darkMode = localStorage.getItem('darkMode') === 'enabled';
        if (darkMode) {
            document.documentElement.classList.add('dark');
        }

        // Initialize sidebar position from localStorage
        let sidebarPosition = localStorage.getItem('sidebarPosition') || 'right';
        if (sidebarPosition === 'left') {
            document.getElementById('sidebar').classList.add('left-sidebar');
            document.getElementById('sidebar-overlay').classList.add('left-sidebar');
            // Move sidebar toggle button to left side
            const sidebarBtn = document.getElementById('sidebar-toggle-btn');
            const regenBtn = document.querySelector('.icon-btn:nth-child(3)'); // The regenerate button
            if (sidebarBtn && regenBtn) {
                sidebarBtn.remove();
                regenBtn.parentNode.insertBefore(sidebarBtn, regenBtn.nextSibling);
            }
        }

        // Settings sidebar position toggle
        const settingsSidebarToggle = document.getElementById('settings-sidebar-toggle');
        if (settingsSidebarToggle) {
            // Initialize toggle state
            settingsSidebarToggle.setAttribute('aria-checked', sidebarPosition === 'left' ? 'true' : 'false');
            
            // Apply initial state
            if (sidebarPosition === 'left') {
                settingsSidebarToggle.classList.add('bg-blue-500');
                settingsSidebarToggle.querySelector('span').classList.add('translate-x-6');
                settingsSidebarToggle.querySelector('span').classList.remove('translate-x-1');
            }
            
            settingsSidebarToggle.addEventListener('click', function() {
                const currentState = this.getAttribute('aria-checked') === 'true';
                const newState = !currentState;
                
                // Update toggle appearance and state
                this.setAttribute('aria-checked', newState ? 'true' : 'false');
                
                const sidebarBtn = document.getElementById('sidebar-toggle-btn');
                const regenBtn = document.querySelector('.icon-btn:nth-child(3)'); // The regenerate button
                const rightBtns = document.querySelector('.flex.items-center.space-x-3'); // Right navigation buttons
                
                if (newState) {
                    this.classList.add('bg-blue-500');
                    this.querySelector('span').classList.add('translate-x-6');
                    this.querySelector('span').classList.remove('translate-x-1');
                    document.getElementById('sidebar').classList.add('left-sidebar');
                    document.getElementById('sidebar-overlay').classList.add('left-sidebar');
                    localStorage.setItem('sidebarPosition', 'left');
                    
                    // Move sidebar button to left side
                    if (sidebarBtn && regenBtn) {
                        sidebarBtn.remove();
                        regenBtn.parentNode.insertBefore(sidebarBtn, regenBtn.nextSibling);
                    }
                } else {
                    this.classList.remove('bg-blue-500');
                    this.querySelector('span').classList.remove('translate-x-6');
                    this.querySelector('span').classList.add('translate-x-1');
                    document.getElementById('sidebar').classList.remove('left-sidebar');
                    document.getElementById('sidebar-overlay').classList.remove('left-sidebar');
                    localStorage.setItem('sidebarPosition', 'right');
                    
                    // Move sidebar button back to right side
                    if (sidebarBtn && rightBtns) {
                        sidebarBtn.remove();
                        rightBtns.insertBefore(sidebarBtn, rightBtns.lastElementChild);
                    }
                }
            });
        }

        // Initialize chat context with improved system prompt
        let chatMessages = [
            {role: "assistant", content: getAssistantPrompt()}
        ];

        // Initialize with empty website only if no saved websites
        if (websites.length === 0) {
            createNewWebsite();
        } else {
            // Load the current website's state
            try {
                currentWebsiteIndex = parseInt(localStorage.getItem('currentWebsiteIndex')) || 0;
                currentVersionIndex = parseInt(localStorage.getItem('currentVersionIndex')) || -1;
                
                // Validate indexes
                if (currentWebsiteIndex >= websites.length) {
                    currentWebsiteIndex = websites.length - 1;
                }
                
                if (currentWebsiteIndex >= 0 && websites[currentWebsiteIndex]) {
                    const currentWebsite = websites[currentWebsiteIndex];
                    
                    if (currentWebsite.html) {
                        updatePreview(currentWebsite.html);
                    } else {
                        // Show empty state
                        showEmptyState();
                    }
                    
                    // Load previous chat messages for context
                    if (currentWebsite.messages) {
                        chatMessages = [...currentWebsite.messages];
                    }
                    
                    renderWebsitesList();
                    renderVersionsList();
                }
            } catch (error) {
                console.error('Error loading current website state:', error);
                currentWebsiteIndex = 0;
                currentVersionIndex = -1;
                showEmptyState();
            }
        }

        // Update default model display
        updateSelectedModelDisplay();

        // Close model dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (modelDropdown && !modelDropdown.classList.contains('hidden') && !modelToggle.contains(e.target) && !modelDropdown.contains(e.target)) {
                modelDropdown.classList.add('hidden');
                modelDropdown.classList.remove('visible');
            }
        });

        // Toggle model dropdown
        if (modelToggle) {
            modelToggle.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent the document click handler from immediately closing the dropdown
                if (modelDropdown) {
                    modelDropdown.classList.toggle('hidden');
                    // Position the dropdown correctly under the toggle button
                    if (!modelDropdown.classList.contains('hidden')) {
                        const toggleRect = modelToggle.getBoundingClientRect();
                        modelDropdown.classList.add('visible');
                        modelDropdown.style.top = (toggleRect.bottom + window.scrollY) + 'px';
                        modelDropdown.style.left = (toggleRect.left + toggleRect.width/2) + 'px';
                    } else {
                        modelDropdown.classList.remove('visible');
                    }
                }
            });
        }

        // Handle model selection
        if (document) {
            document.querySelectorAll('.model-option').forEach(option => {
                if (option) {
                    option.addEventListener('click', function(e) {
                        e.stopPropagation(); // Prevent the document click handler from closing the dropdown
                        const modelValue = this.getAttribute('data-value');
                        const modelName = this.getAttribute('data-name');
                        if (document.querySelector('input[name="model"]')) {
                            document.querySelector('input[name="model"]').value = modelValue;
                            updateSelectedModelDisplay(modelName);
                            if (modelDropdown) {
                                modelDropdown.classList.add('hidden');
                                modelDropdown.classList.remove('visible');
                            }
                        }
                    });
                }
            });
        }

        // Update selected model display
        function updateSelectedModelDisplay(modelName) {
            const defaultModel = document.querySelector('.model-option[data-default="true"]');
            const selectedOption = document.querySelector(`.model-option[data-name="${modelName}"]`) || defaultModel;
            const displayName = modelName || defaultModel.getAttribute('data-name');
            
            // Check if model color display is enabled in settings
            const modelColorEnabled = localStorage.getItem('modelColorDisplay') === 'true';
            
            if (selectedModelDisplay) {
                selectedModelDisplay.textContent = displayName;
                
                // Reset all color classes
                selectedModelDisplay.classList.remove(
                    'text-green-500', 'text-blue-500', 'text-purple-500', 
                    'dark:text-green-400', 'dark:text-blue-400', 'dark:text-purple-400'
                );
                
                // Apply color based on model tier only if model color display is enabled
                if (modelColorEnabled) {
                    const tierContainer = selectedOption.closest('[data-tier]');
                    if (tierContainer) {
                        const tier = tierContainer.getAttribute('data-tier');
                        switch (tier) {
                            case 'Free':
                                selectedModelDisplay.classList.add('text-green-500', 'dark:text-green-400');
                                break;
                            case 'Basic':
                                selectedModelDisplay.classList.add('text-blue-500', 'dark:text-blue-400');
                                break;
                            case 'Premium':
                                selectedModelDisplay.classList.add('text-purple-500', 'dark:text-purple-400');
                                break;
                        }
                    }
                }
            }
            
            // Show reasoning effort button only if the selected model is "o4-mini"
            const reasoningEffortBtn = document.getElementById('reasoning-effort-btn');
            if (reasoningEffortBtn) {
                if (modelName && modelName.toLowerCase() === 'o4-mini') {
                    reasoningEffortBtn.style.display = 'inline-flex';
                } else {
                    reasoningEffortBtn.style.display = 'none';
                }
            }
        }

        // --- Begin Reasoning Effort Dropdown Handling (modified) ---
        const reasoningEffortBtn = document.getElementById('reasoning-effort-btn');
        const reasoningEffortDropdown = document.getElementById('reasoning-effort-dropdown');
        let selectedReasoningEffort = 'medium';

        if (reasoningEffortBtn) {
            // Initialize the button to show only the brain icon
            reasoningEffortBtn.innerHTML = '<i class="fas fa-brain"></i>';
            reasoningEffortBtn.classList.add('flex', 'items-center', 'justify-center');
            reasoningEffortBtn.style.display = 'none'; // Only shown when o3‑mini is selected
            reasoningEffortBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                // Update checkmarks in dropdown before showing it
                updateReasoningOptionsChecks();
                if (reasoningEffortDropdown.classList.contains('hidden')) {
                    reasoningEffortDropdown.classList.remove('hidden');
                    reasoningEffortDropdown.classList.add('visible');
                    // Position the dropdown: center it below the button
                    const btnRect = reasoningEffortBtn.getBoundingClientRect();
                    reasoningEffortDropdown.style.top = (btnRect.bottom + window.scrollY) + 'px';
                    reasoningEffortDropdown.style.left = (btnRect.left + (btnRect.width / 2) + window.scrollX) + 'px';
                } else {
                    reasoningEffortDropdown.classList.add('hidden');
                    reasoningEffortDropdown.classList.remove('visible');
                }
            });
        }

        if (reasoningEffortDropdown) {
            reasoningEffortDropdown.querySelectorAll('.reasoning-option').forEach(option => {
                option.addEventListener('click', function(e) {
                    const effort = this.getAttribute('data-value');
                    if (effort) {
                        selectedReasoningEffort = effort;
                        // Update checkmarks so that the selected option shows a checkmark
                        updateReasoningOptionsChecks();
                        // Always render just the brain icon on the button
                        reasoningEffortBtn.innerHTML = '<i class="fas fa-brain"></i>';
                    }
                    reasoningEffortDropdown.classList.add('hidden');
                    reasoningEffortDropdown.classList.remove('visible');
                });
            });
        }

        function updateReasoningOptionsChecks() {
            reasoningEffortDropdown.querySelectorAll('.reasoning-option').forEach(option => {
                if (option.getAttribute('data-value') === selectedReasoningEffort) {
                    // Append a FontAwesome check icon if not already present
                    if (!option.querySelector('.fa-check')) {
                        const checkIcon = document.createElement('i');
                        checkIcon.className = "fas fa-check ml-auto text-green-500";
                        option.appendChild(checkIcon);
                    }
                } else {
                    // Remove any check icon if present
                    const checkIcon = option.querySelector('.fa-check');
                    if (checkIcon) {
                        checkIcon.remove();
                    }
                }
            });
        }
        // --- End Reasoning Effort Dropdown Handling ---

        // Toggle expanded prompt bar
        if (modelToggle) {
            modelToggle.addEventListener('click', function() {
                // Don't expand the form anymore, just toggle the dropdown
            });
        }

        // Dark mode toggle
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', function() {
                darkMode = !darkMode;
                if (darkMode) {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('darkMode', 'enabled');
                } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('darkMode', 'disabled');
                }
                
                // Update the iframe with dark mode if there's current content
                if (currentWebsiteIndex >= 0 && websites[currentWebsiteIndex].html) {
                    updatePreview(websites[currentWebsiteIndex].html);
                }
            });
        }

        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', function() {
                if (codeContainer) {
                    const code = codeContainer.textContent;
                    
                    navigator.clipboard.writeText(code).then(() => {
                        // Visual feedback
                        const copyBtn = this;
                        copyBtn.classList.add('copied');
                        
                        // Change icon to checkmark
                        copyBtn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                        `;
                        
                        // Reset after 2 seconds
                        setTimeout(() => {
                            copyBtn.classList.remove('copied');
                            copyBtn.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            `;
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy text: ', err);
                    });
                }
            });
        }

        // New site functionality
        if (newChatBtn) {
            newChatBtn.addEventListener('click', function() {
                createNewWebsite();
            });
        }

        // Toggle sidebar
        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', function() {
                if (sidebar) {
                    sidebar.classList.toggle('open');
                    if (sidebarOverlay) {
                        sidebarOverlay.classList.toggle('active');
                    }
                    
                    // Add smooth transition for the button
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        this.style.transform = 'scale(1)';
                    }, 100);
                }
            });
        }

        // Close sidebar
        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', function() {
                if (sidebar) {
                    sidebar.classList.remove('open');
                    if (sidebarOverlay) {
                        sidebarOverlay.classList.remove('active');
                    }
                }
            });
        }

        // Close sidebar when clicking overlay
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', function() {
                if (sidebar) {
                    sidebar.classList.remove('open');
                    this.classList.remove('active');
                }
            });
        }

        // Update the loading state UI functions
        function showLoadingState() {
            if (promptInput) {
                promptInput.disabled = true;
                promptInput.value = 'Generating...';
                promptInput.classList.add('generating');
            }
            if (loadingIndicator) {
                loadingIndicator.classList.remove('hidden');
            }
        }

        function hideLoadingState() {
            if (promptInput) {
                promptInput.disabled = false;
                promptInput.value = '';
                promptInput.classList.remove('generating');
            }
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
        }

        // Handle form submission
        if (promptForm) {
            promptForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const prompt = promptInput.value.trim();
                if (!prompt || prompt === 'Generating...') return;

                // Show loading state
                showLoadingState();

                // Get selected model
                const selectedModel = document.querySelector('input[name="model"]').value;
                
                // Create full prompt with system instructions
                const fullPrompt = prompt;
                
                // Don't reset chat messages anymore - keep the context
                if (chatMessages.length === 0) {
                    chatMessages = [{ role: "assistant", content: getAssistantPrompt() }];
                }
                
                // Add user's prompt
                chatMessages.push({role: "user", content: fullPrompt});
                
                // Update the current website object with raw prompt
                if (currentWebsiteIndex >= 0) {
                    websites[currentWebsiteIndex].prompt = prompt; // Store raw prompt
                    websites[currentWebsiteIndex].messages = [...chatMessages];
                }
                
                // Make API request
                sendToAPI(fullPrompt, selectedModel);
            });
        }

        function sendToAPI(prompt, model) {
            const apiUrl = 'https://text.pollinations.ai/';
            
            const payload = {
                messages: chatMessages,
                model: model,
                jsonMode: false,
                private: true
            };
            
            // If the selected model is o4-mini, add the reasoning_effort parameter
            if (
                model === 'openai-reasoning' &&
                document.getElementById('selected-model-display').textContent.trim().toLowerCase() === 'o4-mini'
            ) {
                payload.reasoning_effort = selectedReasoningEffort;
            }
            
            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                // Hide loading state
                hideLoadingState();
                
                // Update the preview
                updatePreview(data);
                
                // Add to context for next interaction
                chatMessages.push({role: "assistant", content: data});
                
                // Update the current website object
                if (currentWebsiteIndex >= 0) {
                    // Create a new version
                    if (!websites[currentWebsiteIndex].versions) {
                        websites[currentWebsiteIndex].versions = [];
                    }
                    
                    // Add current state as new version
                    websites[currentWebsiteIndex].versions.push({
                        id: Date.now(),
                        html: data,
                        messages: [...chatMessages],
                        prompt: websites[currentWebsiteIndex].prompt,
                        timestamp: new Date(),
                        model: model // Store the model used for this version
                    });
                    
                    // Update current version index
                    currentVersionIndex = websites[currentWebsiteIndex].versions.length - 1;
                    
                    // Update the website object with latest data
                    websites[currentWebsiteIndex].html = data;
                    websites[currentWebsiteIndex].messages = [...chatMessages];
                    websites[currentWebsiteIndex].lastUpdated = new Date();
                    websites[currentWebsiteIndex].model = model; // Store the model used
                    
                    // Update website name if it's the default and this is the first response
                    if (websites[currentWebsiteIndex].name === `Website ${currentWebsiteIndex + 1}` && 
                        websites[currentWebsiteIndex].messages.length === 3) {
                        // Extract a name from the prompt
                        const userPrompt = websites[currentWebsiteIndex].prompt;
                        const shortName = userPrompt.split(' ').slice(0, 3).join(' ');
                        websites[currentWebsiteIndex].name = shortName + '...';
                    }
                    
                    // Update websites list display
                    renderWebsitesList();
                    // Update versions list display
                    renderVersionsList();
                    
                    // Save to localStorage after updates
                    localStorage.setItem('websites', JSON.stringify(websites));
                    localStorage.setItem('currentVersionIndex', currentVersionIndex);
                }
                
                // Automatically open sidebar to show the code
                if (sidebar) {
                    sidebar.classList.add('open');
                    if (sidebarOverlay) {
                        sidebarOverlay.classList.add('active');
                    }
                }
            })
            .catch(error => {
                // Hide loading state on error
                hideLoadingState();
                console.error('Error:', error);
                if (previewContainer) {
                    previewContainer.innerHTML = `<div class="text-red-500 p-4">Sorry, there was an error processing your request.</div>`;
                }
            });
        }

        function updatePreview(htmlCode) {
            // Remove thinking process tags before showing preview
            const cleanHtml = htmlCode.replace(/<think>[\s\S]*?<\/think>/g, '');
            
            // Create an iframe for the preview
            if (previewContainer) {
                previewContainer.innerHTML = '';
                const iframe = document.createElement('iframe');
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                
                // Enhanced sandbox attributes for better isolation while allowing needed permissions
                iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms allow-downloads allow-modals allow-presentation allow-pointer-lock');
                
                // Additional permissions for games and interactive content
                iframe.setAttribute('allow', 'autoplay; camera; microphone; fullscreen; gamepad; clipboard-read; clipboard-write; web-share; accelerometer; gyroscope; magnetometer; payment; screen-wake-lock');
                
                previewContainer.appendChild(iframe);
                
                // Create a complete HTML document with proper doctype and content isolation
                const html = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <base target="_blank">
                        <script>
                            // Isolate the iframe's console from the parent
                            console = {...console};
                        </script>
                        <style>
                            /* Reset all styles to prevent parent page influence */
                            *, *::before, *::after {
                                box-sizing: border-box;
                            }
                            html, body {
                                margin: 0;
                                padding: 0;
                                width: 100%;
                                height: 100%;
                                overflow: auto;
                            }
                            
                            /* Ensure canvas and game elements work properly */
                            canvas {
                                display: block;
                                touch-action: none;
                                image-rendering: optimizeSpeed;
                                image-rendering: -moz-crisp-edges;
                                image-rendering: -webkit-optimize-contrast;
                                image-rendering: optimize-contrast;
                                image-rendering: pixelated;
                                -ms-interpolation-mode: nearest-neighbor;
                            }
                            
                            /* Support full-height game containers */
                            .game-container, .fullscreen, [data-game-container] {
                                position: fixed;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                overflow: hidden;
                            }
                        </style>
                        
                        <!-- Add Tailwind CSS if it's used in the content -->
                        <script src="https://cdn.tailwindcss.com"></script>
                    </head>
                    <body>
                        ${cleanHtml}
                        
                        <script>
                            // Ensure parent page can't access this iframe's content
                            if (window.parent !== window) {
                                document.domain = document.domain;
                            }
                            
                            // Fix for canvas and WebGL contexts
                            document.querySelectorAll('canvas').forEach(canvas => {
                                if (canvas.getContext) {
                                    // Force a redraw of any canvas
                                    const context = canvas.getContext('2d') || canvas.getContext('webgl') || canvas.getContext('webgl2');
                                    if (context && context.canvas) {
                                        const width = canvas.width;
                                        canvas.width = 1;
                                        canvas.width = width;
                                    }
                                }
                            });
                        </script>
                    </body>
                    </html>
                `;
                
                // Write to iframe using srcdoc for better content isolation
                iframe.srcdoc = html;
                
                // Update the code view with clean HTML (no thinking tags)
                if (codeContainer) {
                    codeContainer.textContent = cleanHtml;
                }
                
                // Highlight the code if using a syntax highlighter
                if (typeof hljs !== 'undefined' && codeContainer) {
                    hljs.highlightElement(codeContainer);
                }
            }
        }
        
        function switchToWebsite(index) {
            if (index >= 0 && index < websites.length) {
                currentWebsiteIndex = index;
                const website = websites[index];
                
                // Get selected model
                const selectedModel = document.querySelector('input[name="model"]').value;
                
                // Reset chat messages based on model if this is a new website with no versions
                if (!website.versions || website.versions.length === 0) {
                    chatMessages = [{ role: "assistant", content: getAssistantPrompt() }];
                } else {
                    chatMessages = [...website.messages];
                }
                
                // Update the UI
                if (promptInput) {
                    promptInput.value = website.prompt;
                }
                
                if (website.html) {
                    updatePreview(website.html);
                } else {
                    if (previewContainer) {
                        previewContainer.innerHTML = `
                            <div class="flex items-center justify-center h-full text-gray-400">
                                <div class="text-center p-8">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                        `;
                    }
                    if (codeContainer) {
                        codeContainer.textContent = '';
                    }
                }
                
                // Highlight the active website
                renderWebsitesList();
                // Update versions list for this website
                renderVersionsList();
                
                // Save current indexes to localStorage
                localStorage.setItem('currentWebsiteIndex', currentWebsiteIndex);
                localStorage.setItem('currentVersionIndex', currentVersionIndex);
            }
        }
        
        function deleteWebsite(index) {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center';
            modal.innerHTML = `
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl relative z-10 w-[400px] transform transition-all scale-100">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Website</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this website? This action cannot be undone.</p>
                    <div class="flex justify-end space-x-3">
                        <button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" onclick="this.closest('.fixed').remove()">Cancel</button>
                        <button class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors delete-confirm">Delete</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('.delete-confirm').addEventListener('click', () => {
                websites.splice(index, 1);
                
                if (websites.length === 0) {
                    createNewWebsite();
                } else {
                    if (currentWebsiteIndex >= websites.length) {
                        currentWebsiteIndex = websites.length - 1;
                    }
                    switchToWebsite(currentWebsiteIndex);
                }

                localStorage.setItem('websites', JSON.stringify(websites));
                localStorage.setItem('currentWebsiteIndex', currentWebsiteIndex);
                modal.remove();
            });
        }

        function deleteVersion(versionIndex) {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center';
            modal.innerHTML = `
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl relative z-10 w-[400px] transform transition-all scale-100">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Version</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this version? This action cannot be undone.</p>
                    <div class="flex justify-end space-x-3">
                        <button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" onclick="this.closest('.fixed').remove()">Cancel</button>
                        <button class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors delete-confirm">Delete</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('.delete-confirm').addEventListener('click', () => {
                if (currentWebsiteIndex >= 0 && 
                    websites[currentWebsiteIndex].versions && 
                    versionIndex >= 0 && 
                    versionIndex < websites[currentWebsiteIndex].versions.length) {
                    
                    // Remove the version
                    websites[currentWebsiteIndex].versions.splice(versionIndex, 1);
                    
                    // If we deleted the current version
                    if (versionIndex === currentVersionIndex) {
                        // If there are still versions left
                        if (websites[currentWebsiteIndex].versions.length > 0) {
                            // Go to the latest version
                            currentVersionIndex = websites[currentWebsiteIndex].versions.length - 1;
                            const latestVersion = websites[currentWebsiteIndex].versions[currentVersionIndex];
                            
                            // Update website with latest version data
                            websites[currentWebsiteIndex].html = latestVersion.html;
                            websites[currentWebsiteIndex].messages = [...latestVersion.messages];
                            chatMessages = [...latestVersion.messages];
                            
                            // Update UI
                            if (promptInput) {
                                promptInput.value = latestVersion.prompt;
                            }
                            updatePreview(latestVersion.html);
                        } else {
                            // No versions left, reset
                            currentVersionIndex = -1;
                            websites[currentWebsiteIndex].html = '';
                            websites[currentWebsiteIndex].messages = [
                                {role: "assistant", content: getAssistantPrompt()}
                            ];
                            chatMessages = [...websites[currentWebsiteIndex].messages];
                            
                            // Clear UI
                            if (promptInput) {
                                promptInput.value = '';
                            }
                            if (previewContainer) {
                                previewContainer.innerHTML = `
                                    <div class="flex items-center justify-center h-full text-gray-400">
                                        <div class="text-center p-8">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                    </div>
                                `;
                            }
                            if (codeContainer) {
                                codeContainer.textContent = '';
                            }
                        }
                    } else if (versionIndex < currentVersionIndex) {
                        // If we deleted a version before the current one, adjust the index
                        currentVersionIndex--;
                    }
                    
                    renderVersionsList();
                    
                    localStorage.setItem('websites', JSON.stringify(websites));
                    localStorage.setItem('currentVersionIndex', currentVersionIndex);
                }
                modal.remove();
            });
        }

        function switchToVersion(versionIndex) {
            if (currentWebsiteIndex >= 0 && 
                websites[currentWebsiteIndex].versions && 
                versionIndex >= 0 && 
                versionIndex < websites[currentWebsiteIndex].versions.length) {
                
                currentVersionIndex = versionIndex;
                const version = websites[currentWebsiteIndex].versions[versionIndex];
                
                // Load this version's context
                chatMessages = [...version.messages];
                
                // Update the UI
                if (promptInput) {
                    promptInput.value = version.prompt;
                }
                
                if (version.html) {
                    updatePreview(version.html);
                }
                
                // Update versions list to highlight the current version
                renderVersionsList();
                
                // Save current version index to localStorage
                localStorage.setItem('currentVersionIndex', currentVersionIndex);
            }
        }
        
        function renderWebsitesList() {
            if (websitesContainer) {
                websitesContainer.innerHTML = '';
                
                if (websites.length === 0) {
                    websitesContainer.innerHTML = '<div class="text-sm text-gray-500 dark:text-gray-400 p-2">No websites yet</div>';
                    return;
                }
                
                websites.forEach((website, index) => {
                    const isActive = index === currentWebsiteIndex;
                    const date = website.lastUpdated ? formatDate(website.lastUpdated) : 'New';
                    const modelName = website.messages && website.messages.length > 2 ? 
                        document.querySelector(`.model-option[data-value="${website.model}"]`)?.getAttribute('data-name') || 'Unknown Model' : 
                        'No model used';
                    
                    // Create a preview iframe (initially hidden)
                    const previewId = `preview-${website.id}`;
                    const websiteEl = document.createElement('div');
                    websiteEl.className = `relative p-3 rounded-lg mb-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' : 'bg-gray-50 dark:bg-gray-800/50'}`;
                    websiteEl.innerHTML = `
                        <div class="flex items-start gap-3">
                            <div class="w-24 h-16 rounded-lg overflow-hidden bg-white dark:bg-gray-700 flex-shrink-0 border border-gray-200 dark:border-gray-600">
                                <iframe id="${previewId}" class="w-full h-full transform scale-[0.25] origin-top-left pointer-events-none" style="width:400%; height:400%"></iframe>
                            </div>
                            <div class="flex-1 pr-6">
                                <div class="text-sm font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'dark:text-gray-300'}">${escapeHTML(website.name)}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">${date} · ${modelName}</div>
                            </div>
                            <div class="absolute top-3 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button class="website-menu-btn p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" data-index="${index}">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="website-menu hidden absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                            <div class="py-1">
                                <button class="rename-website w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <i class="fas fa-edit mr-2"></i> Rename
                                </button>
                                <button class="duplicate-website w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <i class="fas fa-copy mr-2"></i> Duplicate
                                </button>
                                <button class="export-website w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <i class="fas fa-download mr-2"></i> Export
                                </button>
                                <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                <button class="delete-website w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                    <i class="fas fa-trash-alt mr-2"></i> Delete
                                </button>
                            </div>
                        </div>
                    `;
                    
                    websitesContainer.appendChild(websiteEl);
                    
                    // Set iframe content after a short delay
                    setTimeout(() => {
                        const iframe = document.getElementById(previewId);
                        if (iframe && website.html) {
                            const html = `
                                <!DOCTYPE html>
                                <html lang="en">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <base target="_blank">
                                    <style>
                                        *, *::before, *::after { box-sizing: border-box; }
                                        html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
                                    </style>
                                    <script src="https://cdn.tailwindcss.com"></script>
                                </head>
                                <body>
                                    ${DOMPurify.sanitize(website.html)}
                                </body>
                                </html>
                            `;
                            iframe.srcdoc = html;
                        }
                    }, 100);
                });

                // Add click handlers for menu buttons
                document.querySelectorAll('.website-menu-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const index = parseInt(btn.dataset.index);
                        const menu = btn.closest('.group').querySelector('.website-menu');
                        
                        // Close all other menus first
                        document.querySelectorAll('.website-menu').forEach(m => {
                            if (m !== menu) m.classList.add('hidden');
                        });
                        
                        menu.classList.toggle('hidden');
                    });
                });

                // Handle rename action
                document.querySelectorAll('.rename-website').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const websiteEl = btn.closest('.group');
                        const index = parseInt(websiteEl.querySelector('.website-menu-btn').dataset.index);
                        const website = websites[index];
                        
                        // Create rename modal
                        const modal = document.createElement('div');
                        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center';
                        modal.innerHTML = `
                            <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
                            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl relative z-10 w-[400px]">
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Rename Website</h3>
                                <input type="text" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4" value="${escapeHTML(website.name)}">
                                <div class="flex justify-end space-x-3">
                                    <button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cancel">Cancel</button>
                                    <button class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors save">Save</button>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(modal);

                        // Handle modal actions
                        modal.querySelector('.cancel').addEventListener('click', () => modal.remove());
                        modal.querySelector('.save').addEventListener('click', () => {
                            const newName = modal.querySelector('input').value.trim();
                            if (newName) {
                                websites[index].name = newName;
                                localStorage.setItem('websites', JSON.stringify(websites));
                                renderWebsitesList();
                            }
                            modal.remove();
                        });
                    });
                });

                // Handle duplicate action
                document.querySelectorAll('.duplicate-website').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const index = parseInt(btn.closest('.group').querySelector('.website-menu-btn').dataset.index);
                        const website = websites[index];
                        
                        const duplicate = {
                            ...JSON.parse(JSON.stringify(website)),
                            id: Date.now(),
                            name: `${website.name} (Copy)`,
                            lastUpdated: new Date()
                        };
                        
                        websites.push(duplicate);
                        localStorage.setItem('websites', JSON.stringify(websites));
                        renderWebsitesList();
                    });
                });

                // Handle export action
                document.querySelectorAll('.export-website').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const index = parseInt(btn.closest('.group').querySelector('.website-menu-btn').dataset.index);
                        const website = websites[index];
                        
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(website, null, 2));
                        const downloadAnchorNode = document.createElement('a');
                        downloadAnchorNode.setAttribute("href", dataStr);
                        downloadAnchorNode.setAttribute("download", `${website.name}.json`);
                        document.body.appendChild(downloadAnchorNode);
                        downloadAnchorNode.click();
                        downloadAnchorNode.remove();
                    });
                });

                // Handle delete action
                document.querySelectorAll('.delete-website').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const index = parseInt(btn.closest('.group').querySelector('.website-menu-btn').dataset.index);
                        deleteWebsite(index);
                    });
                });

                // Click outside to close menus
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.website-menu') && !e.target.closest('.website-menu-btn')) {
                        document.querySelectorAll('.website-menu').forEach(menu => menu.classList.add('hidden'));
                    }
                });

                // Click on website to switch
                document.querySelectorAll('.group').forEach(websiteEl => {
                    websiteEl.addEventListener('click', function(e) {
                        if (!e.target.closest('.website-menu') && !e.target.closest('.website-menu-btn')) {
                            const index = parseInt(this.querySelector('.website-menu-btn').dataset.index);
                            switchToWebsite(index);
                        }
                    });
                });
            }
        }

        function renderVersionsList() {
            const versionsContainer = document.getElementById('versions-content');
            if (versionsContainer) {
                versionsContainer.innerHTML = '';
                
                if (currentWebsiteIndex < 0 || !websites[currentWebsiteIndex].versions || websites[currentWebsiteIndex].versions.length === 0) {
                    versionsContainer.innerHTML = '<div class="text-sm text-gray-500 dark:text-gray-400 p-2">No versions yet</div>';
                    return;
                }
                
                websites[currentWebsiteIndex].versions.forEach((version, index) => {
                    const isActive = index === currentVersionIndex;
                    const date = version.timestamp ? formatDate(version.timestamp) : 'Unknown';
                    const modelName = version.model ? 
                        document.querySelector(`.model-option[data-value="${version.model}"]`)?.getAttribute('data-name') || 'Unknown Model' : 
                        'No model used';
                    
                    // Extract thinking process if it exists
                    let thinkingProcess = '';
                    if (version.html) {
                        const thinkMatch = version.html.match(/<think>([\s\S]*?)<\/think>/);
                        if (thinkMatch) {
                            thinkingProcess = thinkMatch[1].trim();
                        }
                    }
                    
                    // Create a preview iframe (initially hidden)
                    const previewId = `version-preview-${version.id}`;
                    const versionEl = document.createElement('div');
                    versionEl.className = `relative p-3 rounded-lg mb-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' : 'bg-gray-50 dark:bg-gray-800/50'}`;
                    versionEl.setAttribute('data-version-index', index); 
                    versionEl.innerHTML = `
                        <div class="flex items-start gap-3">
                            <div class="w-24 h-16 rounded-lg overflow-hidden bg-white dark:bg-gray-700 flex-shrink-0 border border-gray-200 dark:border-gray-600">
                                <iframe id="${previewId}" class="w-full h-full transform scale-[0.25] origin-top-left pointer-events-none" style="width:400%; height:400%"></iframe>
                            </div>
                            <div class="flex-1 pr-6">
                                <div class="text-sm font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'dark:text-gray-300'}">Version ${index + 1}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">${date} · ${modelName}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${escapeHTML(version.prompt || 'No prompt')}</div>
                            </div>
                            <div class="absolute top-3 right-2 flex space-x-1">
                                ${thinkingProcess ? `
                                    <button class="thinking-btn p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" data-thinking="${escapeHTML(thinkingProcess)}">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </button>
                                ` : ''}
                                <button class="delete-version p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" data-index="${index}">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `;
                    
                    versionsContainer.appendChild(versionEl);
                    
                    // Set iframe content after a short delay
                    setTimeout(() => {
                        const iframe = document.getElementById(previewId);
                        if (iframe && version.html) {
                            // Remove thinking process tags before showing preview
                            const cleanHtml = version.html.replace(/<think>[\s\S]*?<\/think>/g, '');
                            const html = `
                                <!DOCTYPE html>
                                <html lang="en">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <base target="_blank">
                                    <style>
                                        *, *::before, *::after { box-sizing: border-box; }
                                        html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
                                    </style>
                                    <script src="https://cdn.tailwindcss.com"></script>
                                </head>
                                <body>
                                    ${DOMPurify.sanitize(cleanHtml)}
                                </body>
                                </html>
                            `;
                            iframe.srcdoc = html;
                        }
                    }, 100);
                });
                
                // Add thinking button click handlers
                document.querySelectorAll('.thinking-btn').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const thinkingContent = this.getAttribute('data-thinking');
                        
                        // Create and show thinking modal without explicit close buttons.
                        const modal = document.createElement('div');
                        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center';
                        modal.innerHTML = `
                            <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
                            <div class="thinking-modal-content bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl relative z-10 w-[600px] max-h-[80vh] overflow-y-auto">
                                <div class="flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Thought Process</h3>
                                </div>
                                <div class="prose dark:prose-invert max-w-none">
                                    <pre class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">${escapeHTML(thinkingContent)}</pre>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(modal);
                        
                        const closeModal = () => modal.remove();
                        // Close the thinking modal when clicking anywhere outside the modal content
                        modal.addEventListener('click', (e) => {
                            if (!e.target.closest('.thinking-modal-content')) {
                                closeModal();
                            }
                        });
                    });
                });
                
                // Add event listeners to version elements for switching versions
                document.querySelectorAll('[data-version-index]').forEach(versionEl => {
                    versionEl.addEventListener('click', function(e) {
                        // Don't switch if we clicked delete button
                        if (!e.target.closest('.delete-version')) {
                            const versionIndex = parseInt(this.getAttribute('data-version-index'));
                            switchToVersion(versionIndex);
                        }
                    });
                });
                
                // Add event listeners to delete buttons
                document.querySelectorAll('.delete-version').forEach(button => {
                    button.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const index = parseInt(this.getAttribute('data-index'));
                        deleteVersion(index);
                    });
                });
            }
        }
        
        function formatDate(date) {
            if (!(date instanceof Date)) {
                date = new Date(date);
            }
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            }).replace(', ', ' · ').replace(' ', ' · '); // Replace comma and space with dots
        }
        
        function escapeHTML(str) {
            return str.replace(/[&<>'"]/g, 
                tag => ({
                    '&': '&amp;',
                    '<': '<',
                    '>': '&gt;',
                    "'": '&#39;',
                    '"': '&quot;'
                }[tag]));
        }

        function updateStats() {
            const totalWebsites = document.getElementById('total-websites');
            const totalVersions = document.getElementById('total-versions');
            
            if(totalWebsites) {
                totalWebsites.textContent = websites.length;
            }
            
            if(totalVersions && currentWebsiteIndex >= 0) {
                const versions = websites[currentWebsiteIndex].versions || [];
                totalVersions.textContent = versions.length;
            }
        }

        const sidebarSearch = document.getElementById('sidebar-search');
        if(sidebarSearch) {
            sidebarSearch.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                const websitesList = document.querySelectorAll('#websites-content > div');
                const versionsList = document.querySelectorAll('#versions-content > div');
                
                websitesList.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(searchTerm) ? 'block' : 'none';
                });
                
                versionsList.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(searchTerm) ? 'block' : 'none';
                });
            });
        }

        const exportVersions = document.getElementById('export-versions');
        if(exportVersions) {
            exportVersions.addEventListener('click', function() {
                if(currentWebsiteIndex >= 0 && websites[currentWebsiteIndex].versions) {
                    const versions = websites[currentWebsiteIndex].versions;
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(versions, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", "versions.json");
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                }
            });
        }

        const clearVersions = document.getElementById('clear-versions');
        if(clearVersions) {
            clearVersions.addEventListener('click', function() {
                if(currentWebsiteIndex >= 0 && websites[currentWebsiteIndex].versions) {
                    if(confirm('Are you sure you want to clear all versions? This cannot be undone.')) {
                        websites[currentWebsiteIndex].versions = [];
                        currentVersionIndex = -1;
                        localStorage.setItem('websites', JSON.stringify(websites));
                        localStorage.setItem('currentVersionIndex', currentVersionIndex);
                        renderVersionsList();
                        updateStats();
                    }
                }
            });
        }

        const formatCode = document.getElementById('format-code');
        if(formatCode) {
            formatCode.addEventListener('click', function() {
                const codeContainer = document.getElementById('code-container');
                if(codeContainer && codeContainer.textContent) {
                    try {
                        const formatted = html_beautify(codeContainer.textContent, {
                            indent_size: 2,
                            wrap_line_length: 80
                        });
                        codeContainer.textContent = formatted;
                        if(typeof hljs !== 'undefined') {
                            hljs.highlightElement(codeContainer);
                        }
                    } catch(e) {
                        console.error('Error formatting code:', e);
                    }
                }
            });
        }

        const originalRenderWebsitesList = renderWebsitesList;
        renderWebsitesList = function() {
            originalRenderWebsitesList();
            updateStats();
        };

        const originalRenderVersionsList = renderVersionsList;
        renderVersionsList = function() {
            originalRenderVersionsList();
            updateStats();
        };

        // Initial render of versions list
        renderVersionsList();

        // Tab switching functionality
        const tabButtons = document.querySelectorAll('[data-tab]');
        const tabContents = document.querySelectorAll('[data-tab-content]');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;
                
                // Update active states
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                });
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    content.classList.add('hidden');
                });
                
                // Activate selected tab
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');
                document.querySelector(`[data-tab-content="${tab}"]`).classList.remove('hidden');
                document.querySelector(`[data-tab-content="${tab}"]`).classList.add('active');
            });
        });

        // Initialize with first tab active
        if (document.querySelector('[data-tab="websites"]')) {
            document.querySelector('[data-tab="websites"]').click();
        }

        // Login functionality
        if (loginElements.button) {
            loginElements.button.addEventListener('click', () => {
                if (loginElements.modal) {
                    loginElements.modal.classList.remove('hidden');
                }
            });
        }

        if (loginElements.closeBtn) {
            loginElements.closeBtn.addEventListener('click', () => {
                if (loginElements.modal) {
                    loginElements.modal.classList.add('hidden');
                }
            });
        }

        // Close modal when clicking outside
        if (loginElements.modal) {
            loginElements.modal.addEventListener('click', (e) => {
                if (e.target === loginElements.modal) {
                    loginElements.modal.classList.add('hidden');
                }
            });
        }

        // Discord login button functionality
        if (loginElements.discordBtn) {
            loginElements.discordBtn.addEventListener('click', () => {
                // Add Discord OAuth flow here
                window.location.href = 'https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=identify%20email';
            });
        }

        // Settings modal
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settingsModal');
        const settingsDarkToggle = document.getElementById('settings-dark-toggle');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                settingsModal.classList.remove('hidden');
            });
        }

        // Close settings modal when clicking outside
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    settingsModal.classList.add('hidden');
                }
            });
        }

        // Settings dark mode toggle
        if (settingsDarkToggle) {
            // Initialize toggle state
            const darkMode = localStorage.getItem('darkMode') === 'enabled';
            settingsDarkToggle.setAttribute('aria-checked', darkMode ? 'true' : 'false');
            
            // Apply initial state
            if (darkMode) {
                settingsDarkToggle.classList.add('bg-blue-500');
                settingsDarkToggle.querySelector('span').classList.add('translate-x-6');
                settingsDarkToggle.querySelector('span').classList.remove('translate-x-1');
            }
            
            settingsDarkToggle.addEventListener('click', function() {
                const currentState = this.getAttribute('aria-checked') === 'true';
                const newState = !currentState;
                
                // Update toggle appearance and state
                this.setAttribute('aria-checked', newState ? 'true' : 'false');
                
                if (newState) {
                    this.classList.add('bg-blue-500');
                    this.querySelector('span').classList.add('translate-x-6');
                    this.querySelector('span').classList.remove('translate-x-1');
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('darkMode', 'enabled');
                } else {
                    this.classList.remove('bg-blue-500');
                    this.querySelector('span').classList.remove('translate-x-6');
                    this.querySelector('span').classList.add('translate-x-1');
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('darkMode', 'disabled');
                }
                
                // Update the iframe if there's current content
                if (currentWebsiteIndex >= 0 && websites[currentWebsiteIndex].html) {
                    updatePreview(websites[currentWebsiteIndex].html);
                }
            });
        }

        // Model color display toggle functionality
        const settingsModelColorToggle = document.getElementById('settings-model-color-toggle');
        if (settingsModelColorToggle) {
            // Initialize toggle state from localStorage
            const modelColorEnabled = localStorage.getItem('modelColorDisplay') === 'true';
            settingsModelColorToggle.setAttribute('aria-checked', modelColorEnabled ? 'true' : 'false');
            
            // Apply initial state
            if (modelColorEnabled) {
                settingsModelColorToggle.classList.add('bg-blue-500');
                settingsModelColorToggle.querySelector('span').classList.add('translate-x-6');
                settingsModelColorToggle.querySelector('span').classList.remove('translate-x-1');
            }
            
            settingsModelColorToggle.addEventListener('click', function() {
                const currentState = this.getAttribute('aria-checked') === 'true';
                const newState = !currentState;
                
                // Update localStorage
                localStorage.setItem('modelColorDisplay', newState);
                
                // Update toggle appearance and state
                this.setAttribute('aria-checked', newState ? 'true' : 'false');
                
                if (newState) {
                    this.classList.add('bg-blue-500');
                    this.querySelector('span').classList.add('translate-x-6');
                    this.querySelector('span').classList.remove('translate-x-1');
                } else {
                    this.classList.remove('bg-blue-500');
                    this.querySelector('span').classList.remove('translate-x-6');
                    this.querySelector('span').classList.add('translate-x-1');
                }
                
                // Re-apply model color display
                const currentModel = document.querySelector('input[name="model"]').value;
                const currentModelName = document.querySelector(`.model-option[data-value="${currentModel}"]`).getAttribute('data-name');
                updateSelectedModelDisplay(currentModelName);
            });
        }

        function getAssistantPrompt() {
            return localStorage.getItem('assistantPrompt') || DEFAULT_ASSISTANT_PROMPT;
        }

        function createNewWebsite() {
            try {
                // Get selected model
                const selectedModel = document.querySelector('input[name="model"]')?.value || 'openai';
                
                // Reset chat messages based on model
                chatMessages = [
                    {role: "assistant", content: getAssistantPrompt()}
                ];
                
                // Create new website object with unique ID
                const newWebsite = {
                    id: Date.now(),
                    name: `Website ${websites.length + 1}`,
                    prompt: '',
                    html: '',
                    messages: [...chatMessages],
                    lastUpdated: new Date(),
                    versions: []
                };
                
                // Add to websites array
                websites.push(newWebsite);
                currentWebsiteIndex = websites.length - 1;
                currentVersionIndex = -1; // Reset version index for new website
                
                // Show empty state
                showEmptyState();
                
                // Clear the code container
                if (codeContainer) {
                    codeContainer.textContent = '';
                }
                
                // Clear the input
                if (promptInput) {
                    promptInput.value = '';
                }
                
                // Update website list
                renderWebsitesList();
                // Initialize versions list (empty for new site)
                renderVersionsList();
                
                // Save to localStorage
                localStorage.setItem('websites', JSON.stringify(websites));
                localStorage.setItem('currentWebsiteIndex', currentWebsiteIndex);
                localStorage.setItem('currentVersionIndex', currentVersionIndex);
            } catch (error) {
                console.error('Error creating new website:', error);
                alert('There was an error creating a new website. Please try refreshing the page.');
            }
        }

        function showEmptyState() {
            if (previewContainer) {
                previewContainer.innerHTML = `
                    <div class="flex items-center justify-center h-full text-gray-400">
                        <div class="text-center p-8">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p class="text-lg">Enter a prompt to generate your website</p>
                            <p class="text-sm mt-2">Your result will appear here in full screen</p>
                        </div>
                    </div>
                `;
            }
        }

        const assistantPromptInput = document.getElementById('assistant-prompt-input');
        const saveAssistantPromptBtn = document.getElementById('save-assistant-prompt');
        const restoreAssistantPromptBtn = document.getElementById('restore-assistant-prompt');

        if(assistantPromptInput) {
            // Set the textarea value to the current assistant prompt
            assistantPromptInput.value = getAssistantPrompt();

            if(saveAssistantPromptBtn) {
                saveAssistantPromptBtn.addEventListener('click', () => {
                    localStorage.setItem('assistantPrompt', assistantPromptInput.value.trim());
                    alert("Assistant prompt saved!");
                });
            }
            if(restoreAssistantPromptBtn) {
                restoreAssistantPromptBtn.addEventListener('click', () => {
                    assistantPromptInput.value = DEFAULT_ASSISTANT_PROMPT;
                    localStorage.setItem('assistantPrompt', DEFAULT_ASSISTANT_PROMPT);
                    alert("Assistant prompt restored to default!");
                });
            }
        }

        updateStats();
    } catch (error) {
        console.error('Initialization error:', error);
        // Optionally show a user-friendly error message
    }
});