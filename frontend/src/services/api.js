const rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim();

function getApiBase() {
  let base = rawBase;

  // Handle Render internal service name injection (e.g. 'ai-skin-care-expert-backend')
  if (base === 'ai-skin-care-expert-backend') {
    base = 'https://ai-skin-care-expert-backend.onrender.com';
  } else if (base && !base.startsWith('http://') && !base.startsWith('https://') && !base.startsWith('/')) {
    base = `https://${base}`;
  }

  // Automatic fallback when deployed to production domains without build env var
  if (!base && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('onrender.com') || hostname.includes('vercel.app')) {
      base = 'https://ai-skin-care-expert-backend.onrender.com';
    }
  }

  if (base) {
    return base.endsWith('/api') ? base : `${base.replace(/\/+$/, '')}/api`;
  }
  return '/api';
}

const API_BASE = getApiBase();

function getAuthHeader() {
  const token = localStorage.getItem('dermatwin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  if (response.status === 401) {
    localStorage.removeItem('dermatwin_token');
    localStorage.removeItem('dermatwin_user');
    window.dispatchEvent(new Event('auth-change'));
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }
  return data;
}

export const api = {
  auth: {
    register: async (payload) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    login: async (payload) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    logout: async () => {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { ...getAuthHeader() }
        });
      } finally {
        localStorage.removeItem('dermatwin_token');
        localStorage.removeItem('dermatwin_user');
        window.dispatchEvent(new Event('auth-change'));
      }
    },
    getMe: async () => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    forgotPassword: async (email) => {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return handleResponse(res);
    },
    verifyResetCode: async (email, reset_code) => {
      const res = await fetch(`${API_BASE}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reset_code })
      });
      return handleResponse(res);
    },
    resetPassword: async (payload) => {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    }
  },

  cv: {
    analyzeFrame: async (base64Image) => {
      const res = await fetch(`${API_BASE}/cv/analyze-frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      return handleResponse(res);
    }
  },

  dashboard: {
    get: async () => {
      const res = await fetch(`${API_BASE}/dashboard`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    }
  },

  assessments: {
    create: async (payload) => {
      const res = await fetch(`${API_BASE}/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    getHistory: async () => {
      const res = await fetch(`${API_BASE}/assessments/history`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_BASE}/assessments/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    }
  },

  twin: {
    getCurrent: async () => {
      const res = await fetch(`${API_BASE}/twin/current`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    getHistory: async () => {
      const res = await fetch(`${API_BASE}/twin/history`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    }
  },

  reasoning: {
    explain: async (assessmentId = null) => {
      const res = await fetch(`${API_BASE}/reasoning/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ assessment_id: assessmentId })
      });
      return handleResponse(res);
    }
  },

  routine: {
    getCurrent: async () => {
      const res = await fetch(`${API_BASE}/routine/current`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    generate: async (options = {}) => {
      const res = await fetch(`${API_BASE}/routine/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(options)
      });
      return handleResponse(res);
    },
    completeTask: async (taskPayload) => {
      const res = await fetch(`${API_BASE}/routine/tasks/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(taskPayload)
      });
      return handleResponse(res);
    },
    toggleTask: async (taskPayload) => {
      const res = await fetch(`${API_BASE}/routine/tasks/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(taskPayload)
      });
      return handleResponse(res);
    },
    resetTodayTasks: async (dateStr = null) => {
      const res = await fetch(`${API_BASE}/routine/tasks/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ date: dateStr })
      });
      return handleResponse(res);
    },
    skipTask: async (taskPayload) => {
      const res = await fetch(`${API_BASE}/routine/tasks/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(taskPayload)
      });
      return handleResponse(res);
    }
  },

  timeline: {
    getRecoveryTimeline: async (days = 14) => {
      const res = await fetch(`${API_BASE}/recovery/timeline?days=${days}`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    }
  },

  symptoms: {
    checkin: async (payload) => {
      const res = await fetch(`${API_BASE}/symptoms/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    getHistory: async () => {
      const res = await fetch(`${API_BASE}/symptoms/checkin`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    }
  },

  food: {
    getPlan: async () => {
      const res = await fetch(`${API_BASE}/food/plan`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    logMeal: async (payload) => {
      const res = await fetch(`${API_BASE}/food/diary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    getDiary: async (dateStr = null) => {
      const url = dateStr ? `${API_BASE}/food/diary?date=${dateStr}` : `${API_BASE}/food/diary`;
      const res = await fetch(url, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    }
  },

  hydration: {
    log: async (payload) => {
      const res = await fetch(`${API_BASE}/hydration/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    }
  },

  reminders: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/reminders`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    save: async (payload) => {
      const res = await fetch(`${API_BASE}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    update: async (id, payload) => {
      const res = await fetch(`${API_BASE}/reminders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_BASE}/reminders/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    }
  },

  privacy: {
    purgeUserData: async () => {
      const res = await fetch(`${API_BASE}/user/data`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    }
  },

  simulation: {
    run: async (baseline, overrides) => {
      const res = await fetch(`${API_BASE}/simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseline, overrides })
      });
      return handleResponse(res);
    }
  },

  recovery: {
    getStatus: async () => {
      const res = await fetch(`${API_BASE}/recovery/status`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    }
  },

  reports: {
    getLatest: async () => {
      const res = await fetch(`${API_BASE}/reports/latest`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    getById: async (id) => {
      const res = await fetch(`${API_BASE}/reports/${id}`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    getHistory: async () => {
      const res = await fetch(`${API_BASE}/reports/history`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    },
    save: async (payload = {}) => {
      const res = await fetch(`${API_BASE}/reports/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      return handleResponse(res);
    }
  },

  user: {
    getProfile: async () => {
      const res = await fetch(`${API_BASE}/user/profile`, {
        headers: { ...getAuthHeader() }
      });
      return handleResponse(res);
    }
  },

  knowledgeBase: {
    getRules: async () => {
      const res = await fetch(`${API_BASE}/knowledge-base/rules`);
      return handleResponse(res);
    }
  }
};
