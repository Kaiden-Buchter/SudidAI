const API_BASE_URL = 'https://api.sudid.org/api';

// Check authentication
const token = localStorage.getItem('auth_token');
const expiration = localStorage.getItem('auth_expiration');
const role = localStorage.getItem('user_role');
const username = localStorage.getItem('username');

if (!token || !expiration || Date.now() >= parseInt(expiration, 10) || role !== 'admin') {
  window.location.href = 'login.html';
}

document.getElementById('admin-name').textContent = username;

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});

// Load users
async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      const users = await response.json();
      displayUsers(users);
    } else {
      showError('Failed to load users');
    }
  } catch (error) {
    console.error('Error loading users:', error);
    showError('Failed to load users');
  }
}

function displayUsers(users) {
  const usersList = document.getElementById('users-list');
  
  if (users.length === 0) {
    usersList.innerHTML = '<tr><td colspan="4" class="empty-state">No users found</td></tr>';
    return;
  }

  usersList.innerHTML = users.map(user => `
    <tr>
      <td>${escapeHtml(user.username)}</td>
      <td><span class="role-badge ${user.role}">${user.role}</span></td>
      <td>${new Date(user.created_at).toLocaleDateString()}</td>
      <td>
        ${user.role !== 'admin' ? `
          <button class="delete-user-btn" onclick="deleteUser('${user.username}')">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        ` : '<span style="color: var(--text-muted);">Protected</span>'}
      </td>
    </tr>
  `).join('');
}

// Add user
document.getElementById('add-user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('new-username').value.trim();
  const password = document.getElementById('new-password').value;

  if (!username || !password) {
    showError('Please enter both username and password');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      showSuccess(`User "${username}" added successfully`);
      document.getElementById('add-user-form').reset();
      loadUsers();
    } else {
      showError(data.error || 'Failed to add user');
    }
  } catch (error) {
    console.error('Error adding user:', error);
    showError('Failed to add user');
  }
});

// Delete user
window.deleteUser = async (username) => {
  if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/${username}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      showSuccess(`User "${username}" deleted successfully`);
      loadUsers();
    } else {
      const data = await response.json();
      showError(data.error || 'Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    showError('Failed to delete user');
  }
};

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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initial load
loadUsers();
