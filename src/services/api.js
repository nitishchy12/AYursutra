const IS_STATIC = true; // Toggle this to true to bypass backend

// ─── Helpers ───────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('ayursutra_token');
}

function setToken(token) {
  localStorage.setItem('ayursutra_token', token);
}

function removeToken() {
  localStorage.removeItem('ayursutra_token');
}

// Mock database in localStorage
function getMockUsers() {
  const users = localStorage.getItem('ayursutra_mock_users');
  return users ? JSON.parse(users) : [];
}

function saveMockUser(user) {
  const users = getMockUsers();
  users.push(user);
  localStorage.setItem('ayursutra_mock_users', JSON.stringify(users));
}

async function request(endpoint, options = {}) {
  // If not in static mode, use real fetch
  if (!IS_STATIC) {
    const API_URL = import.meta.env.VITE_API_URL || '';
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      
      // Handle empty or non-JSON responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(text || `Server error: ${res.status}`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Error: ${res.status}`);
      return data;
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error('Server returned an invalid JSON response');
      }
      throw err;
    }
  }

  // ─── STATIC MOCKS ──────────────────────────────────────────
  console.log(`[Static API] Request to: ${endpoint}`);
  await new Promise(r => setTimeout(r, 800)); // Simulate network lag

  if (endpoint === '/api/auth/register') {
    const { name, email, password } = JSON.parse(options.body);
    const users = getMockUsers();
    
    if (users.find(u => u.email === email)) {
      throw new Error('An account with this email already exists');
    }

    const newUser = { id: Date.now().toString(), name, email, role: 'user', dosha: null };
    saveMockUser({ ...newUser, password }); // In real app, don't save password like this!
    return { token: 'mock-jwt-token-' + newUser.id, user: newUser };
  }

  if (endpoint === '/api/auth/login') {
    const { email, password } = JSON.parse(options.body);
    const users = getMockUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const { password: _, ...userWithoutPassword } = user;
    return { token: 'mock-jwt-token-' + user.id, user: userWithoutPassword };
  }

  if (endpoint === '/api/auth/me') {
    const token = getToken();
    if (!token) throw new Error('Not authorized');
    const userId = token.replace('mock-jwt-token-', '');
    const users = getMockUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) throw new Error('User not found');
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  // Default mock for other endpoints
  return { status: 'ok', message: 'Success (Static Mode)' };
}

// ─── Auth ──────────────────────────────────────────────────

export async function apiLogin(email, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

export async function apiRegister(name, email, password) {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  setToken(data.token);
  return data;
}

export async function apiGetMe() {
  return request('/api/auth/me');
}

export function apiLogout() {
  removeToken();
}

export function hasToken() {
  return !!getToken();
}

// ─── Users ─────────────────────────────────────────────────

export async function apiSaveDosha(dosha, doshaScores) {
  const users = getMockUsers();
  const token = getToken();
  const userId = token.replace('mock-jwt-token-', '');
  const userIdx = users.findIndex(u => u.id === userId);
  
  if (userIdx !== -1) {
    users[userIdx].dosha = dosha;
    users[userIdx].doshaScores = doshaScores;
    localStorage.setItem('ayursutra_mock_users', JSON.stringify(users));
  }

  return { status: 'ok' };
}

// ─── Posts ──────────────────────────────────────────────────

export async function apiGetPosts() {
  return { posts: [] };
}

export async function apiCreatePost(content) {
  return { status: 'ok' };
}

export async function apiToggleLike(postId) {
  return { status: 'ok' };
}

// ─── Herbs ─────────────────────────────────────────────────

export async function apiGetHerbs() {
  return { herbs: [] };
}

export async function apiSeedHerbs() {
  return { status: 'ok' };
}
