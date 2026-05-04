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
        if (!imageUrl) return null;
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

    // ========== ОБНОВЛЕНИЕ СЧЁТЧИКОВ ==========
    function updateMembersCount() {
        const $membersGrid = $('.members-grid');
        const $membersCountSpan = $('.members-count');
        const $teamSizeBadge = $('.team-size-badge span');
        
        if (!$membersGrid.length) return;
        
        const currentCount = $('.member-card:not(.add-member-card)').length;
        const maxMembers = window.teamData?.maxMembersCount || 
                           parseInt($('.team-size-badge span').text().split('/')[1]) || 0;
        
        if ($membersCountSpan.length) {
            $membersCountSpan.text(`${currentCount} / ${maxMembers}`);
        }
        
        if ($teamSizeBadge.length) {
            $teamSizeBadge.text(`${currentCount} / ${maxMembers}`);
        }
        
        if (window.teamData) {
            window.teamData.currentMembersCount = currentCount;
        }
        
        const $addMemberCard = $('.add-member-card');
        const $addMemberBtn = $('#addMemberBtn');
        
        if (currentCount >= maxMembers) {
            if ($addMemberCard.length) $addMemberCard.fadeOut();
            if ($addMemberBtn.length) $addMemberBtn.prop('disabled', true);
        } else {
            if ($addMemberCard.length) $addMemberCard.fadeIn();
            if ($addMemberBtn.length) $addMemberBtn.prop('disabled', false);
        }
        
        const $joinBtn = $('#joinTeamBtn');
        if ($joinBtn.length) {
            if (currentCount >= maxMembers) {
                $joinBtn.prop('disabled', true);
                $joinBtn.html('<i class="fas fa-ban"></i> Команда заполнена');
            } else {
                $joinBtn.prop('disabled', false);
                $joinBtn.html('<i class="fas fa-sign-in-alt"></i> Вступить в команду');
            }
        }
    }

    // ========== УДАЛЕНИЕ УЧАСТНИКА ==========
    async function kickMember(userId, $memberCard) {
        try {
            await window.api.delete(`/api/teams/${window.teamData.id}/members/${userId}`);
            
            const memberName = $memberCard.find('.member-name').text();
            showToast(`✅ Игрок "${memberName}" исключён из команды`);
            
            $memberCard.fadeOut(300, function() {
                $(this).remove();
                updateMembersCount();
                
                const remainingMembers = $('.member-card:not(.add-member-card)').length;
                const $emptyMessage = $('.empty-members');
                
                if (remainingMembers === 0) {
                    if ($emptyMessage.length) {
                        $emptyMessage.show();
                    } else {
                        $('.members-grid').after(`
                            <div class="empty-members">
                                <i class="fas fa-user-friends"></i>
                                <p>В команде пока нет участников</p>
                            </div>
                        `);
                    }
                    $('.members-grid').hide();
                } else {
                    if ($emptyMessage.length) $emptyMessage.hide();
                    $('.members-grid').show();
                }
            });
            
        } catch (error) {
            showToast('❌ ' + (error.message || 'Не удалось исключить участника'), true);
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
        $('.btn-kick').off('click').on('click', async function (event) {
            event.stopPropagation();
            const userId = $(this).data('user-id');
            const $memberCard = $(this).closest('.member-card');
            const memberName = $memberCard.find('.member-name').text();
            
            if (!confirm(`Вы уверены, что хотите исключить игрока "${memberName}" из команды?`)) return;
            
            const $btn = $(this);
            const originalHtml = $btn.html();
            $btn.html('<i class="fas fa-spinner fa-spin"></i>').prop('disabled', true);
            
            await kickMember(userId, $memberCard);
            
            $btn.html(originalHtml).prop('disabled', false);
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

    // ========== ПЕРЕХОД НА ПРОФИЛЬ ПРИ КЛИКЕ ==========
    function initMemberClickHandlers() {
        $('.member-card').off('click').on('click', function(e) {
            if ($(e.target).closest('.btn-kick').length) return;
            
            const userId = $(this).data('user-id');
            if (userId) {
                window.location.href = `/profile/${userId}`;
            }
        });
        
        $('.member-card').css('cursor', 'pointer');
    }

    updateAuthButtons();
    initInviteButton();
    initKickButtons();
    initJoinButton();
    initLeaveButton();
    initMemberClickHandlers();
    if (typeof initModal === 'function') initModal();
});