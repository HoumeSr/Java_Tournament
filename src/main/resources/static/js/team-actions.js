/* team-actions.js — действия с DTO через jQuery/AJAX */
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

    function updateAuthButtons() {
        $.ajax({ url: '/api/auth/check', method: 'GET', dataType: 'json' }).done(function (data) {
            const $auth = $('#authButtons');
            if (!$auth.length) return;

            if (data.authenticated && data.user) {
                const imageUrl = resolveImageUrl(data.user.imageUrl);
                $auth.html(`
                    <div class="profile-icon" id="profileIcon">
                        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" class="avatar-mini" alt="avatar">` : '<i class="fas fa-user-circle"></i>'}
                    </div>
                `);
                $('#profileIcon').on('click', function () { window.location.href = '/profile'; });
                if (typeof getCurrentUser === 'function') getCurrentUser();
                if (typeof createNotificationIcon === 'function') setTimeout(createNotificationIcon, 100);
            } else {
                $auth.html(`
                    <button class="btn-outline" id="registerBtn">Регистрация</button>
                    <button class="btn-primary" id="loginBtn">Вход</button>
                `);
                $('#registerBtn').on('click', function () { window.location.href = '/register'; });
                $('#loginBtn').on('click', function () { window.location.href = '/login'; });
            }
        });
    }

    function getAuthUser() {
        return $.ajax({ url: '/api/auth/check', method: 'GET', dataType: 'json' }).then(function (data) {
            if (data.authenticated && data.user) return data.user;
            throw new Error('Необходимо авторизоваться');
        });
    }

    function initInviteButton() {
        $('#addMemberBtn, #addMemberCard').on('click', function (event) {
            event.preventDefault();
            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }
            if (typeof openInviteModal === 'function') openInviteModal();
        });
    }

    function initKickButtons() {
        $('.btn-kick').on('click', function (event) {
            event.stopPropagation();
            const userId = $(this).data('user-id');
            if (!confirm('Вы уверены, что хотите исключить этого участника?')) return;

            $.ajax({
                url: `/api/teams/${window.teamData.id}/members/${userId}`,
                method: 'DELETE',
                dataType: 'json'
            }).done(function () {
                showToast('✅ Участник исключён из команды');
                setTimeout(function () { window.location.reload(); }, 800);
            }).fail(function (xhr) {
                showToast('❌ ' + (xhr.responseJSON?.message || 'Не удалось исключить участника'), true);
            });
        });
    }

    function initJoinButton() {
        $('#joinTeamBtn').on('click', function () {
            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }

            const $button = $(this);
            $button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Вступление...');

            getAuthUser().then(function (user) {
                return $.ajax({
                    url: `/api/teams/${window.teamData.id}/members`,
                    method: 'POST',
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify({ userId: user.id })
                });
            }).done(function () {
                showToast('✅ Вы вступили в команду');
                setTimeout(function () { window.location.reload(); }, 800);
            }).fail(function (xhr) {
                showToast('❌ ' + (xhr.responseJSON?.message || xhr.message || 'Не удалось вступить в команду'), true);
                $button.prop('disabled', false).html('<i class="fas fa-sign-in-alt"></i> Вступить в команду');
            });
        });
    }

    function initLeaveButton() {
        $('#leaveTeamBtn').on('click', function () {
            if (!confirm('Вы уверены, что хотите покинуть команду?')) return;
            const $button = $(this);
            $button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Выход...');

            $.ajax({
                url: `/api/teams/${window.teamData.id}/leave`,
                method: 'POST'
            }).done(function () {
                showToast('✅ Вы покинули команду');
                setTimeout(function () { window.location.href = '/teams'; }, 800);
            }).fail(function (xhr) {
                showToast('❌ ' + (xhr.responseJSON?.message || 'Не удалось покинуть команду'), true);
                $button.prop('disabled', false).html('<i class="fas fa-sign-out-alt"></i> Покинуть команду');
            });
        });
    }

    updateAuthButtons();
    initInviteButton();
    initKickButtons();
    initJoinButton();
    initLeaveButton();
    if (typeof initModal === 'function') initModal();
});
