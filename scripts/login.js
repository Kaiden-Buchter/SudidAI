const API_BASE_URL = 'https://api.sudid.org/api';
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const loginBtn = loginForm.querySelector('.login-btn');
const LOGIN_IDLE_ICON = '<i class="fa-solid fa-right-to-bracket"></i> Sign In';
const LOGIN_LOADING_ICON = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';

redirectIfAuthenticated();

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showError('Please enter both username and password');
    return;
  }

  setLoginLoading(true);
  errorMessage.classList.remove('show');

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_expiration', data.expiration);
      localStorage.setItem('user_role', data.role);
      localStorage.setItem('username', username);

      redirectByRole(data.role);
    } else {
      showError(data.error || 'Invalid username or password');
      setLoginLoading(false);
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('Connection error. Please try again later.');
    setLoginLoading(false);
  }
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
}

function setLoginLoading(isLoading) {
  loginBtn.disabled = isLoading;
  loginBtn.innerHTML = isLoading ? LOGIN_LOADING_ICON : LOGIN_IDLE_ICON;
}

function redirectByRole(role) {
  window.location.href = role === 'admin' ? 'admin.html' : 'index.html';
}

function redirectIfAuthenticated() {
  const token = localStorage.getItem('auth_token');
  const expiration = localStorage.getItem('auth_expiration');
  const role = localStorage.getItem('user_role');

  if (token && expiration && Date.now() < parseInt(expiration, 10)) {
    redirectByRole(role);
  }
}
