/**
 * AI Career Path Recommender - Frontend Controller
 * Internee.pk Internship Task
 */

// Application State
const state = {
    selectedSkills: [],
    selectedInterests: [],
    currentRecommendation: null,
    activeRoleIndex: 0,
    pastRecommendations: [],
    theme: 'light'
};

// API Endpoints Base
const API_BASE = '/api';

// Loading messages rotation
const LOADING_MESSAGES = [
    "Consulting Gemini 2.5 Flash API...",
    "Analyzing skills & interests profile...",
    "Matching high-demand career fields...",
    "Synthesizing sequential roadmaps...",
    "Calculating learning durations..."
];
let loadingTimer = null;

// DOM Elements
const elements = {
    careerForm: document.getElementById('careerForm'),
    skillInput: document.getElementById('skillInput'),
    addSkillBtn: document.getElementById('addSkillBtn'),
    selectedSkillsContainer: document.getElementById('selectedSkills'),
    
    interestInput: document.getElementById('interestInput'),
    addInterestBtn: document.getElementById('addInterestBtn'),
    selectedInterestsContainer: document.getElementById('selectedInterests'),
    
    submitBtn: document.getElementById('submitBtn'),
    
    placeholderView: document.getElementById('placeholderView'),
    loadingView: document.getElementById('loadingView'),
    loadingStatusText: document.getElementById('loadingStatusText'),
    resultsView: document.getElementById('resultsView'),
    
    currentProfileBadges: document.getElementById('currentProfileBadges'),
    btnSharePlan: document.getElementById('btnSharePlan'),
    roleTabsContainer: document.getElementById('roleTabsContainer'),
    roleDetailsContainer: document.getElementById('roleDetailsContainer'),
    
    toggleHistoryBtn: document.getElementById('toggleHistoryBtn'),
    closeHistoryBtn: document.getElementById('closeHistoryBtn'),
    historyDrawer: document.getElementById('historyDrawer'),
    drawerOverlay: document.getElementById('drawerOverlay'),
    drawerPanel: document.getElementById('drawerPanel'),
    historyListContainer: document.getElementById('historyListContainer'),
    
    themeToggleBtn: document.getElementById('themeToggleBtn')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    checkUrlParams();
});

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        state.theme = 'dark';
        document.documentElement.classList.add('dark');
    } else {
        state.theme = 'light';
        document.documentElement.classList.remove('dark');
    }
    // Ensure toggle button icon reflects current theme (keeps correct icon even if CSS dark variants fail)
    updateThemeIcons();
}

function toggleTheme() {
    if (state.theme === 'dark') {
        state.theme = 'light';
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        state.theme = 'dark';
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
    // Sync icons after theme change
    updateThemeIcons();
}

// Explicitly toggle the theme icons inside the theme button.
function updateThemeIcons() {
    const moon = document.querySelector('#themeToggleBtn .fa-moon');
    const sun = document.querySelector('#themeToggleBtn .fa-sun');
    if (!moon || !sun) return;
    if (state.theme === 'dark') {
        moon.classList.add('hidden');
        sun.classList.remove('hidden');
    } else {
        moon.classList.remove('hidden');
        sun.classList.add('hidden');
    }
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Theme Toggle
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Preset Pill Clicks
    document.querySelectorAll('.preset-skill').forEach(btn => {
        btn.addEventListener('click', () => togglePresetItem(btn, 'skill'));
    });

    document.querySelectorAll('.preset-interest').forEach(btn => {
        btn.addEventListener('click', () => togglePresetItem(btn, 'interest'));
    });

    // Custom Add Buttons
    elements.addSkillBtn.addEventListener('click', addCustomSkill);
    elements.skillInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomSkill();
        }
    });

    elements.addInterestBtn.addEventListener('click', addCustomInterest);
    elements.interestInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomInterest();
        }
    });

    // Form Submission
    elements.careerForm.addEventListener('submit', handleFormSubmit);

    // History Drawer Controls
    elements.toggleHistoryBtn.addEventListener('click', openHistoryDrawer);
    elements.closeHistoryBtn.addEventListener('click', closeHistoryDrawer);
    elements.drawerOverlay.addEventListener('click', closeHistoryDrawer);

    // Share Button
    elements.btnSharePlan.addEventListener('click', copyPlanLink);
}

// --- Skill & Interest Handling ---
function togglePresetItem(button, type) {
    const value = button.getAttribute('data-value');
    if (type === 'skill') {
        if (state.selectedSkills.includes(value)) {
            state.selectedSkills = state.selectedSkills.filter(s => s !== value);
            button.classList.remove('active');
        } else {
            state.selectedSkills.push(value);
            button.classList.add('active');
        }
        renderSelectedSkills();
    } else {
        if (state.selectedInterests.includes(value)) {
            state.selectedInterests = state.selectedInterests.filter(i => i !== value);
            button.classList.remove('active');
        } else {
            state.selectedInterests.push(value);
            button.classList.add('active');
        }
        renderSelectedInterests();
    }
}

function addCustomSkill() {
    const value = elements.skillInput.value.trim();
    if (value && !state.selectedSkills.includes(value)) {
        state.selectedSkills.push(value);
        renderSelectedSkills();
        elements.skillInput.value = '';
        
        // Highlight preset if it matches custom input
        document.querySelectorAll('.preset-skill').forEach(btn => {
            if (btn.getAttribute('data-value').toLowerCase() === value.toLowerCase()) {
                btn.classList.add('active');
            }
        });
    }
}

function addCustomInterest() {
    const value = elements.interestInput.value.trim();
    if (value && !state.selectedInterests.includes(value)) {
        state.selectedInterests.push(value);
        renderSelectedInterests();
        elements.interestInput.value = '';

        // Highlight preset if it matches custom input
        document.querySelectorAll('.preset-interest').forEach(btn => {
            if (btn.getAttribute('data-value').toLowerCase() === value.toLowerCase()) {
                btn.classList.add('active');
            }
        });
    }
}

function removeSkill(skill) {
    state.selectedSkills = state.selectedSkills.filter(s => s !== skill);
    renderSelectedSkills();
    
    // Un-highlight preset pill
    document.querySelectorAll('.preset-skill').forEach(btn => {
        if (btn.getAttribute('data-value') === skill) {
            btn.classList.remove('active');
        }
    });
}

function removeInterest(interest) {
    state.selectedInterests = state.selectedInterests.filter(i => i !== interest);
    renderSelectedInterests();
    
    // Un-highlight preset pill
    document.querySelectorAll('.preset-interest').forEach(btn => {
        if (btn.getAttribute('data-value') === interest) {
            btn.classList.remove('active');
        }
    });
}

function renderSelectedSkills() {
    elements.selectedSkillsContainer.innerHTML = '';
    
    if (state.selectedSkills.length === 0) {
        elements.selectedSkillsContainer.innerHTML = `
            <p class="text-xs text-slate-400 dark:text-slate-500 italic my-auto">Select preset skills or type above to add...</p>
        `;
        return;
    }

    state.selectedSkills.forEach(skill => {
        const pill = document.createElement('div');
        pill.className = 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800 transition-all';
        pill.innerHTML = `
            <span>${skill}</span>
            <button type="button" class="w-4 h-4 rounded-full bg-violet-200 dark:bg-violet-900 hover:bg-violet-300 dark:hover:bg-violet-800 flex items-center justify-center transition-colors text-[10px]" aria-label="Remove skill">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        
        pill.querySelector('button').addEventListener('click', () => removeSkill(skill));
        elements.selectedSkillsContainer.appendChild(pill);
    });
}

function renderSelectedInterests() {
    elements.selectedInterestsContainer.innerHTML = '';
    
    if (state.selectedInterests.length === 0) {
        elements.selectedInterestsContainer.innerHTML = `
            <p class="text-xs text-slate-400 dark:text-slate-500 italic my-auto">Select preset interests or type above to add...</p>
        `;
        return;
    }

    state.selectedInterests.forEach(interest => {
        const pill = document.createElement('div');
        pill.className = 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all';
        pill.innerHTML = `
            <span>${interest}</span>
            <button type="button" class="w-4 h-4 rounded-full bg-indigo-200 dark:bg-indigo-900 hover:bg-indigo-300 dark:hover:bg-indigo-800 flex items-center justify-center transition-colors text-[10px]" aria-label="Remove interest">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        
        pill.querySelector('button').addEventListener('click', () => removeInterest(interest));
        elements.selectedInterestsContainer.appendChild(pill);
    });
}

// --- Loading Screen Animations ---
function startLoadingTimer() {
    let index = 0;
    elements.loadingStatusText.innerText = LOADING_MESSAGES[0];
    
    loadingTimer = setInterval(() => {
        index = (index + 1) % LOADING_MESSAGES.length;
        // Fade effect
        elements.loadingStatusText.style.opacity = 0;
        setTimeout(() => {
            elements.loadingStatusText.innerText = LOADING_MESSAGES[index];
            elements.loadingStatusText.style.opacity = 1;
        }, 300);
    }, 2000);
}

function stopLoadingTimer() {
    if (loadingTimer) {
        clearInterval(loadingTimer);
        loadingTimer = null;
    }
}

// --- API Submissions & Loading ---
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (state.selectedSkills.length === 0 || state.selectedInterests.length === 0) {
        alert("Please add at least one skill and one interest to receive an AI recommendation.");
        return;
    }

    // Toggle views
    elements.placeholderView.classList.add('hidden');
    elements.resultsView.classList.add('hidden');
    elements.loadingView.classList.remove('hidden');
    
    startLoadingTimer();

    try {
        const response = await fetch(`${API_BASE}/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                skills: state.selectedSkills,
                interests: state.selectedInterests
            })
        });

        if (!response.ok) {
            throw new Error(`API failed: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Save state
        state.currentRecommendation = data;
        state.activeRoleIndex = 0;
        
        // Push ID to URL
        updateUrlParams(data.id);
        
        // Render
        renderRecommendationResults();
        
    } catch (error) {
        console.error("Error generating path:", error);
        alert("Oops! We encountered an error generating your career paths. Please check your API connectivity and try again.");
        elements.placeholderView.classList.remove('hidden');
    } finally {
        stopLoadingTimer();
        elements.loadingView.classList.add('hidden');
    }
}

// --- Result Rendering ---
function renderRecommendationResults() {
    if (!state.currentRecommendation) return;
    
    const rec = state.currentRecommendation;
    const roles = rec.career_data.recommended_roles || [];
    
    // Show main view
    elements.resultsView.classList.remove('hidden');
    
    // Render Profile Badges
    elements.currentProfileBadges.innerHTML = '';
    rec.skills.forEach(s => {
        elements.currentProfileBadges.innerHTML += `
            <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-900">${s}</span>
        `;
    });
    rec.interests.forEach(i => {
        elements.currentProfileBadges.innerHTML += `
            <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">${i}</span>
        `;
    });

    // Render Role Tabs
    elements.roleTabsContainer.innerHTML = '';
    roles.forEach((role, index) => {
        // Calculate progress percentage for this specific role
        const path = role.learning_path || [];
        const total = path.length;
        const completed = path.filter(t => t.is_completed).length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

        const activeClass = index === state.activeRoleIndex 
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white dark:text-white shadow-md'
            : 'bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';

        const tab = document.createElement('button');
        tab.className = `flex flex-col items-start px-4 py-3 text-left rounded-xl border font-semibold text-sm transition-all duration-200 select-none md:w-full gap-1 ${activeClass}`;
        tab.innerHTML = `
            <span class="truncate block w-full">${role.job_role}</span>
            <div class="flex items-center justify-between w-full text-[10px] opacity-80 font-medium">
                <span class="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">${role.difficulty_level}</span>
                <span>${pct}% Done</span>
            </div>
        `;
        
        tab.addEventListener('click', () => {
            state.activeRoleIndex = index;
            renderRecommendationResults(); // re-render layout to update active states
        });
        
        elements.roleTabsContainer.appendChild(tab);
    });

    // Render Details for Active Role
    renderRoleDetails(roles[state.activeRoleIndex]);
}

function renderRoleDetails(role) {
    if (!role) {
        elements.roleDetailsContainer.innerHTML = '<p class="text-slate-400 italic">No role details found.</p>';
        return;
    }

    // Colors based on difficulty
    let difficultyColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
    if (role.difficulty_level.toLowerCase() === 'intermediate') {
        difficultyColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900';
    } else if (role.difficulty_level.toLowerCase() === 'advanced') {
        difficultyColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900';
    }

    const learningPath = role.learning_path || [];
    const totalTopics = learningPath.length;
    const completedTopics = learningPath.filter(t => t.is_completed).length;
    const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    let containerHtml = `
        <div class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 class="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">${role.job_role}</h3>
                <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold border ${difficultyColor}">
                        ${role.difficulty_level}
                    </span>
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                        <i class="fa-regular fa-clock mr-1"></i> ${role.estimated_time_total}
                    </span>
                </div>
            </div>
            
            <p class="text-slate-600 dark:text-slate-350 text-sm leading-relaxed">
                ${role.description}
            </p>
        </div>

        <!-- Progress Tracker Bar -->
        <div class="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
            <div class="flex justify-between items-center text-sm">
                <span class="font-bold text-slate-750 dark:text-slate-300">Learning Path Progress</span>
                <span class="font-bold text-indigo-600 dark:text-indigo-400">${completionPercentage}% Complete</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                <div class="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full transition-all duration-500" style="width: ${completionPercentage}%"></div>
            </div>
            <p class="text-[11px] text-slate-400 dark:text-slate-500 text-right font-medium">
                ${completedTopics} of ${totalTopics} topics completed
            </p>
        </div>

        <!-- Timeline Steps -->
        <div class="space-y-6 pt-4">
            <h4 class="text-base font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <i class="fa-solid fa-list-check text-indigo-500"></i>
                Roadmap Topics
            </h4>
            <div class="space-y-4 relative">
    `;

    learningPath.forEach((topic, idx) => {
        const isChecked = topic.is_completed;
        const stepNum = idx + 1;
        
        containerHtml += `
            <div class="roadmap-step flex items-start gap-4">
                <!-- Checkbox Icon Circle -->
                <button onclick="toggleTopicCompletion('${role.job_role}', '${topic.title}', ${!isChecked})" 
                        class="w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0 z-10 
                               ${isChecked 
                                 ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/20' 
                                 : 'bg-white dark:bg-slate-900 border-slate-350 dark:border-slate-700 hover:border-violet-500 text-slate-300 hover:text-slate-400'}">
                    ${isChecked ? '<i class="fa-solid fa-check text-sm"></i>' : `<span class="text-xs font-bold font-sans">${stepNum}</span>`}
                </button>
                
                <!-- Topic Card -->
                <div class="flex-1 p-5 rounded-2xl border transition-all duration-300 bg-white dark:bg-slate-900 
                            ${isChecked 
                              ? 'topic-card-checked border-violet-300 dark:border-violet-900/60 shadow-sm' 
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h5 class="text-sm font-bold ${isChecked ? 'text-violet-900 dark:text-violet-200' : 'text-slate-900 dark:text-white'}">
                            ${topic.title}
                        </h5>
                        <span class="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            ${topic.estimated_weeks} ${topic.estimated_weeks === 1 ? 'Week' : 'Weeks'}
                        </span>
                    </div>
                    <p class="text-xs ${isChecked ? 'text-violet-900/70 dark:text-violet-300/70' : 'text-slate-500 dark:text-slate-400'} leading-relaxed">
                        ${topic.description}
                    </p>
                </div>
            </div>
        `;
    });

    containerHtml += `
            </div>
        </div>
    `;

    elements.roleDetailsContainer.innerHTML = containerHtml;
}

// --- Toggle Topic Progress ---
async function toggleTopicCompletion(roleName, topicTitle, isCompleted) {
    if (!state.currentRecommendation) return;
    
    const recId = state.currentRecommendation.id;

    try {
        const response = await fetch(`${API_BASE}/progress/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recommendation_id: recId,
                role_name: roleName,
                topic_title: topicTitle,
                is_completed: isCompleted
            })
        });

        if (!response.ok) throw new Error("Toggle API failed");

        const data = await response.json();
        
        // Update local state directly
        const roles = state.currentRecommendation.career_data.recommended_roles;
        const activeRole = roles[state.activeRoleIndex];
        const topic = activeRole.learning_path.find(t => t.title === topicTitle);
        
        if (topic) {
            topic.is_completed = data.is_completed;
        }

        // Re-render UI to update progress bar and classes
        renderRecommendationResults();
        
    } catch (error) {
        console.error("Error toggling progress:", error);
        alert("Failed to save progress update. Please check database connection.");
    }
}

// Global hook so inline onclick works
window.toggleTopicCompletion = toggleTopicCompletion;

// --- History Drawer & Past Recommendations ---
async function openHistoryDrawer() {
    elements.historyDrawer.classList.remove('pointer-events-none');
    elements.drawerOverlay.classList.add('show');
    elements.drawerPanel.classList.add('show');

    // Fetch list from database
    elements.historyListContainer.innerHTML = `
        <div class="text-center text-slate-400 py-12 animate-pulse">
            <i class="fa-solid fa-spinner animate-spin text-2xl mb-2"></i>
            <p class="text-xs">Loading history...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE}/recommendations`);
        if (!response.ok) throw new Error("Fetch history failed");

        const list = await response.json();
        state.pastRecommendations = list;
        renderHistoryList();
    } catch (error) {
        console.error("Error listing history:", error);
        elements.historyListContainer.innerHTML = `
            <div class="text-center text-rose-500 py-8">
                <i class="fa-solid fa-triangle-exclamation text-3xl mb-2"></i>
                <p class="text-xs">Failed to load recommendations.</p>
            </div>
        `;
    }
}

function closeHistoryDrawer() {
    elements.drawerOverlay.classList.remove('show');
    elements.drawerPanel.classList.remove('show');
    
    // Disable clicks after animation complete
    setTimeout(() => {
        elements.historyDrawer.classList.add('pointer-events-none');
    }, 300);
}

function renderHistoryList() {
    elements.historyListContainer.innerHTML = '';
    
    if (state.pastRecommendations.length === 0) {
        elements.historyListContainer.innerHTML = `
            <div class="text-center text-slate-400 dark:text-slate-505 py-12">
                <i class="fa-solid fa-folder-open text-4xl mb-3 block"></i>
                <p class="text-sm">No records found. Generate a plan first!</p>
            </div>
        `;
        return;
    }

    state.pastRecommendations.forEach(item => {
        const dateStr = new Date(item.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const card = document.createElement('button');
        card.className = 'w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 hover:border-violet-500 dark:hover:border-violet-500 hover:shadow-md transition-all duration-200 flex flex-col gap-2 select-none group';
        
        // Compile role badges
        const rolesHtml = item.roles.map(r => `
            <span class="px-1.5 py-0.5 text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded">${r}</span>
        `).join('');

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <span class="text-[10px] font-semibold text-slate-450 dark:text-slate-500">${dateStr}</span>
                <span class="text-[10px] font-bold text-violet-600 dark:text-violet-400 group-hover:underline flex items-center gap-1">
                    Load Plan <i class="fa-solid fa-chevron-right text-[8px]"></i>
                </span>
            </div>
            
            <div class="flex flex-wrap gap-1">
                ${rolesHtml}
            </div>

            <!-- Mini Progress bar -->
            <div class="w-full mt-1">
                <div class="flex justify-between text-[9px] text-slate-400 mb-1">
                    <span>Skills: ${item.skills.slice(0, 3).join(', ')}${item.skills.length > 3 ? '...' : ''}</span>
                    <span class="font-bold">${item.progress_percentage}% Done</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-violet-600 h-full rounded-full" style="width: ${item.progress_percentage}%"></div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            loadPastRecommendation(item.id);
            closeHistoryDrawer();
        });

        elements.historyListContainer.appendChild(card);
    });
}

async function loadPastRecommendation(id) {
    // Show loading skeleton
    elements.placeholderView.classList.add('hidden');
    elements.resultsView.classList.add('hidden');
    elements.loadingView.classList.remove('hidden');
    elements.loadingStatusText.innerText = "Retrieving saved roadmap...";

    try {
        const response = await fetch(`${API_BASE}/recommendations/${id}`);
        if (!response.ok) throw new Error("Load failed");

        const data = await response.json();
        
        // Save to state
        state.currentRecommendation = data;
        state.activeRoleIndex = 0;
        
        // Set form fields based on loaded recommendation for convenience
        state.selectedSkills = [...data.skills];
        state.selectedInterests = [...data.interests];
        renderSelectedSkills();
        renderSelectedInterests();
        
        // Sync preset selection buttons
        document.querySelectorAll('.preset-skill').forEach(btn => {
            if (state.selectedSkills.includes(btn.getAttribute('data-value'))) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        document.querySelectorAll('.preset-interest').forEach(btn => {
            if (state.selectedInterests.includes(btn.getAttribute('data-value'))) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Set URL params
        updateUrlParams(id);

        // Render results
        renderRecommendationResults();
        
    } catch (error) {
        console.error("Load plan error:", error);
        alert("Failed to load the selected career plan.");
        elements.placeholderView.classList.remove('hidden');
    } finally {
        elements.loadingView.classList.add('hidden');
    }
}

// --- Share Link Functionality ---
function copyPlanLink() {
    if (!state.currentRecommendation) return;
    
    const url = new URL(window.location.href);
    url.searchParams.set('id', state.currentRecommendation.id);
    
    navigator.clipboard.writeText(url.toString())
        .then(() => {
            // Toast notification or toggle text
            const originalText = elements.btnSharePlan.innerHTML;
            elements.btnSharePlan.innerHTML = `<i class="fa-solid fa-check text-emerald-500"></i> Link Copied!`;
            elements.btnSharePlan.classList.add('border-emerald-300', 'bg-emerald-50', 'dark:bg-emerald-950/20');
            
            setTimeout(() => {
                elements.btnSharePlan.innerHTML = originalText;
                elements.btnSharePlan.classList.remove('border-emerald-300', 'bg-emerald-50', 'dark:bg-emerald-950/20');
            }, 2000);
        })
        .catch(err => {
            console.error("Copy failed:", err);
            alert("Could not copy link automatically. Link is: " + url.toString());
        });
}

function updateUrlParams(id) {
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    window.history.pushState({ path: url.toString() }, '', url.toString());
}

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
        loadPastRecommendation(id);
    }
}
