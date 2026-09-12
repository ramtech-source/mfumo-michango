// =====================================================
// auth.js - Authentication Service
// =====================================================

const AuthService = {
    // Login
    async login(username, password) {
        // Pata user kwa username
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

        // Verify password (simple comparison kwa mwanzo)
        if (password !== user.password_hash) {
            throw new Error('Jina la mtumiaji au nenosiri si sahihi');
        }

        // Update last login
        try {
            await supabaseClient
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('user_id', user.user_id);
        } catch (e) {
            console.warn('Could not update last login', e);
        }

        // Unda session
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

    // Logout
    logout() {
        localStorage.removeItem('session');
        window.location.href = 'index.html';
    },

    // Pata session
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

    // Require auth
    requireAuth() {
        const session = this.getSession();
        if (!session) {
            window.location.href = 'index.html';
            return null;
        }
        return session;
    },

    // Require role
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

    // Badilisha password
    async changePassword(oldPassword, newPassword) {
        const session = this.getSession();
        if (!session) throw new Error('Haujaingia');

        if (newPassword.length < 6) {
            throw new Error('Nenosiri jipya liwe na herufi 6 au zaidi');
        }

        // Pata user
        const { data: users } = await supabaseClient
            .from('users')
            .select('password_hash')
            .eq('user_id', session.user_id)
            .limit(1);

        if (!users || users.length === 0) throw new Error('Mtumiaji haipo');

        // Verify old
        if (oldPassword !== users[0].password_hash) {
            throw new Error('Nenosiri la sasa si sahihi');
        }

        // Update
        const { error } = await supabaseClient
            .from('users')
            .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
            .eq('user_id', session.user_id);

        if (error) throw error;
        return true;
    }
};

window.AuthService = AuthService;