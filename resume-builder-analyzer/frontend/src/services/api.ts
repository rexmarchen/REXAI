import type {
  ResumeData,
  AnalysisResult,
  User,
  ResumeRecord
} from '../types/resume';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

class ApiService {
  private getHeaders(isJson = true): HeadersInit {
    const headers: Record<string, string> = {};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // --- Auth ---
  async register(email: string, password: string): Promise<{ user: User; access_token: string; refresh_token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return data;
  }

  async login(email: string, password: string): Promise<{ user: User; access_token: string; refresh_token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Invalid email or password' }));
      throw new Error(err.detail || 'Invalid email or password');
    }
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return data;
  }

  async getMe(): Promise<User | null> {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Ignored
    }
    return null;
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async deleteAccount(): Promise<void> {
    const res = await fetch(`${API_BASE}/auth/account`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) {
      throw new Error('Failed to delete account');
    }
    this.logout();
  }

  // --- Analyzer ---
  async analyzeFile(file: File, jobDescription?: string, useAi: boolean = false): Promise<AnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (jobDescription) {
      formData.append('job_description', jobDescription);
    }
    formData.append('use_ai', useAi ? 'true' : 'false');

    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
      throw new Error(err.detail || `Analysis failed (${res.status})`);
    }

    return await res.json();
  }

  async analyzeJson(resumeData: ResumeData, jobDescription?: string, useAi: boolean = false): Promise<AnalysisResult> {
    const res = await fetch(`${API_BASE}/analyze/json`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({
        resume_data: resumeData,
        job_description: jobDescription || null,
        use_ai: useAi
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Live score calculation failed' }));
      throw new Error(err.detail || 'Live score calculation failed');
    }

    return await res.json();
  }

  async getHistory(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/history`, {
      headers: this.getHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  }

  async deleteHistory(id: number): Promise<void> {
    await fetch(`${API_BASE}/history/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
  }

  // --- Resumes CRUD ---
  async listResumes(): Promise<ResumeRecord[]> {
    const res = await fetch(`${API_BASE}/resumes`, {
      headers: this.getHeaders()
    });
    if (!res.ok) return [];
    return await res.json();
  }

  async getResume(id: number): Promise<ResumeRecord> {
    const res = await fetch(`${API_BASE}/resumes/${id}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Resume not found');
    return await res.json();
  }

  async createResume(title: string, templateId: string, accentColor: string, fontFamily: string, data: ResumeData): Promise<ResumeRecord> {
    const res = await fetch(`${API_BASE}/resumes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        title,
        template_id: templateId,
        accent_color: accentColor,
        font_family: fontFamily,
        data
      })
    });
    if (!res.ok) throw new Error('Failed to create resume');
    return await res.json();
  }

  async updateResume(id: number, payload: Partial<{ title: string; template_id: string; accent_color: string; font_family: string; data: ResumeData }>): Promise<ResumeRecord> {
    const res = await fetch(`${API_BASE}/resumes/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update resume');
    return await res.json();
  }

  async duplicateResume(id: number): Promise<ResumeRecord> {
    const res = await fetch(`${API_BASE}/resumes/${id}/duplicate`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to duplicate resume');
    return await res.json();
  }

  async deleteResume(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/resumes/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete resume');
  }

  async exportDocx(data: ResumeData, filename = 'resume.docx'): Promise<void> {
    const res = await fetch(`${API_BASE}/resumes/export/docx`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to export DOCX');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const api = new ApiService();
