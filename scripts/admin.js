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

// Manual refresh button
document.getElementById('refresh-users-btn').addEventListener('click', () => {
  const btn = document.getElementById('refresh-users-btn');
  const icon = btn.querySelector('i');
  
  // Add spinning animation
  icon.classList.add('fa-spin');
  btn.disabled = true;
  
  loadUsers().finally(() => {
    icon.classList.remove('fa-spin');
    btn.disabled = false;
  });
});

// Load users
async function loadUsers(retryCount = 0) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const users = await response.json();
        displayUsers(users);
        resolve();
      } else if (response.status === 500 && retryCount < 2) {
        // Retry on 500 error (server might still be processing)
        console.log(`Server error, retrying... (attempt ${retryCount + 1}/2)`);
        setTimeout(() => loadUsers(retryCount + 1).then(resolve).catch(reject), 1000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load users:', response.status, errorData);
        showError(errorData.error || `Failed to load users (${response.status})`);
        reject(new Error('Failed to load users'));
      }
    } catch (error) {
      console.error('Error loading users:', error);
      if (retryCount < 2) {
        console.log(`Network error, retrying... (attempt ${retryCount + 1}/2)`);
        setTimeout(() => loadUsers(retryCount + 1).then(resolve).catch(reject), 1000);
      } else {
        showError('Failed to load users. Please try again.');
        reject(error);
      }
    }
  });
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

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      showSuccess(`User "${username}" added successfully. Click Refresh to update the list.`);
      document.getElementById('add-user-form').reset();
      // Don't auto-refresh due to server issues - let user manually refresh
    } else {
      console.error('Failed to add user:', response.status, data);
      showError(data.error || `Failed to add user (${response.status})`);
    }
  } catch (error) {
    console.error('Error adding user:', error);
    showError('Failed to add user. Please try again.');
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

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      showSuccess(`User "${username}" deleted successfully. Click Refresh to update the list.`);
      // Don't auto-refresh due to server issues - let user manually refresh
    } else {
      console.error('Failed to delete user:', response.status, data);
      showError(data.error || `Failed to delete user (${response.status})`);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    showError('Failed to delete user. Please try again.');
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
