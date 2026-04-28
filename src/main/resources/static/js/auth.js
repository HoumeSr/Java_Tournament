window.auth = {
    currentUser: null,


    async check() {
        const result = await api.get('/api/auth/check');
        this.currentUser = result && result.authenticated ? result.user : null;
        return this.currentUser;
    },


    async requireAuth() {
        const user = await this.check();
        if (!user) {
            window.location.href = '/login';
            return null;
        }
        return user;
    },


    async logout() {
        try {
            await api.post('/api/auth/logout', {});
        } finally {
            window.location.href = '/login';
        }
    },


    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    },


    isAdmin() {
        return this.hasRole('ADMIN');
    },


    isOrganizer() {
        return this.hasRole('ORGANIZER');
    }
};
