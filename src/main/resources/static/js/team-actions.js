/* team-actions.js — действия с DTO через API хелпер */
$(function () {
    function showToast(message, isError = false) {
        const $toast = $('#demoToast');
        if (!$toast.length) return;
        $toast.text(message).css({ background: isError ? '#b91c1c' : '#1f2937', opacity: '1', visibility: 'visible' });
        setTimeout(function () { $toast.css({ opacity: '0', visibility: 'hidden' }); }, 3000);
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (m) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
        });
    }

    function resolveImageUrl(imageUrl) {
        if (!imageUrl || imageUrl === 'DEFAULT_USER_IMAGE.jpg') return null;
        if (/^https?:\/\//.test(imageUrl) || imageUrl.startsWith('/') || imageUrl.startsWith('data:')) return imageUrl;
        return '/images/' + imageUrl;
    }

    async function updateAuthButtons() {
        const $auth = $('#authButtons');
        if (!$auth.length) return;

        try {
            const data = await window.api.get('/api/auth/check');

            if (data.authenticated && data.user) {
                const imageUrl = resolveImageUrl(data.user.imageUrl);
                $auth.html(`
                    <div class="profile-icon" id="profileIcon">
                        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" class="avatar-mini" alt="avatar">` : '<i class="fas fa-user-circle"></i>'}
                    </div>
                `);
                $('#profileIcon').off('click').on('click', function () { window.location.href = '/profile'; });
                if (typeof getCurrentUser === 'function') getCurrentUser();
                if (typeof createNotificationIcon === 'function') setTimeout(createNotificationIcon, 100);
            } else {
                $auth.html(`
                    <button class="btn-outline" id="registerBtn">Регистрация</button>
                    <button class="btn-primary" id="loginBtn">Вход</button>
                `);
                $('#registerBtn').off('click').on('click', function () { window.location.href = '/register'; });
                $('#loginBtn').off('click').on('click', function () { window.location.href = '/login'; });
            }
        } catch (error) {
            console.error('Auth check error:', error);
            $auth.html(`
                <button class="btn-outline" id="registerBtn">Регистрация</button>
                <button class="btn-primary" id="loginBtn">Вход</button>
            `);
            $('#registerBtn').off('click').on('click', function () { window.location.href = '/register'; });
            $('#loginBtn').off('click').on('click', function () { window.location.href = '/login'; });
        }
    }

    async function getAuthUser() {
        try {
            const data = await window.api.get('/api/auth/check');
            if (data.authenticated && data.user) return data.user;
            throw new Error('Необходимо авторизоваться');
        } catch (error) {
            throw new Error('Необходимо авторизоваться');
        }
    }

    function initInviteButton() {
        $('#addMemberBtn, #addMemberCard').off('click').on('click', function (event) {
            event.preventDefault();
            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }
            if (typeof openInviteModal === 'function') openInviteModal();
        });
    }

    function initKickButtons() {
        $('.btn-kick').off('click').on('click', function (event) {
            event.stopPropagation();
            const userId = $(this).data('user-id');
            if (!confirm('Вы уверены, что хотите исключить этого участника?')) return;

            window.api.delete(`/api/teams/${window.teamData.id}/members/${userId}`)
                .done(function () {
                    showToast('✅ Участник исключён из команды');
                    setTimeout(function () { window.location.reload(); }, 800);
                })
                .fail(function (xhr) {
                    showToast('❌ ' + (xhr.responseJSON?.message || 'Не удалось исключить участника'), true);
                });
        });
    }

    function initJoinButton() {
        $('#joinTeamBtn').off('click').on('click', async function () {
            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }

            const $button = $(this);
            $button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Вступление...');

            try {
                const user = await getAuthUser();
                await window.api.post(`/api/teams/${window.teamData.id}/members`, { userId: user.id });
                showToast('✅ Вы вступили в команду');
                setTimeout(function () { window.location.reload(); }, 800);
            } catch (error) {
                showToast('❌ ' + (error.message || 'Не удалось вступить в команду'), true);
                $button.prop('disabled', false).html('<i class="fas fa-sign-in-alt"></i> Вступить в команду');
            }
        });
    }

    function initLeaveButton() {
        $('#leaveTeamBtn').off('click').on('click', async function () {
            if (!confirm('Вы уверены, что хотите покинуть команду?')) return;
            
            const $button = $(this);
            $button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Выход...');

            try {
                await window.api.post(`/api/teams/${window.teamData.id}/leave`);
                showToast('✅ Вы покинули команду');
                setTimeout(function () { window.location.href = '/teams'; }, 800);
            } catch (error) {
                showToast('❌ ' + (error.message || 'Не удалось покинуть команду'), true);
                $button.prop('disabled', false).html('<i class="fas fa-sign-out-alt"></i> Покинуть команду');
            }
        });
    }

    updateAuthButtons();
    initInviteButton();
    initKickButtons();
    initJoinButton();
    initLeaveButton();
    if (typeof initModal === 'function') initModal();
});