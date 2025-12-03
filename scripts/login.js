const API_BASE_URL = 'https://api.sudid.org/api';
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const loginBtn = loginForm.querySelector('.login-btn');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showError('Please enter both username and password');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';
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
      
      // Redirect based on role
      if (data.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'index.html';
      }
    } else {
      showError(data.error || 'Invalid username or password');
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In';
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('Connection error. Please try again later.');
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In';
  }
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
}

// Check if already logged in
const token = localStorage.getItem('auth_token');
const expiration = localStorage.getItem('auth_expiration');
const role = localStorage.getItem('user_role');

if (token && expiration && Date.now() < parseInt(expiration, 10)) {
  if (role === 'admin') {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'index.html';
  }
}
