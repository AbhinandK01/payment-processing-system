// app.js - Payment Processing System Core Application Engine

// ==========================================================================
// STATE VARIABLES
// ==========================================================================
let bankBalance = 100000.00; // Starting sandbox balance
let activeMethod = 'credit-card';
let selectedFile = 'Payment.java';
let isRunningTrace = false;
let isBalanceRevealed = false;
let editingMethodId = null; // Track if we are editing an account

let userProfile = { 
    isLoggedIn: false, 
    name: '', 
    email: '', 
    avatar: '' 
};

// Clean default states for local storage lists
let transactions = [];
let savedMethods = [];
let refundRequests = [];

// Storage Keys
const LS_METHODS_KEY = 'paynova_saved_payment_methods';
const LS_TXNS_KEY = 'paynova_transactions_ledger';
const LS_REFUNDS_KEY = 'paynova_refunds_ledger';
const LS_BALANCE_KEY = 'paynova_bank_balance';

// ==========================================================================
// INITIAL SETUP & EVENT HANDLERS
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Storage & Database loading
    initDatabase();
    updateBalanceDisplay();
    renderTransactions();
    loadSavedMethods();
    renderRefundLedger();
    loadJavaCode(selectedFile);
    initGoogleIdentityServices();

    // 2. Google OAuth client configuration panel
    const oauthToggle = document.getElementById('oauth-toggle-btn');
    const oauthBox = document.getElementById('oauth-config-box');
    if (oauthToggle && oauthBox) {
        oauthToggle.addEventListener('click', () => {
            oauthBox.style.display = oauthBox.style.display === 'none' ? 'block' : 'none';
        });
    }

    const saveClientIdBtn = document.getElementById('save-client-id-btn');
    if (saveClientIdBtn) {
        saveClientIdBtn.addEventListener('click', () => {
            const inputId = document.getElementById('oauth-client-id').value.trim();
            if (inputId) {
                localStorage.setItem('google_oauth_client_id', inputId);
                showToast('Google Client ID updated. Reloading auth configuration...', 'info');
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast('Please enter a valid Google Client ID', 'error');
            }
        });
    }

    const savedClientId = localStorage.getItem('google_oauth_client_id');
    if (savedClientId && document.getElementById('oauth-client-id')) {
        document.getElementById('oauth-client-id').value = savedClientId;
    }

    // 3. Fallback Guest Sandbox Trigger
    const guestTriggerBtn = document.getElementById('guest-login-trigger-btn');
    const guestModal = document.getElementById('guest-setup-modal');
    if (guestTriggerBtn && guestModal) {
        guestTriggerBtn.addEventListener('click', () => {
            guestModal.classList.add('active');
        });
    }

    const guestCancelBtn = document.getElementById('guest-setup-cancel-btn');
    if (guestCancelBtn && guestModal) {
        guestCancelBtn.addEventListener('click', () => {
            guestModal.classList.remove('active');
        });
    }

    const guestForm = document.getElementById('guest-setup-form');
    if (guestForm) {
        guestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameVal = document.getElementById('guest-input-name').value.trim();
            const emailVal = document.getElementById('guest-input-email').value.trim();
            if (nameVal && emailVal) {
                const guestUser = {
                    name: nameVal,
                    email: emailVal,
                    picture: '' // Default text initials avatar
                };
                guestModal.classList.remove('active');
                completeLogin(guestUser);
            }
        });
    }

    // Google Sandbox Simulation Modal
    const googleTriggerBtn = document.getElementById('google-login-trigger-btn');
    const googleSimModal = document.getElementById('google-sim-modal');
    const googleSimCancelBtn = document.getElementById('google-sim-cancel-btn');
    const googleCustomForm = document.getElementById('google-custom-form');
    const googleAccountsList = document.querySelector('.google-accounts-list');
    const googleCustomBackBtn = document.getElementById('google-custom-back-btn');

    if (googleTriggerBtn && googleSimModal) {
        googleTriggerBtn.addEventListener('click', () => {
            // Reset modal states
            if (googleAccountsList) googleAccountsList.style.display = 'flex';
            if (googleCustomForm) googleCustomForm.style.display = 'none';
            googleSimModal.classList.add('active');
        });
    }

    if (googleSimCancelBtn && googleSimModal) {
        googleSimCancelBtn.addEventListener('click', () => {
            googleSimModal.classList.remove('active');
        });
    }

    if (googleCustomBackBtn && googleCustomForm && googleAccountsList) {
        googleCustomBackBtn.addEventListener('click', () => {
            googleCustomForm.style.display = 'none';
            googleAccountsList.style.display = 'flex';
        });
    }

    // Handle predefined account click
    const accountItems = document.querySelectorAll('.google-account-item');
    accountItems.forEach(item => {
        item.addEventListener('click', () => {
            const accType = item.getAttribute('data-account');
            if (accType === 'custom') {
                if (googleAccountsList) googleAccountsList.style.display = 'none';
                if (googleCustomForm) googleCustomForm.style.display = 'block';
            } else {
                let name = '';
                let email = '';
                let picture = '';
                
                if (accType === 'sarah') {
                    name = 'Sarah Jenkins';
                    email = 'sarah.jenkins@gmail.com';
                    picture = `https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah`;
                } else if (accType === 'alex') {
                    name = 'Alex Mercer';
                    email = 'alex.mercer@gmail.com';
                    picture = `https://api.dicebear.com/7.x/avataaars/svg?seed=Alex`;
                }
                
                const googleUser = { name, email, picture };
                googleSimModal.classList.remove('active');
                completeLogin(googleUser);
                showToast(`Signed in as ${name} (Simulated Google Auth)`, 'success');
            }
        });
    });

    if (googleCustomForm && googleSimModal) {
        googleCustomForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameVal = document.getElementById('google-custom-name').value.trim();
            const emailVal = document.getElementById('google-custom-email').value.trim();
            if (nameVal && emailVal) {
                const googleUser = {
                    name: nameVal,
                    email: emailVal,
                    picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nameVal)}`
                };
                googleSimModal.classList.remove('active');
                completeLogin(googleUser);
                showToast(`Signed in as ${nameVal} (Simulated Google Auth)`, 'success');
            }
        });
    }

    // 4. Logout trigger
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', executeSignOut);
    }

    // 5. Sidebar view panel switching
    const sidebarBtns = document.querySelectorAll('.sidebar-btn');
    sidebarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sidebarBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const viewKey = btn.getAttribute('data-view');
            switchMainView(viewKey);
        });
    });

    // Mobile Hamburger Menu Toggle
    const menuToggle = document.getElementById('menu-toggle-btn');
    const sidebarElement = document.querySelector('.sidebar');
    if (menuToggle && sidebarElement) {
        menuToggle.addEventListener('click', () => {
            sidebarElement.classList.toggle('mobile-open');
        });
    }

    // Dashboard Quick Actions navigation mapping
    const quickBtns = document.querySelectorAll('.quick-action-btn');
    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.getAttribute('data-nav');
            const targetNavBtn = document.querySelector(`.sidebar-btn[data-view="${targetView}"]`);
            if (targetNavBtn) {
                targetNavBtn.click();
            }
        });
    });

    // 6. Payment Instrument cards switching
    const methodCards = document.querySelectorAll('.method-card');
    methodCards.forEach(card => {
        card.addEventListener('click', (e) => {
            createRipple(e);
            methodCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            activeMethod = card.getAttribute('data-method');
            switchPaymentForm(activeMethod);
        });
    });

    // 7. IDE file tabs selector
    const ideTabs = document.querySelectorAll('.ide-tab');
    ideTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            ideTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            selectedFile = tab.getAttribute('data-file');
            loadJavaCode(selectedFile);
        });
    });

    // 8. Console window tab switcher
    const consoleBtns = document.querySelectorAll('.console-tab-btn');
    consoleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            consoleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-tab');
            document.querySelectorAll('.console-tab-content').forEach(el => el.style.display = 'none');
            document.getElementById(`${target}-content`).style.display = 'block';
        });
    });

    // 9. Saved methods drawer controls
    const openAddCardBtn = document.getElementById('open-add-card-btn');
    const closeCardDrawerBtn = document.getElementById('close-card-drawer-btn');
    const addCardDrawer = document.getElementById('add-card-drawer');
    
    if (openAddCardBtn && addCardDrawer) {
        openAddCardBtn.addEventListener('click', () => {
            resetSavedMethodForm();
            addCardDrawer.style.display = 'block';
        });
    }
    if (closeCardDrawerBtn && addCardDrawer) {
        closeCardDrawerBtn.addEventListener('click', () => {
            addCardDrawer.style.display = 'none';
        });
    }

    // Saved methods drawer toggle subfields on type change
    const methodTypeSelect = document.getElementById('method-add-type');
    if (methodTypeSelect) {
        methodTypeSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            document.getElementById('drawer-fields-cc').style.display = val === 'CreditCard' ? 'block' : 'none';
            document.getElementById('drawer-fields-pp').style.display = val === 'PayPal' ? 'block' : 'none';
            document.getElementById('drawer-fields-bt').style.display = val === 'BankTransfer' ? 'block' : 'none';
        });
    }

    const saveNewMethodBtn = document.getElementById('save-new-method-btn');
    if (saveNewMethodBtn) {
        saveNewMethodBtn.addEventListener('click', saveOrUpdateSavedMethod);
    }

    // 10. Check Balance Reveal button handler
    const checkBalanceBtn = document.getElementById('check-balance-btn');
    const hideBalanceBtn = document.getElementById('hide-balance-btn');
    const balanceDisplayContainer = document.getElementById('balance-display-container');

    if (checkBalanceBtn && balanceDisplayContainer) {
        checkBalanceBtn.addEventListener('click', () => {
            isBalanceRevealed = true;
            checkBalanceBtn.style.display = 'none';
            balanceDisplayContainer.style.display = 'flex';
            updateBalanceDisplay();
            showToast('Bank balance retrieved securely', 'info');
        });
    }

    if (hideBalanceBtn && checkBalanceBtn && balanceDisplayContainer) {
        hideBalanceBtn.addEventListener('click', () => {
            isBalanceRevealed = false;
            balanceDisplayContainer.style.display = 'none';
            checkBalanceBtn.style.display = 'inline-flex';
        });
    }

    // 11. Checkout Form Submissions
    document.getElementById('credit-card-form').addEventListener('submit', handleCCSubmit);
    document.getElementById('paypal-form').addEventListener('submit', handlePayPalSubmit);
    document.getElementById('bank-transfer-form').addEventListener('submit', handleBankTransferSubmit);

    // 12. Refund Form Auto-population on dropdown selection
    const refundSelect = document.getElementById('refund-txn-select');
    if (refundSelect) {
        refundSelect.addEventListener('change', handleRefundSelectionChange);
    }
    document.getElementById('refund-portal-form').addEventListener('submit', handleRefundFormSubmit);

    // 13. Receipt Modals actions
    document.getElementById('close-receipt-btn').addEventListener('click', () => {
        document.getElementById('receipt-modal').classList.remove('active');
    });
    document.getElementById('print-receipt-btn').addEventListener('click', () => window.print());
    document.getElementById('pdf-receipt-btn').addEventListener('click', () => window.print());

    // 14. Expiry Date slash formatter (Credit Cards)
    const cardExpInputs = ['cc-expiry', 'method-cc-exp'];
    cardExpInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.length > 2) val = val.substring(0,2) + '/' + val.substring(2,4);
                e.target.value = val;
            });
        }
    });

    // 15. Card number spacer formatters
    const ccNumInputs = ['cc-number', 'method-cc-number'];
    ccNumInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                let val = e.target.value.replace(/\D/g, '');
                let formatted = '';
                for (let i = 0; i < val.length; i++) {
                    if (i > 0 && i % 4 === 0) formatted += ' ';
                    formatted += val[i];
                }
                e.target.value = formatted;
            });
        }
    });
});

// ==========================================================================
// DATABASE / STORAGE ENGINE
// ==========================================================================
function initDatabase() {
    // Read bank balance amount
    const savedBal = localStorage.getItem(LS_BALANCE_KEY);
    if (savedBal !== null) {
        bankBalance = parseFloat(savedBal);
    } else {
        localStorage.setItem(LS_BALANCE_KEY, bankBalance.toString());
    }

    // Saved methods
    const savedMethodsData = localStorage.getItem(LS_METHODS_KEY);
    if (savedMethodsData) {
        savedMethods = JSON.parse(savedMethodsData);
    } else {
        savedMethods = [];
        saveMethodsToStorage();
    }

    // Ledger transactions
    const savedTxns = localStorage.getItem(LS_TXNS_KEY);
    if (savedTxns) {
        transactions = JSON.parse(savedTxns);
    } else {
        transactions = [];
        saveTransactionsToStorage();
    }

    // Refunds requests log
    const savedRefunds = localStorage.getItem(LS_REFUNDS_KEY);
    if (savedRefunds) {
        refundRequests = JSON.parse(savedRefunds);
    } else {
        refundRequests = [];
        saveRefundsToStorage();
    }

    // Restore login session
    const sessionUser = sessionStorage.getItem('logged_in_user');
    if (sessionUser) {
        userProfile = JSON.parse(sessionUser);
        completeLogin(userProfile, false);
    }
}

function saveMethodsToStorage() { localStorage.setItem(LS_METHODS_KEY, JSON.stringify(savedMethods)); }
function saveTransactionsToStorage() { localStorage.setItem(LS_TXNS_KEY, JSON.stringify(transactions)); }
function saveRefundsToStorage() { localStorage.setItem(LS_REFUNDS_KEY, JSON.stringify(refundRequests)); }
function saveBalanceToStorage() { localStorage.setItem(LS_BALANCE_KEY, bankBalance.toString()); }

// ==========================================================================
// GOOGLE IDENTITY SERVICES OAUTH
// ==========================================================================
function initGoogleIdentityServices() {
    const isLocalFile = window.location.protocol === 'file:';
    const clientId = localStorage.getItem('google_oauth_client_id') || '';
    const gisWrapper = document.getElementById('gis-sign-in-wrapper');
    const googleTriggerBtn = document.getElementById('google-login-trigger-btn');

    // If protocol is local file or client ID is empty, bypass button render and use Simulated Fallback mode
    if (isLocalFile || !clientId) {
        if (gisWrapper) gisWrapper.style.display = 'none';
        if (googleTriggerBtn) googleTriggerBtn.style.display = 'flex';
        return;
    }

    // Initialize GIS Client Standard rendering
    try {
        if (googleTriggerBtn) googleTriggerBtn.style.display = 'none';
        if (gisWrapper) gisWrapper.style.display = 'flex';
        
        const onloadDiv = document.getElementById('g_id_onload');
        if (onloadDiv) {
            onloadDiv.setAttribute('data-client_id', clientId);
            onloadDiv.setAttribute('data-callback', 'handleGoogleSignInResponse');
        }

        logToJVM(`[System] Initialized Google Identity Services client using client ID: ${clientId.substring(0, 12)}...`);
    } catch (err) {
        console.error("GIS load failed", err);
        if (gisWrapper) gisWrapper.style.display = 'none';
        if (googleTriggerBtn) googleTriggerBtn.style.display = 'flex';
    }
}

window.handleGoogleSignInResponse = function(response) {
    const payload = decodeJwtResponse(response.credential);
    if (payload) {
        const googleUser = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture
        };
        completeLogin(googleUser);
    } else {
        showToast('Google credentials decoding failed', 'error');
    }
};

function decodeJwtResponse(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("JWT decoding failed", e);
        return null;
    }
}

function completeLogin(userData, showWelcome = true) {
    userProfile.isLoggedIn = true;
    userProfile.name = userData.name;
    userProfile.email = userData.email;
    userProfile.avatar = userData.picture;

    sessionStorage.setItem('logged_in_user', JSON.stringify(userProfile));

    // Update Profile widgets
    const avatarDiv = document.getElementById('user-avatar');
    if (avatarDiv) {
        if (userProfile.avatar) {
            avatarDiv.innerHTML = `<img src="${userProfile.avatar}" referrerPolicy="no-referrer">`;
        } else {
            const initials = userProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            avatarDiv.textContent = initials || 'G';
        }
    }
    
    const uName = document.getElementById('user-name');
    const uEmail = document.getElementById('user-email');
    if (uName) uName.textContent = userProfile.name;
    if (uEmail) uEmail.textContent = userProfile.email;

    // Update welcome header texts
    const welcomeTitle = document.getElementById('welcome-text');
    if (welcomeTitle) {
        welcomeTitle.textContent = `Welcome back, ${userProfile.name.split(' ')[0]}!`;
    }

    // Auto populate checkout name if empty
    const ccNameInput = document.getElementById('cc-name');
    if (ccNameInput && !ccNameInput.value) {
        ccNameInput.value = userProfile.name;
    }

    // Transition Screens
    document.getElementById('landing-screen').classList.remove('active');
    setTimeout(() => {
        document.getElementById('landing-screen').style.display = 'none';
        const dash = document.getElementById('dashboard-screen');
        dash.style.display = 'flex';
        
        // Hide balance on load
        isBalanceRevealed = false;
        document.getElementById('balance-display-container').style.display = 'none';
        document.getElementById('check-balance-btn').style.display = 'inline-flex';
        
        setTimeout(() => {
            dash.classList.add('active');
            updateOverviewStats();
            populateRefundTxnDropdown();
            
            if (showWelcome) {
                showToast(`Access granted. Hello, ${userProfile.name}!`, 'success');
                logToJVM(`[JVM] Secure sandbox authorization successful. Session created for user email: ${userProfile.email}`);
            }
        }, 50);
    }, 400);
}

function executeSignOut() {
    userProfile.isLoggedIn = false;
    userProfile.name = '';
    userProfile.email = '';
    userProfile.avatar = '';

    sessionStorage.removeItem('logged_in_user');

    // Reset layout fields
    const uName = document.getElementById('user-name');
    const uEmail = document.getElementById('user-email');
    const avatarDiv = document.getElementById('user-avatar');
    
    if (uName) uName.textContent = 'Guest User';
    if (uEmail) uEmail.textContent = 'unauthenticated';
    if (avatarDiv) {
        avatarDiv.textContent = 'G';
        avatarDiv.innerHTML = 'G';
    }

    // Reset balance visibility
    isBalanceRevealed = false;
    document.getElementById('balance-display-container').style.display = 'none';
    document.getElementById('check-balance-btn').style.display = 'inline-flex';

    // Transition back to login
    const dash = document.getElementById('dashboard-screen');
    dash.classList.remove('active');
    setTimeout(() => {
        dash.style.display = 'none';
        const landing = document.getElementById('landing-screen');
        landing.style.display = 'flex';
        
        // Reset modals/inputs
        document.getElementById('guest-input-name').value = '';
        document.getElementById('guest-input-email').value = '';
        
        const customName = document.getElementById('google-custom-name');
        const customEmail = document.getElementById('google-custom-email');
        if (customName) customName.value = '';
        if (customEmail) customEmail.value = '';
        
        setTimeout(() => {
            landing.classList.add('active');
            showToast('Signed out of active session successfully.', 'info');
            logToJVM('[JVM] User session destroyed. Deallocating memory hooks.');
        }, 50);
    }, 400);
}

// ==========================================================================
// RENDER VIEWS & NAVIGATION
// ==========================================================================
function switchMainView(viewKey) {
    // Hide drawer if open
    document.getElementById('add-card-drawer').style.display = 'none';

    // Update title header
    const pageTitle = document.getElementById('page-title');
    const titles = {
        'dashboard': 'Dashboard Overview',
        'checkout': 'Payments checkout Portal',
        'saved-methods': 'Linked payment instruments',
        'refunds': 'Gateway Refund Portal',
        'developer': 'Java OOP Demonstration'
    };
    if (pageTitle) pageTitle.textContent = titles[viewKey] || 'Payment Processing System';

    // Switch panels
    document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
    
    const targetPanel = document.getElementById(`view-${viewKey}`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    // Mobile sidebar auto collapse on view select
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.remove('mobile-open');
    }

    // Refresh contents
    if (viewKey === 'dashboard') {
        updateOverviewStats();
        renderTransactions();
    } else if (viewKey === 'saved-methods') {
        loadSavedMethods();
    } else if (viewKey === 'checkout') {
        renderSavedMethodsDropdownCheckout();
    } else if (viewKey === 'refunds') {
        populateRefundTxnDropdown();
        renderRefundLedger();
    } else if (viewKey === 'developer') {
        loadJavaCode(selectedFile);
    }
}

function updateBalanceDisplay() {
    const balText = document.getElementById('balance-display');
    if (balText) {
        balText.textContent = `₹${bankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

function updateOverviewStats() {
    let totalVolume = 0;
    transactions.forEach(t => {
        if (t.status === 'SUCCESS' && t.refundStatus !== 'REFUNDED') {
            totalVolume += t.amount;
        }
    });

    const statVolume = document.getElementById('stat-volume');
    const statTx = document.getElementById('stat-tx-count');
    const statMethods = document.getElementById('stat-methods-count');

    if (statVolume) statVolume.textContent = `₹${totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (statTx) statTx.textContent = transactions.length.toString();
    if (statMethods) statMethods.textContent = savedMethods.length.toString();
}

function switchPaymentForm(method) {
    const badge = document.getElementById('form-method-badge');
    document.querySelectorAll('.payment-form').forEach(f => f.classList.remove('active'));
    document.getElementById('form-error-alert').style.display = 'none';

    if (method === 'credit-card') {
        badge.textContent = 'Card Payment';
        badge.style.color = 'var(--primary-color)';
        badge.style.background = 'rgba(37, 99, 235, 0.1)';
        document.getElementById('credit-card-form').classList.add('active');
    } else if (method === 'paypal') {
        badge.textContent = 'PayPal Wallet';
        badge.style.color = 'var(--accent-teal)';
        badge.style.background = 'rgba(20, 184, 166, 0.1)';
        document.getElementById('paypal-form').classList.add('active');
    } else if (method === 'bank-transfer') {
        badge.textContent = 'Bank Account Transfer';
        badge.style.color = '#7c3aed';
        badge.style.background = 'rgba(124, 58, 237, 0.1)';
        document.getElementById('bank-transfer-form').classList.add('active');
    }
}

// ==========================================================================
// TRANSACTIONS LEDGER LISTS
// ==========================================================================
function renderTransactions() {
    const list = document.getElementById('dashboard-txns-list');
    if (!list) return;
    list.innerHTML = '';

    if (transactions.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:36px 12px;color:var(--text-muted);font-size:0.8rem;background:white;border-radius:12px;border:1px dashed var(--border-color)">No ledger transactions found.</div>`;
        return;
    }

    // Display top 4 transactions on dashboard, sorted by date/time desc
    const sortedTxns = [...transactions].reverse().slice(0, 4);
    sortedTxns.forEach(txn => {
        const card = document.createElement('div');
        card.className = 'transaction-card';
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                triggerViewReceipt(txn.id);
            }
        });

        let iconSVG = '';
        if (txn.methodKey === 'CardPayment') {
            iconSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`;
        } else if (txn.methodKey === 'DigitalWalletPayment') {
            iconSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>`;
        } else {
            iconSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M12 2L2 7l10 5 10-5-10-5z"></path></svg>`;
        }

        let displayStatus = txn.status;
        if (txn.refundStatus && txn.refundStatus !== 'NONE') {
            displayStatus = txn.refundStatus;
        }

        card.innerHTML = `
            <div class="txn-icon">${iconSVG}</div>
            <div class="txn-details">
                <span class="txn-type-label">${txn.method}</span>
                <div class="txn-meta">
                    <span>${txn.id}</span>
                    <span class="txn-dot-separator"></span>
                    <span>${txn.maskedDetails}</span>
                </div>
            </div>
            <div>
                <span class="txn-status-badge ${displayStatus.toLowerCase()}">${displayStatus}</span>
            </div>
            <div class="txn-action-amount">
                <span class="txn-amount" style="color: ${displayStatus === 'REFUNDED' ? 'var(--warning)' : 'var(--text-primary)'}">
                    ${displayStatus === 'REFUNDED' ? '+' : '-'}₹${txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <button class="btn-refund" style="font-size:0.6rem;padding:2px 6px;">Invoice</button>
            </div>
        `;
        list.appendChild(card);
    });
}

// ==========================================================================
// SAVED PAYMENT METHODS CRUD & WALLET
// ==========================================================================
function loadSavedMethods() {
    const list = document.getElementById('saved-methods-list');
    if (!list) return;
    list.innerHTML = '';

    if (savedMethods.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:48px 12px;color:var(--text-muted);font-size:0.85rem;grid-column: span 2;background:white;border-radius:16px;border:1px dashed var(--border-color)">No saved payment methods linked. Link Credit cards, PayPal, or Bank accounts to start.</div>`;
        return;
    }

    savedMethods.forEach(method => {
        const item = document.createElement('div');
        item.className = `saved-method-item glass ${method.isDefault ? 'default-method' : ''}`;
        
        let networkSVG = '';
        if (method.type === 'CreditCard') {
            if (method.network === 'visa') {
                networkSVG = `<svg viewBox="0 0 24 24" width="32" height="20"><rect width="24" height="16" rx="2" fill="#0033a0"/><path d="M4 11h2l1-4H5zm4-4h2.2l-1.3 4h-2zm4.5 4h1.7l1.3-4H14zm3.8 0h1.8l-1.3-4h-1.8z" fill="#fff"/></svg>`;
            } else {
                networkSVG = `<svg viewBox="0 0 24 24" width="32" height="20"><circle cx="8" cy="12" r="6" fill="#eb001b" fill-opacity="0.9"/><circle cx="16" cy="12" r="6" fill="#f79e1b" fill-opacity="0.9"/></svg>`;
            }
        } else if (method.type === 'PayPal') {
            networkSVG = `<svg viewBox="0 0 24 24" width="32" height="20" fill="none" stroke="#003087" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path></svg>`;
        } else {
            networkSVG = `<svg viewBox="0 0 24 24" width="32" height="20" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M12 2L2 7l10 5 10-5-10-5z"></path></svg>`;
        }

        item.innerHTML = `
            <div class="saved-method-card-info">
                <div class="network-icon-box">${networkSVG}</div>
                <div class="saved-card-details">
                    <h5>${method.label}</h5>
                    <p>${method.maskedDetails}</p>
                </div>
            </div>
            <div class="saved-method-actions">
                ${!method.isDefault ? `<button class="btn-saved-action set-default-action" onclick="setDefaultMethod('${method.id}')" title="Set Default"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></button>` : ''}
                <button class="btn-saved-action edit-action" onclick="editSavedMethod('${method.id}')" title="Edit details"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                <button class="btn-saved-action delete-action" onclick="deleteSavedMethod('${method.id}')" title="Delete account"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderSavedMethodsDropdownCheckout() {
    const container = document.getElementById('quick-saved-methods-checkout-list');
    if (!container) return;
    container.innerHTML = '';

    if (savedMethods.length === 0) {
        container.innerHTML = `<div style="font-size:0.75rem;color:var(--text-muted);padding:10px 0;">No saved payment methods linked. Link cards in your dashboard tab.</div>`;
        return;
    }

    savedMethods.forEach(method => {
        const item = document.createElement('div');
        item.className = 'quick-select-item';
        
        let iconText = method.type === 'CreditCard' ? 'Card' : method.type === 'PayPal' ? 'PayPal' : 'Bank';
        item.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="badge" style="background:#f1f5f9;color:var(--text-secondary);font-size:0.6rem;">${iconText}</span>
                <div style="display:flex;flex-direction:column;">
                    <span style="font-weight:700;font-size:0.78rem;">${method.label}</span>
                    <span style="font-size:0.68rem;color:var(--text-muted);font-family:var(--font-mono);">${method.maskedDetails}</span>
                </div>
            </div>
            <button class="btn-refund" style="font-size:0.62rem;padding:3px 8px;">Select</button>
        `;

        item.addEventListener('click', () => {
            autofillCheckoutForm(method);
        });
        container.appendChild(item);
    });
}

function resetSavedMethodForm() {
    editingMethodId = null;
    document.getElementById('drawer-title').textContent = 'Link New Payment Account';
    document.getElementById('save-new-method-btn').textContent = 'Save Payment Method';
    document.getElementById('method-edit-id').value = '';

    document.getElementById('method-add-type').disabled = false;
    document.getElementById('method-add-type').value = 'CreditCard';
    document.getElementById('method-cc-holder').value = '';
    document.getElementById('method-cc-number').value = '';
    document.getElementById('method-cc-exp').value = '';
    document.getElementById('method-cc-network').value = 'visa';
    document.getElementById('method-pp-email').value = '';
    document.getElementById('method-bt-bank').value = '';
    document.getElementById('method-bt-acc').value = '';
    document.getElementById('method-bt-ifsc').value = '';
    document.getElementById('method-default-chk').checked = false;

    document.getElementById('drawer-fields-cc').style.display = 'block';
    document.getElementById('drawer-fields-pp').style.display = 'none';
    document.getElementById('drawer-fields-bt').style.display = 'none';
}

function saveOrUpdateSavedMethod() {
    const type = document.getElementById('method-add-type').value;
    const isDefault = document.getElementById('method-default-chk').checked;
    const editId = document.getElementById('method-edit-id').value;

    let targetMethod = {
        id: editId || 'M_ACC_' + Math.floor(1000 + Math.random() * 9000),
        type: type,
        isDefault: isDefault
    };

    if (type === 'CreditCard') {
        const holder = document.getElementById('method-cc-holder').value.trim();
        const number = document.getElementById('method-cc-number').value.replace(/\s/g, '');
        const exp = document.getElementById('method-cc-exp').value.trim();
        const network = document.getElementById('method-cc-network').value;

        if (!holder || number.length !== 16 || !exp.match(/^(0[1-9]|1[0-2])\/[0-9]{2}$/)) {
            showToast('Validation failed: check credit card input lengths', 'error');
            return;
        }

        targetMethod.label = `${network.toUpperCase()} Card`;
        targetMethod.holder = holder;
        targetMethod.number = number;
        targetMethod.exp = exp;
        targetMethod.network = network;
        targetMethod.maskedDetails = `**** **** **** ${number.substring(12)}`;
    } else if (type === 'PayPal') {
        const email = document.getElementById('method-pp-email').value.trim();
        if (!email || !email.includes('@')) {
            showToast('Validation failed: email format incorrect', 'error');
            return;
        }
        targetMethod.label = 'PayPal Account';
        targetMethod.email = email;
        targetMethod.maskedDetails = email.substring(0, 2) + '****@' + email.split('@')[1];
    } else if (type === 'BankTransfer') {
        const bank = document.getElementById('method-bt-bank').value.trim();
        const acc = document.getElementById('method-bt-acc').value.trim();
        const ifsc = document.getElementById('method-bt-ifsc').value.trim().toUpperCase();

        if (!bank || acc.length < 9 || !ifsc.match(/^[A-Z]{4}0[A-Z0-9]{6}$/)) {
            showToast('Validation failed: check bank parameters (9+ digit account, 11-digit IFSC)', 'error');
            return;
        }
        targetMethod.label = bank;
        targetMethod.bank = bank;
        targetMethod.account = acc;
        targetMethod.ifsc = ifsc;
        targetMethod.maskedDetails = `${bank} (Acc ...${acc.substring(acc.length - 4)})`;
    }

    if (isDefault) {
        savedMethods.forEach(m => m.isDefault = false);
    }

    if (editId) {
        // Update operation
        const idx = savedMethods.findIndex(m => m.id === editId);
        if (idx !== -1) {
            savedMethods[idx] = targetMethod;
        }
        showToast('Payment instrument updated successfully!', 'success');
    } else {
        // Create operation
        if (savedMethods.length === 0) {
            targetMethod.isDefault = true;
        }
        savedMethods.push(targetMethod);
        showToast('New payment instrument linked successfully!', 'success');
    }

    saveMethodsToStorage();
    loadSavedMethods();
    document.getElementById('add-card-drawer').style.display = 'none';
}

window.editSavedMethod = function(id) {
    const method = savedMethods.find(m => m.id === id);
    if (!method) return;

    resetSavedMethodForm();
    editingMethodId = id;
    document.getElementById('drawer-title').textContent = 'Edit Payment Method Details';
    document.getElementById('save-new-method-btn').textContent = 'Update Details';
    document.getElementById('method-edit-id').value = id;

    const typeSelect = document.getElementById('method-add-type');
    typeSelect.value = method.type;
    typeSelect.disabled = true; // Protect key subclass maps

    document.getElementById('method-default-chk').checked = method.isDefault;

    // Toggle fields
    document.getElementById('drawer-fields-cc').style.display = method.type === 'CreditCard' ? 'block' : 'none';
    document.getElementById('drawer-fields-pp').style.display = method.type === 'PayPal' ? 'block' : 'none';
    document.getElementById('drawer-fields-bt').style.display = method.type === 'BankTransfer' ? 'block' : 'none';

    if (method.type === 'CreditCard') {
        document.getElementById('method-cc-holder').value = method.holder;
        document.getElementById('method-cc-number').value = formatCCNumber(method.number);
        document.getElementById('method-cc-exp').value = method.exp;
        document.getElementById('method-cc-network').value = method.network;
    } else if (method.type === 'PayPal') {
        document.getElementById('method-pp-email').value = method.email;
    } else if (method.type === 'BankTransfer') {
        document.getElementById('method-bt-bank').value = method.bank;
        document.getElementById('method-bt-acc').value = method.account;
        document.getElementById('method-bt-ifsc').value = method.ifsc;
    }

    document.getElementById('add-card-drawer').style.display = 'block';
};

window.deleteSavedMethod = function(id) {
    const verify = confirm('Remove this linked payment account from your Payment Processing System wallet?');
    if (!verify) return;

    const idx = savedMethods.findIndex(m => m.id === id);
    if (idx === -1) return;

    const wasDefault = savedMethods[idx].isDefault;
    savedMethods.splice(idx, 1);

    if (wasDefault && savedMethods.length > 0) {
        savedMethods[0].isDefault = true;
    }

    saveMethodsToStorage();
    loadSavedMethods();
    showToast('Payment account unlinked', 'info');
};

window.setDefaultMethod = function(id) {
    savedMethods.forEach(m => {
        m.isDefault = m.id === id;
    });
    saveMethodsToStorage();
    loadSavedMethods();
    showToast('Default payment instrument updated', 'success');
};

function autofillCheckoutForm(method) {
    // Switch active method selectors
    const methodCards = document.querySelectorAll('.method-card');
    const methodKey = method.type === 'CreditCard' ? 'credit-card' : method.type === 'PayPal' ? 'paypal' : 'bank-transfer';
    
    methodCards.forEach(card => {
        if (card.getAttribute('data-method') === methodKey) card.classList.add('active');
        else card.classList.remove('active');
    });
    switchPaymentForm(methodKey);

    // Autofill fields
    if (method.type === 'CreditCard') {
        document.getElementById('cc-name').value = method.holder;
        document.getElementById('cc-number').value = formatCCNumber(method.number);
        document.getElementById('cc-expiry').value = method.exp;
        document.getElementById('cc-cvv').value = '';
        document.getElementById('cc-cvv').focus();
    } else if (method.type === 'PayPal') {
        document.getElementById('pp-email').value = method.email;
        document.getElementById('pp-password').value = '';
        document.getElementById('pp-password').focus();
    } else if (method.type === 'BankTransfer') {
        document.getElementById('bt-bank-name').value = method.bank;
        document.getElementById('bt-account-number').value = method.account;
        document.getElementById('bt-ifsc').value = method.ifsc;
    }

    showToast(`Autofilled fields via ${method.label}`, 'info');
}

function formatCCNumber(num) {
    let clean = num.replace(/\D/g, '');
    let res = '';
    for (let i = 0; i < clean.length; i++) {
        if (i > 0 && i % 4 === 0) res += ' ';
        res += clean[i];
    }
    return res;
}

// ==========================================================================
// CHECKOUT FORMS VALIDATIONS & PAY PIPELINE
// ==========================================================================
function handleCCSubmit(e) {
    e.preventDefault();
    if (isRunningTrace) return;

    const name = document.getElementById('cc-name').value.trim();
    const number = document.getElementById('cc-number').value.replace(/\s/g, '');
    const expiry = document.getElementById('cc-expiry').value.trim();
    const cvv = document.getElementById('cc-cvv').value.trim();
    const amount = parseFloat(document.getElementById('cc-amount').value);

    // Validations matching PaymentValidator.java
    if (!name) { showFormError('Card Holder Name cannot be empty'); return; }
    if (number.length !== 16 || isNaN(number)) { showFormError('Card Number must be 16 numeric digits'); return; }
    if (!expiry.match(/^(0[1-9]|1[0-2])\/[0-9]{2}$/)) { showFormError('Expiry Date must match MM/YY format'); return; }
    if (cvv.length !== 3 || isNaN(cvv)) { showFormError('CVV must be 3 numeric digits'); return; }
    if (isNaN(amount) || amount <= 0) { showFormError('Payment amount must be greater than zero'); return; }

    if (amount > bankBalance) {
        showFormError('Transaction Failed: Insufficient bank balance funds');
        logToJVM(`[Validator Error] CardPayment validation failed. Requested: INR ${amount}. Balance available: INR ${bankBalance}`, 'error');
        return;
    }

    hideFormError();
    const txnId = `TXN_CARD_${Math.floor(100000 + Math.random() * 900000)}`;
    const newTxn = {
        id: txnId,
        receiptNumber: `REC-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        referenceNumber: String(Math.floor(100000000000 + Math.random() * 900000000000)),
        method: 'Card Payment',
        methodKey: 'CardPayment',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        status: 'SUCCESS',
        customerName: name,
        maskedDetails: `**** **** **** ${number.substring(12)}`,
        refundStatus: 'NONE'
    };

    executeTransaction(newTxn, 'CreditCardPayment', () => {
        document.getElementById('credit-card-form').reset();
        document.getElementById('cc-name').value = userProfile.name;
    });
}

function handlePayPalSubmit(e) {
    e.preventDefault();
    if (isRunningTrace) return;

    const email = document.getElementById('pp-email').value.trim();
    const password = document.getElementById('pp-password').value;
    const amount = parseFloat(document.getElementById('pp-amount').value);

    if (!email || !email.includes('@')) { showFormError('Invalid PayPal email address'); return; }
    if (password.length < 6) { showFormError('Password must be at least 6 characters'); return; }
    if (isNaN(amount) || amount <= 0) { showFormError('Payment amount must be greater than zero'); return; }

    if (amount > bankBalance) {
        showFormError('Transaction Failed: Insufficient bank balance funds');
        logToJVM(`[Validator Error] DigitalWalletPayment validation failed. Balance check failed.`, 'error');
        return;
    }

    hideFormError();
    const txnId = `TXN_WLT_${Math.floor(100000 + Math.random() * 900000)}`;
    const newTxn = {
        id: txnId,
        receiptNumber: `REC-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        referenceNumber: String(Math.floor(100000000000 + Math.random() * 900000000000)),
        method: 'Digital Wallet',
        methodKey: 'DigitalWalletPayment',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        status: 'SUCCESS',
        customerName: userProfile.name,
        maskedDetails: email.substring(0, 2) + '****@' + email.split('@')[1],
        refundStatus: 'NONE'
    };

    executeTransaction(newTxn, 'PayPalPayment', () => {
        document.getElementById('paypal-form').reset();
    });
}

function handleBankTransferSubmit(e) {
    e.preventDefault();
    if (isRunningTrace) return;

    const bankName = document.getElementById('bt-bank-name').value.trim();
    const accountNum = document.getElementById('bt-account-number').value.replace(/\s/g, '');
    const ifsc = document.getElementById('bt-ifsc').value.trim().toUpperCase();
    const amount = parseFloat(document.getElementById('bt-amount').value);

    if (!bankName) { showFormError('Bank Name is required'); return; }
    if (accountNum.length < 9 || accountNum.length > 18 || isNaN(accountNum)) { showFormError('Account Number must be between 9 and 18 numeric digits'); return; }
    if (!ifsc.match(/^[A-Z]{4}0[A-Z0-9]{6}$/)) { showFormError('Invalid Indian IFSC Code format (e.g. SBIN0001234)'); return; }
    if (isNaN(amount) || amount <= 0) { showFormError('Payment amount must be greater than zero'); return; }

    if (amount > bankBalance) {
        showFormError('Transaction Failed: Insufficient bank balance funds');
        logToJVM(`[Validator Error] AccountTransferPayment validation failed. Balance check failed.`, 'error');
        return;
    }

    hideFormError();
    const txnId = `TXN_ACC_${Math.floor(100000 + Math.random() * 900000)}`;
    const newTxn = {
        id: txnId,
        receiptNumber: `REC-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        referenceNumber: String(Math.floor(100000000000 + Math.random() * 900000000000)),
        method: 'Account Transfer',
        methodKey: 'AccountTransferPayment',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        status: 'SUCCESS',
        customerName: userProfile.name,
        maskedDetails: `${bankName} (Acc ...${accountNum.substring(accountNum.length - 4)})`,
        refundStatus: 'NONE'
    };

    executeTransaction(newTxn, 'BankTransferPayment', () => {
        document.getElementById('bank-transfer-form').reset();
    });
}

function showFormError(msg) {
    const errAlert = document.getElementById('form-error-alert');
    if (errAlert) {
        document.getElementById('error-message').textContent = msg;
        errAlert.style.display = 'flex';
        showToast(msg, 'error');
    }
}
function hideFormError() {
    const errAlert = document.getElementById('form-error-alert');
    if (errAlert) errAlert.style.display = 'none';
}

// Payment Redesign Flow: Processing overlays and success indicators
function executeTransaction(txn, oopKey, formResetCallback) {
    isRunningTrace = true;
    
    // Display Processing Modal Overlay
    const modal = document.getElementById('processing-modal');
    const loader = document.getElementById('processing-loader-container');
    const successIcon = document.getElementById('processing-success-container');
    const title = document.getElementById('processing-status-title');
    const desc = document.getElementById('processing-status-desc');

    loader.style.display = 'block';
    successIcon.style.display = 'none';
    title.textContent = 'Payment Processing System Secure';
    desc.textContent = 'Connecting to client banking gateway...';
    modal.classList.add('active');

    // Run backend trace updates silently in the background
    runSimulatedJavaTraceInBackground(txn, oopKey);

    // Timeline updates:
    setTimeout(() => {
        desc.textContent = 'Verifying credentials authorization...';
    }, 700);

    setTimeout(() => {
        desc.textContent = 'Billing account ledger balance...';
    }, 1400);

    setTimeout(() => {
        // Mutate states
        bankBalance -= txn.amount;
        saveBalanceToStorage();
        updateBalanceDisplay();

        transactions.push(txn);
        saveTransactionsToStorage();

        // Trigger Success Checkmark morphs
        loader.style.display = 'none';
        successIcon.style.display = 'flex';
        title.textContent = 'Payment Authorized!';
        desc.textContent = `Billed ₹${txn.amount.toLocaleString('en-IN')} successfully.`;
        
        triggerConfetti();
    }, 2100);

    setTimeout(() => {
        // Dismiss processing modal
        modal.classList.remove('active');
        isRunningTrace = false;
        formResetCallback();
        
        // Launch Receipt Modal
        triggerViewReceipt(txn.id);
    }, 3500);
}

function runSimulatedJavaTraceInBackground(txn, type) {
    const stepsList = document.getElementById('trace-steps-list');
    const welcome = document.getElementById('dev-welcome-box');
    const container = document.getElementById('trace-steps');
    
    if (welcome) welcome.style.display = 'none';
    if (container) container.style.display = 'block';
    if (stepsList) stepsList.innerHTML = '';

    let steps = [];
    if (type === 'CreditCardPayment') {
        steps = [
            { file: 'PaymentValidator.java', line: 13, concept: 'Encapsulation Check', log: '[Validator] Checking card constraints...' },
            { file: 'CardPayment.java', line: 17, concept: 'Inheritance Binding', log: '[JVM] Instantiated CardPayment. super() constructor loaded.' },
            { file: 'PaymentGateway.java', line: 34, concept: 'Polymorphism Routing', log: `[Gateway] executePayment() routing reference ID: ${txn.id}` },
            { file: 'CardPayment.java', line: 29, concept: 'Overridden Lookup', log: `[Card] Executed CardPayment.processPayment(). Authorized: INR ${txn.amount}` }
        ];
    } else if (type === 'PayPalPayment') {
        steps = [
            { file: 'PaymentValidator.java', line: 49, concept: 'Encapsulation Check', log: '[Validator] Check wallet format details...' },
            { file: 'DigitalWalletPayment.java', line: 14, concept: 'Inheritance Binding', log: '[JVM] Instantiated DigitalWalletPayment.' },
            { file: 'PaymentGateway.java', line: 34, concept: 'Polymorphism Routing', log: `[Gateway] executePayment() routing reference ID: ${txn.id}` },
            { file: 'DigitalWalletPayment.java', line: 22, concept: 'Overridden Lookup', log: `[Wallet] Executed DigitalWalletPayment.processPayment(). Billed wallet email.` }
        ];
    } else {
        steps = [
            { file: 'PaymentValidator.java', line: 74, concept: 'Encapsulation Check', log: '[Validator] Check bank fields and routing IFSC numbers...' },
            { file: 'AccountTransferPayment.java', line: 15, concept: 'Inheritance Binding', log: '[JVM] Instantiated AccountTransferPayment.' },
            { file: 'PaymentGateway.java', line: 34, concept: 'Polymorphism Routing', log: `[Gateway] executePayment() routing reference ID: ${txn.id}` },
            { file: 'AccountTransferPayment.java', line: 24, concept: 'Overridden Lookup', log: `[Transfer] Executed AccountTransferPayment.processPayment(). Handshaked bank node.` }
        ];
    }

    let delay = 0;
    steps.forEach((step, idx) => {
        setTimeout(() => {
            logToJVM(step.log);

            const card = document.createElement('div');
            card.className = 'trace-item';
            card.innerHTML = `
                <div style="font-weight:700;font-size:0.62rem;color:var(--text-muted);margin-bottom:1px;">STEP ${idx+1} - ${step.file}:${step.line}</div>
                <div>
                    <span class="step-concept">[${step.concept}]</span>
                    <span class="step-desc">${step.log}</span>
                </div>
            `;
            if (stepsList) stepsList.appendChild(card);
            
            const indicator = document.getElementById('active-concept-indicator');
            if (indicator) indicator.textContent = step.concept;

            // highlight lines if the developer panel is currently viewing the file
            if (selectedFile === step.file) {
                highlightLine(step.line);
            }
        }, delay);
        delay += 500;
    });

    setTimeout(() => {
        const indicator = document.getElementById('active-concept-indicator');
        if (indicator) indicator.textContent = 'Ready';
    }, delay + 200);
}

// ==========================================================================
// RECEIPT OVERLAY INVOICES
// ==========================================================================
window.triggerViewReceipt = function(txnId) {
    const txn = transactions.find(t => t.id === txnId);
    if (!txn) return;

    document.getElementById('receipt-paid-amount').textContent = `₹${txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('receipt-no').textContent = txn.receiptNumber;
    document.getElementById('receipt-ref-no').textContent = txn.referenceNumber;
    document.getElementById('receipt-txn-id').textContent = txn.id;
    document.getElementById('receipt-date').textContent = `${txn.date} ${txn.time || '12:00:00'}`;
    document.getElementById('receipt-cust-name').textContent = txn.customerName;
    document.getElementById('receipt-payment-method').textContent = txn.method;
    document.getElementById('receipt-masked-details').textContent = txn.maskedDetails;
    
    const statusVal = document.getElementById('receipt-payment-status');
    if (statusVal) {
        statusVal.textContent = txn.status;
        statusVal.className = `item-val receipt-status-badge ${txn.status.toLowerCase()}`;
    }

    const refundVal = document.getElementById('receipt-refund-status');
    if (refundVal) {
        refundVal.textContent = txn.refundStatus || 'NONE';
        if (txn.refundStatus && txn.refundStatus !== 'NONE') {
            refundVal.style.color = 'var(--warning)';
            refundVal.style.fontWeight = 'bold';
        } else {
            refundVal.style.color = 'var(--text-primary)';
            refundVal.style.fontWeight = 'normal';
        }
    }

    document.getElementById('receipt-modal').classList.add('active');
};

// ==========================================================================
// DEDICATED REFUNDS PORTAL
// ==========================================================================
function populateRefundTxnDropdown() {
    const select = document.getElementById('refund-txn-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- Choose Transaction --</option>';

    // Load successful transactions that are not currently pending/refunded
    const activeTxns = transactions.filter(t => t.status === 'SUCCESS' && t.refundStatus !== 'REFUNDED' && t.refundStatus !== 'PENDING');
    activeTxns.forEach(txn => {
        const opt = document.createElement('option');
        opt.value = txn.id;
        opt.textContent = `${txn.id} (₹${txn.amount.toLocaleString('en-IN')})`;
        select.appendChild(opt);
    });
}

function handleRefundSelectionChange(e) {
    const txnId = e.target.value;
    const amountInput = document.getElementById('refund-amount');
    const nameInput = document.getElementById('refund-cust-name');
    const methodInput = document.getElementById('refund-method');

    if (!txnId) {
        amountInput.value = '';
        nameInput.value = '';
        methodInput.value = '';
        return;
    }

    const txn = transactions.find(t => t.id === txnId);
    if (txn) {
        amountInput.value = txn.amount;
        nameInput.value = txn.customerName;
        methodInput.value = txn.method;
    }
}

function handleRefundFormSubmit(e) {
    e.preventDefault();
    if (isRunningTrace) return;

    const txnId = document.getElementById('refund-txn-select').value;
    const amount = parseFloat(document.getElementById('refund-amount').value);
    const name = document.getElementById('refund-cust-name').value;
    const method = document.getElementById('refund-method').value;
    const reason = document.getElementById('refund-reason').value;
    const remarks = document.getElementById('refund-remarks').value.trim();

    if (!txnId || isNaN(amount) || amount <= 0 || !reason) {
        showToast('Please select a valid transaction to claim refund', 'error');
        return;
    }

    const refundId = `REF-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRefund = {
        refundId: refundId,
        transactionId: txnId,
        method: method,
        amount: amount,
        reason: reason,
        remarks: remarks,
        status: 'PENDING'
    };

    // Update parent transaction status to PENDING
    const txn = transactions.find(t => t.id === txnId);
    if (txn) {
        txn.refundStatus = 'PENDING';
        saveTransactionsToStorage();
    }

    refundRequests.push(newRefund);
    saveRefundsToStorage();
    renderRefundLedger();
    populateRefundTxnDropdown();

    document.getElementById('refund-portal-form').reset();
    showToast('Refund claim submitted. Gateway auditing review...', 'info');

    // Run backend JVM simulator trace
    runSimulatedRefundTrace(newRefund, txn);

    // Simulate approval audit in 4.5 seconds
    setTimeout(() => {
        processSimulatedRefundApproval(refundId, true);
    }, 4500);
}

function renderRefundLedger() {
    const tbody = document.getElementById('refund-ledger-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (refundRequests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px 12px;">No refund logs recorded in ledger.</td></tr>`;
        return;
    }

    [...refundRequests].reverse().forEach(req => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:700;color:var(--secondary-color);">${req.refundId}</td>
            <td>${req.transactionId}</td>
            <td>${req.method}</td>
            <td style="font-weight:700;">₹${req.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td>${req.reason}</td>
            <td><span class="audit-status-badge ${req.status.toLowerCase()}">${req.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function processSimulatedRefundApproval(refundId, approve) {
    const req = refundRequests.find(r => r.refundId === refundId);
    if (!req || req.status !== 'PENDING') return;

    const txn = transactions.find(t => t.id === req.transactionId);
    if (approve) {
        req.status = 'REFUNDED';
        if (txn) {
            txn.refundStatus = 'REFUNDED';
            bankBalance += txn.amount; // Increment funds
            saveBalanceToStorage();
            updateBalanceDisplay();
            saveTransactionsToStorage();
        }
        showToast(`Refund ${refundId} APPROVED. Funds returned.`, 'success');
        logToJVM(`[Gateway] Refund claim APPROVED for transaction: ${req.transactionId}. Mutated subclass properties.`, 'system');
    } else {
        req.status = 'REJECTED';
        if (txn) {
            txn.refundStatus = 'REJECTED';
            saveTransactionsToStorage();
        }
        showToast(`Refund claim ${refundId} REJECTED by Gateway audit.`, 'error');
        logToJVM(`[Gateway] Refund claim REJECTED for transaction: ${req.transactionId}. Audit failed.`, 'error');
    }

    saveRefundsToStorage();
    renderRefundLedger();
    populateRefundTxnDropdown();
}

function runSimulatedRefundTrace(refund, txn) {
    const stepsList = document.getElementById('trace-steps-list');
    const welcome = document.getElementById('dev-welcome-box');
    const container = document.getElementById('trace-steps');
    
    if (welcome) welcome.style.display = 'none';
    if (container) container.style.display = 'block';
    if (stepsList) stepsList.innerHTML = '';

    logToJVM(`[Gateway] Received Refund Claim request ${refund.refundId}. Starting audit pipeline...`);

    const subclassFile = txn.methodKey === 'CardPayment' ? 'CardPayment.java' : txn.methodKey === 'DigitalWalletPayment' ? 'DigitalWalletPayment.java' : 'AccountTransferPayment.java';
    const refundSteps = [
        { file: 'PaymentGateway.java', line: 48, concept: 'Gateway Intercept', log: `[Gateway] Linked transaction reference ${refund.transactionId} found. Status marked: PENDING.` },
        { file: 'PaymentGateway.java', line: 67, concept: 'Dynamic Polymorphism', log: `[Gateway] Invoking polymorphic base reference p.refund(). Routing to subclass...` },
        { file: subclassFile, line: 43, concept: 'Overridden Refund', log: `[Subclass] Executed subclass refund() method. Reversing transaction balance.` },
        { file: 'Payment.java', line: 81, concept: 'State Encapsulation', log: '[JVM] Chained setRefundStatus("REFUNDED") to parent. Mutated private attribute.' }
    ];

    let delay = 0;
    refundSteps.forEach((step, idx) => {
        setTimeout(() => {
            logToJVM(step.log);

            const card = document.createElement('div');
            card.className = 'trace-item';
            card.style.borderLeftColor = 'var(--warning)';
            card.innerHTML = `
                <div style="font-weight:700;font-size:0.62rem;color:var(--text-muted);margin-bottom:1px;">STEP ${idx+1} - ${step.file}:${step.line}</div>
                <div>
                    <span class="step-concept" style="color:var(--warning)">[${step.concept}]</span>
                    <span class="step-desc">${step.log}</span>
                </div>
            `;
            if (stepsList) stepsList.appendChild(card);
            
            const indicator = document.getElementById('active-concept-indicator');
            if (indicator) indicator.textContent = step.concept;

            if (selectedFile === step.file) {
                highlightLine(step.line);
            }
        }, delay);
        delay += 550;
    });

    setTimeout(() => {
        const indicator = document.getElementById('active-concept-indicator');
        if (indicator) indicator.textContent = 'Ready';
    }, delay + 200);
}

// ==========================================================================
// STYLING & ANIMATIONS UTILS
// ==========================================================================
function loadJavaCode(fileName) {
    const codeDisplay = document.getElementById('code-display');
    if (!codeDisplay) return;
    const rawCode = JAVA_CODES[fileName];
    if (!rawCode) return;
    
    const lines = rawCode.trim().split('\n');
    let outputHTML = '';
    
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        outputHTML += `<div class="code-line-row" id="code-line-${lineNum}"><span class="line-number-cell" style="display:inline-block;width:30px;color:var(--text-muted);user-select:none;text-align:right;margin-right:12px;border-right:1px solid rgba(255,255,255,0.05);padding-right:8px;">${lineNum}</span><span class="line-content">${line}</span></div>`;
    });
    
    codeDisplay.innerHTML = outputHTML;
}

function logToJVM(line, type = 'normal') {
    const logs = document.getElementById('terminal-logs');
    if (!logs) return;
    const div = document.createElement('div');
    div.className = `terminal-line ${type === 'error' ? 'error-line' : type === 'system' ? 'system-line' : ''}`;
    div.textContent = line;
    logs.appendChild(div);
    
    const content = document.getElementById('terminal-content');
    if (content) content.scrollTop = content.scrollHeight;
}

function highlightLine(lineNum) {
    document.querySelectorAll('.code-highlight-line').forEach(el => el.classList.remove('code-highlight-line'));
    const targetRow = document.getElementById(`code-line-${lineNum}`);
    if (targetRow) {
        targetRow.classList.add('code-highlight-line');
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const rect = button.getBoundingClientRect();

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple-effect');

    const ripple = button.getElementsByClassName('ripple-effect')[0];
    if (ripple) ripple.remove();

    button.appendChild(circle);
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 120,
            spread: 75,
            origin: { y: 0.65 },
            colors: ['#2563eb', '#14b8a6', '#0f172a', '#10b981', '#ffffff']
        });
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    if (type === 'success') {
        icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--success)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'error') {
        icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--error)"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
        icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--primary-color)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) reverse forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
