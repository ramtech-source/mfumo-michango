// =====================================================
// auth.js - Authentication Service (IMEBORESHWA)
// =====================================================

const AuthService = {
    async login(username, password) {
        const { data: users, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('status', 'active')
            .limit(1);

        if (error) throw new Error('Hitilafu ya mtandao: ' + error.message);
        if (!users || users.length === 0) {
            throw new Error('Jina la mtumiaji au nenosiri si sahihi');
        }

        const user = users[0];

        if (password !== user.password_hash) {
            throw new Error('Jina la mtumiaji au nenosiri si sahihi');
        }

        try {
            await supabaseClient
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('user_id', user.user_id);
        } catch (e) {
            console.warn('Could not update last login', e);
        }

        const session = {
            user_id: user.user_id,
            school_id: user.school_id,
            role: user.role,
            full_name: user.full_name,
            username: user.username,
            assigned_class: user.assigned_class,
            assigned_stream: user.assigned_stream,
            permissions: user.permissions || {},
            expires_at: Date.now() + (8 * 60 * 60 * 1000)
        };

        localStorage.setItem('session', JSON.stringify(session));
        return session;
    },

    logout() {
        localStorage.removeItem('session');
        window.location.href = 'index.html';
    },

    getSession() {
        const session = localStorage.getItem('session');
        if (!session) return null;
        try {
            const parsed = JSON.parse(session);
            if (parsed.expires_at < Date.now()) {
                this.logout();
                return null;
            }
            return parsed;
        } catch (e) {
            return null;
        }
    },

    requireAuth() {
        const session = this.getSession();
        if (!session) {
            window.location.href = 'index.html';
            return null;
        }
        return session;
    },

    requireRole(roles) {
        const session = this.requireAuth();
        if (!session) return null;
        if (!roles.includes(session.role)) {
            alert('Hauna ruhusa ya kuona ukurasa huu');
            window.location.href = 'teacher-dashboard.html';
            return null;
        }
        return session;
    },

    async changePassword(oldPassword, newPassword) {
        const session = this.getSession();
        if (!session) throw new Error('Haujaingia');

        if (newPassword.length < 6) {
            throw new Error('Nenosiri jipya liwe na herufi 6 au zaidi');
        }

        const { data: users } = await supabaseClient
            .from('users')
            .select('password_hash')
            .eq('user_id', session.user_id)
            .limit(1);

        if (!users || users.length === 0) throw new Error('Mtumiaji haipo');

        if (oldPassword !== users[0].password_hash) {
            throw new Error('Nenosiri la sasa si sahihi');
        }

        const { error } = await supabaseClient
            .from('users')
            .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
            .eq('user_id', session.user_id);

        if (error) throw error;
        return true;
    }
};

// =====================================================
// KAZI MPYA: Functions za kipindi (period)
// =====================================================

const PeriodHelper = {
    // Pata date range kulingana na period
    getDateRange(period, refDate) {
        const d = new Date(refDate);
        const fmt = (x) => {
            const y = x.getFullYear();
            const m = String(x.getMonth() + 1).padStart(2, '0');
            const dd = String(x.getDate()).padStart(2, '0');
            return `${y}-${m}-${dd}`;
        };

        let start = new Date(d);
        let end = new Date(d);

        switch (period) {
            case 'day':
                break;
            case 'week':
                const day = d.getDay();
                start.setDate(d.getDate() - day);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                break;
            case 'month':
                start = new Date(d.getFullYear(), d.getMonth(), 1);
                end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                break;
            case 'muhula':
                // Muhula = miezi 4 (miezi 3-4)
                const month = d.getMonth();
                if (month < 4) {
                    start = new Date(d.getFullYear(), 0, 1);
                    end = new Date(d.getFullYear(), 3, 30);
                } else if (month < 8) {
                    start = new Date(d.getFullYear(), 4, 1);
                    end = new Date(d.getFullYear(), 7, 31);
                } else {
                    start = new Date(d.getFullYear(), 8, 1);
                    end = new Date(d.getFullYear(), 11, 31);
                }
                break;
            case 'six_months':
                start = new Date(d.getFullYear(), d.getMonth() - 6, 1);
                end = d;
                break;
            case 'year':
                start = new Date(d.getFullYear(), 0, 1);
                end = new Date(d.getFullYear(), 11, 31);
                break;
            case 'all':
                return { start: '2000-01-01', end: '2100-12-31' };
        }
        return { start: fmt(start), end: fmt(end) };
    },

    // Pata label ya period kwa Kiswahili
    getLabel(period) {
        const labels = {
            day: 'Leo',
            week: 'Wiki Hii',
            month: 'Mwezi Huu',
            muhula: 'Muhula Huu',
            six_months: 'Miezi 6',
            year: 'Mwaka Huu',
            all: 'Yote'
        };
        return labels[period] || period;
    }
};

window.AuthService = AuthService;
window.PeriodHelper = PeriodHelper;