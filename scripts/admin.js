const API_BASE_URL = 'https://api.sudid.org/api';
const AUTH_KEYS = ['auth_token', 'auth_expiration', 'user_role', 'username'];

let usersCache = [];

const token = localStorage.getItem('auth_token');
const expiration = localStorage.getItem('auth_expiration');
const role = localStorage.getItem('user_role');
const username = localStorage.getItem('username');

if (!token || !expiration || Date.now() >= parseInt(expiration, 10) || role !== 'admin') {
  window.location.href = 'login.html';
}

const adminNameEl = document.getElementById('admin-name');
const logoutBtn = document.getElementById('logout-btn');
const refreshBtn = document.getElementById('refresh-users-btn');
const addUserForm = document.getElementById('add-user-form');
const newUsernameInput = document.getElementById('new-username');
const newPasswordInput = document.getElementById('new-password');
const usersListEl = document.getElementById('users-list');

adminNameEl.textContent = username;

logoutBtn.addEventListener('click', () => {
  clearAuth();
  window.location.href = 'login.html';
});

refreshBtn.addEventListener('click', async () => {
  const icon = refreshBtn.querySelector('i');
  icon.classList.add('fa-spin');
  refreshBtn.disabled = true;

  await loadUsers();

  icon.classList.remove('fa-spin');
  refreshBtn.disabled = false;
});

addUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const newUsername = newUsernameInput.value.trim();
  const password = newPasswordInput.value;

  if (!newUsername || !password) {
    showError('Please enter both username and password');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ username: newUsername, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Failed to add user:', response.status, data);
      showError(data.error || `Failed to add user (${response.status})`);
      return;
    }

    usersCache.push({
      username: newUsername,
      role: 'user',
      created_at: new Date().toISOString(),
    });
    displayUsers(usersCache);
    showSuccess(`User "${newUsername}" added successfully.`);
    addUserForm.reset();
  } catch (error) {
    console.error('Error adding user:', error);
    showError('Failed to add user. Please try again.');
  }
});

async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: authHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to load users:', response.status, errorData);
      showError(errorData.error || `Failed to load users (${response.status})`);
      return;
    }

    usersCache = await response.json();
    displayUsers(usersCache);
  } catch (error) {
    console.error('Error loading users:', error);
    showError('Failed to load users. Please check your connection.');
  }
}

function displayUsers(users) {
  if (!users.length) {
    usersListEl.innerHTML = '<tr><td colspan="4" class="empty-state">No users found</td></tr>';
    return;
  }

  usersListEl.innerHTML = users.map(user => {
    const safeUsername = escapeHtml(user.username);
    const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString() : '-';

    const actionCell = user.role !== 'admin'
      ? `<button class="delete-user-btn" data-username="${encodeURIComponent(user.username)}"><i class="fa-solid fa-trash"></i> Delete</button>`
      : '<span style="color: var(--text-muted);">Protected</span>';

    return `
      <tr>
        <td>${safeUsername}</td>
        <td><span class="role-badge ${user.role}">${user.role}</span></td>
        <td>${createdAt}</td>
        <td>${actionCell}</td>
      </tr>
    `;
  }).join('');

  usersListEl.querySelectorAll('.delete-user-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const encoded = btn.getAttribute('data-username');
      if (encoded) {
        deleteUser(decodeURIComponent(encoded));
      }
    });
  });
}

async function deleteUser(targetUsername) {
  if (!confirm(`Are you sure you want to delete user "${targetUsername}"?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(targetUsername)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Failed to delete user:', response.status, data);
      showError(data.error || `Failed to delete user (${response.status})`);
      return;
    }

    usersCache = usersCache.filter((u) => u.username !== targetUsername);
    displayUsers(usersCache);
    showSuccess(`User "${targetUsername}" deleted successfully.`);
  } catch (error) {
    console.error('Error deleting user:', error);
    showError('Failed to delete user. Please try again.');
  }
}

function showSuccess(message) {
  const el = document.getElementById('success-message');
  el.textContent = message;
  el.classList.add('show');
  document.getElementById('error-message').classList.remove('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}

function showError(message) {
  const el = document.getElementById('error-message');
  el.textContent = message;
  el.classList.add('show');
  document.getElementById('success-message').classList.remove('show');
}

function authHeaders(extra = {}) {
  return {
    ...extra,
    'Authorization': `Bearer ${token}`,
  };
}

function clearAuth() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

loadUsers();
