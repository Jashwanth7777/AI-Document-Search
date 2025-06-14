let currentPage = 1;
let lastQuery = '';
let currentDocumentId = null;
const pageSize = 5; // or any default you want

// --- Navigation and Page Switching ---
function showPage(page) {
    const pages = ['homePage', 'registerPage', 'loginPage', 'mainPage'];
    pages.forEach(pid => {
        const el = document.getElementById(pid);
        el.classList.remove('active');
        el.style.display = 'none';
    });
    document.getElementById('nav-login').classList.remove('active');
    document.getElementById('nav-register').classList.remove('active');
    document.getElementById('nav-main').classList.remove('active');
    document.getElementById('nav-logout').style.display = 'none';

    let pageId = '';
    if (page === 'home') {
        pageId = 'homePage';
    } else if (page === 'register') {
        pageId = 'registerPage';
        document.getElementById('nav-register').classList.add('active');
    } else if (page === 'login') {
        pageId = 'loginPage';
        document.getElementById('nav-login').classList.add('active');
    } else if (page === 'main') {
        pageId = 'mainPage';
        document.getElementById('nav-main').classList.add('active');
        document.getElementById('nav-logout').style.display = '';
    }
    if (pageId) {
        const el = document.getElementById(pageId);
        el.style.display = '';
        // Force reflow for transition
        void el.offsetWidth;
        el.classList.add('active');
    }
}

function setNavForAuth(isAuth) {
    document.getElementById('nav-main').style.display = isAuth ? '' : 'none';
    document.getElementById('nav-logout').style.display = isAuth ? '' : 'none';
    document.getElementById('nav-login').style.display = isAuth ? 'none' : '';
    document.getElementById('nav-register').style.display = isAuth ? 'none' : '';
    document.getElementById('userProfile').style.display = isAuth ? 'flex' : 'none';
}

// --- Auth Helpers ---
function saveToken(token) {
    sessionStorage.setItem('access_token', token);
}
function getToken() {
    return sessionStorage.getItem('access_token');
}
function clearToken() {
    sessionStorage.removeItem('access_token');
}

// --- Register ---
function register() {
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const msg = document.getElementById('registerMsg');
    msg.innerHTML = '';
    if (!email || !password) {
        msg.innerHTML = '<span style="color:red;">Please enter email and password.</span>';
        return;
    }
    msg.innerHTML = '<span class="loading">Registering...</span>';
    fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
        .then(res => res.json())
        .then(data => {
            if (data.email) {
                msg.innerHTML = '<span style="color:green;">Registration successful. Please login.</span>';
            } else {
                msg.innerHTML = `<span style="color:red;">${data.detail || JSON.stringify(data)}</span>`;
            }
        })
        .catch(() => {
            msg.innerHTML = '<span style="color:red;">Registration failed.</span>';
        });
}

// --- Login ---
function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const msg = document.getElementById('loginMsg');
    msg.innerHTML = '';
    if (!email || !password) {
        msg.innerHTML = '<span style="color:red;">Please enter email and password.</span>';
        return;
    }
    msg.innerHTML = '<span class="loading">Logging in...</span>';
    fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    })
        .then(res => res.json())
        .then(data => {
            if (data.access_token) {
                saveToken(data.access_token);
                setNavForAuth(true);
                showPage('main');
                // Show user profile
                document.getElementById('userProfile').style.display = '';
                document.getElementById('userEmail').textContent = email;
                document.getElementById('userAvatar').textContent = email.charAt(0).toUpperCase();
                sessionStorage.setItem('user_email', email);
            } else {
                msg.innerHTML = `<span style="color:red;">${data.detail || JSON.stringify(data)}</span>`;
            }
        })
        .catch(() => {
            msg.innerHTML = '<span style="color:red;">Login failed.</span>';
        });
}

// --- Logout ---
function logout() {
    clearToken();
    setNavForAuth(false);
    document.getElementById('userProfile').style.display = 'none';
    sessionStorage.removeItem('user_email');
    showPage('login');
}

// --- Upload PDF ---
function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadMsg = document.getElementById('uploadMsg');
    uploadMsg.innerHTML = '';
    if (!file) return alert('Please select a PDF file.');

    uploadBtn.disabled = true;
    uploadMsg.innerHTML = '<span class="loading">Uploading...</span>';

    const formData = new FormData();
    formData.append('file', file);

    showSpinner();
    fetch('/api/v1/documents/upload', {
        method: 'POST',
        headers: getToken() ? { 'Authorization': 'Bearer ' + getToken() } : {},
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            currentDocumentId = data.document_id; // Make sure your backend returns this!
            hideSpinner();
            uploadBtn.disabled = false;
            if (data.message) {
                uploadMsg.innerHTML = `<span style="color:green;">${data.message}</span>`;
            } else {
                uploadMsg.innerHTML = `<span style="color:red;">${JSON.stringify(data)}</span>`;
            }
        })
        .catch(() => {
            hideSpinner();
            uploadBtn.disabled = false;
            uploadMsg.innerHTML = '<span style="color:red;">Upload failed.</span>';
        });
}

// --- Semantic Search ---
function search(page = 1) {
    const query = document.getElementById('queryInput').value.trim();
    lastQuery = query;
    currentPage = page;
    const searchBtn = document.getElementById('searchBtn');
    const searchMsg = document.getElementById('searchMsg');
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    searchMsg.innerHTML = '';

    if (!query) {
        searchMsg.innerHTML = '<span style="color:red;">Please enter a word.</span>';
        return;
    }
    if (!currentDocumentId) {
        searchMsg.innerHTML = '<span style="color:red;">Please upload a document first.</span>';
        return;
    }
    fetch(`/api/v1/search/search?word=${encodeURIComponent(query)}&document_id=${currentDocumentId}&page=${page}&page_size=${pageSize}`, {
        headers: getToken() ? { 'Authorization': 'Bearer ' + getToken() } : {}
    })
        .then(res => res.json())
        .then(data => {
            hideSpinner();
            searchBtn.disabled = false;
            searchMsg.innerHTML = '';
            if (data.matches && data.matches.length > 0) {
                resultsDiv.innerHTML = data.matches.map((r, i) =>
                    `<div class="result-block"><b>Match ${(data.page - 1) * data.page_size + i + 1}:</b><pre>${highlightWord(r, query)}</pre></div>`
                ).join('');
                renderPagination(data.page, data.page_size, data.total);
            } else if (data.error) {
                resultsDiv.innerHTML = `<span style="color:red;">${data.error}</span>`;
                document.getElementById('pagination').innerHTML = '';
            } else {
                resultsDiv.innerHTML = '<span>No matches found.</span>';
                document.getElementById('pagination').innerHTML = '';
            }
        })
        .catch(() => {
            hideSpinner();
            searchBtn.disabled = false;
            searchMsg.innerHTML = '';
            resultsDiv.innerHTML = '<span style="color:red;">Search failed.</span>';
            document.getElementById('pagination').innerHTML = '';
        });
}

function highlightWord(text, word) {
    if (!word) return text;
    // Escape special regex characters in the word
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    return text.replace(regex, match => `<mark>${match}</mark>`);
}

function renderPagination(page, pageSize, total) {
    const paginationDiv = document.getElementById('pagination');
    const totalPages = Math.ceil(total / pageSize);
    let html = '';
    if (page > 1) {
        html += `<button onclick="search(${page - 1})">Previous</button>`;
    }
    html += `<span>Page ${page} of ${totalPages}</span>`;
    if (page < totalPages) {
        html += `<button onclick="search(${page + 1})">Next</button>`;
    }
    paginationDiv.innerHTML = html;
}

// --- Dark Mode Toggle ---
function toggleDarkMode() {
    const body = document.body;
    const btn = document.getElementById('darkModeToggle');
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        btn.innerHTML = '☀️ Light Mode';
        localStorage.setItem('darkMode', 'true');
    } else {
        btn.innerHTML = '🌙 Dark Mode';
        localStorage.setItem('darkMode', 'false');
    }
}

function showSpinner() {
    document.getElementById('spinner').style.display = 'flex';
}
function hideSpinner() {
    document.getElementById('spinner').style.display = 'none';
}

// On load, set dark mode if previously selected
window.onload = function () {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').innerHTML = '☀️ Light Mode';
    }
    if (getToken()) {
        setNavForAuth(true);
        showPage('main');
        // Show user profile if email is stored
        const email = sessionStorage.getItem('user_email');
        if (email) {
            document.getElementById('userProfile').style.display = '';
            document.getElementById('userEmail').textContent = email;
            document.getElementById('userAvatar').textContent = email.charAt(0).toUpperCase();
        }
    } else {
        setNavForAuth(false);
        showPage('home');
    }
};
