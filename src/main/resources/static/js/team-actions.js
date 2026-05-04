/* team-actions.js — действия с DTO через API хелпер */
$(function () {
    let teamDetails = null; // Храним полный DTO команды

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

    // ========== ЗАГРУЗКА ДАННЫХ КОМАНДЫ ==========
    async function loadTeamDetails() {
        const teamId = window.teamData?.id;
        if (!teamId) return null;

        try {
            const data = await window.api.get(`/api/teams/${teamId}`);
            teamDetails = data;
            
            // Обновляем window.teamData новыми полями
            if (window.teamData) {
                window.teamData.rosterLocked = data.rosterLocked;
                window.teamData.rosterLockReason = data.rosterLockReason;
                window.teamData.canLeaveTeam = data.canLeaveTeam;
                window.teamData.canKickMembers = data.canKickMembers;
                window.teamData.canInviteMembers = data.canInviteMembers;
                window.teamData.canAddMembers = data.canAddMembers;
            }
            
            // Показываем блокировку состава, если нужно
            if (data.rosterLocked && data.rosterLockReason) {
                showRosterLockedWarning(data.rosterLockReason);
            }
            
            // Инициализируем UI в зависимости от прав
            initUIByPermissions();
            
            return data;
        } catch (error) {
            console.error('Error loading team details:', error);
            return null;
        }
    }

    // ========== ПОКАЗ ПРЕДУПРЕЖДЕНИЯ О БЛОКИРОВКЕ ==========
    function showRosterLockedWarning(reason) {
        // Удаляем существующее предупреждение
        $('.roster-locked-warning').remove();
        
        const $warning = $(`
            <div class="roster-locked-warning">
                <i class="fas fa-lock"></i>
                <span>${escapeHtml(reason)}</span>
            </div>
        `);
        
        // Вставляем после team-info-card
        $('.team-info-card').after($warning);
        
        // Добавляем анимацию
        $warning.hide().fadeIn(300);
    }

    // ========== ИНИЦИАЛИЗАЦИЯ UI ПО ПРАВАМ ==========
    function initUIByPermissions() {
        if (!teamDetails) return;
        
        // 1. Кнопка "Покинуть команду"
        if (!teamDetails.canLeaveTeam) {
            $('#leaveTeamBtn').hide();
        }
        
        // 2. Кнопки "Исключить участника"
        if (!teamDetails.canKickMembers) {
            $('.btn-kick').hide();
        }
        
        // 3. Кнопка "Пригласить участника" и карточка добавления
        if (!teamDetails.canInviteMembers) {
            $('#addMemberBtn, #addMemberCard').hide();
        }
        
        // 4. Кнопка "Вступить в команду"
        if (!teamDetails.canAddMembers) {
            $('#joinTeamBtn').hide();
        }
        
        // Если состав заблокирован, дополнительно блокируем кнопки визуально
        if (teamDetails.rosterLocked) {
            $('#leaveTeamBtn, #joinTeamBtn, .btn-kick, #addMemberBtn, #addMemberCard')
                .css('opacity', '0.5')
                .attr('title', teamDetails.rosterLockReason || 'Состав заблокирован');
        }
    }

    // ========== ОБНОВЛЕНИЕ СЧЁТЧИКОВ ==========
    function updateMembersCount() {
        const currentCount = $('.member-card:not(.add-member-card)').length;
        const maxMembers = teamDetails?.maxMembersCount || window.teamData?.maxMembersCount || 0;
        
        // Обновляем все счётчики
        $('.members-count, .team-size-badge span, .meta-card strong').each(function() {
            const $el = $(this);
            const text = $el.text();
            if (text.includes('/') || $el.closest('.meta-card').length) {
                $el.text(`${currentCount} / ${maxMembers}`);
            }
        });
        
        // Обновляем данные
        if (window.teamData) {
            window.teamData.currentMembersCount = currentCount;
        }
        if (teamDetails) {
            teamDetails.currentMembersCount = currentCount;
        }
        
        // Обновляем кнопку вступления
        const $joinBtn = $('#joinTeamBtn');
        if ($joinBtn.length && teamDetails?.canAddMembers !== false) {
            if (currentCount >= maxMembers) {
                $joinBtn.prop('disabled', true);
                $joinBtn.html('<i class="fas fa-ban"></i> Команда заполнена');
            } else {
                $joinBtn.prop('disabled', false);
                $joinBtn.html('<i class="fas fa-sign-in-alt"></i> Вступить в команду');
            }
        }
        
        // Обновляем карточку добавления
        if (teamDetails?.canInviteMembers !== false) {
            const $addMemberCard = $('.add-member-card');
            const $addMemberBtn = $('#addMemberBtn');
            
            if (currentCount >= maxMembers) {
                if ($addMemberCard.length) $addMemberCard.fadeOut();
                if ($addMemberBtn.length) $addMemberBtn.prop('disabled', true);
            } else {
                if ($addMemberCard.length) $addMemberCard.fadeIn();
                if ($addMemberBtn.length) $addMemberBtn.prop('disabled', false);
            }
        }
    }

    // ========== УДАЛЕНИЕ УЧАСТНИКА ==========
    async function kickMember(userId, $memberCard) {
        if (!teamDetails?.canKickMembers) {
            showToast('❌ Сейчас нельзя исключать участников', true);
            return;
        }
        
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
            const errorMsg = error.responseJSON?.message || error.message || 'Не удалось исключить участника';
            showToast(`❌ ${errorMsg}`, true);
        }
    }

    // ========== ПРИГЛАШЕНИЕ ==========
    function initInviteButton() {
        $('#addMemberBtn, #addMemberCard').off('click').on('click', function (event) {
            event.preventDefault();
            
            if (!teamDetails?.canInviteMembers) {
                const reason = teamDetails?.rosterLockReason || 'Сейчас нельзя приглашать участников';
                showToast(`❌ ${reason}`, true);
                return;
            }
            
            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }
            
            if (typeof openInviteModal === 'function') openInviteModal();
        });
    }

    // ========== КНОПКИ УДАЛЕНИЯ ==========
    function initKickButtons() {
        $('.btn-kick').off('click').on('click', async function (event) {
            event.stopPropagation();
            
            if (!teamDetails?.canKickMembers) {
                const reason = teamDetails?.rosterLockReason || 'Сейчас нельзя исключать участников';
                showToast(`❌ ${reason}`, true);
                return;
            }
            
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

    // ========== ВСТУПЛЕНИЕ В КОМАНДУ ==========
    function initJoinButton() {
        $('#joinTeamBtn').off('click').on('click', async function () {
            if (!teamDetails?.canAddMembers) {
                const reason = teamDetails?.rosterLockReason || 'Сейчас нельзя вступить в команду';
                showToast(`❌ ${reason}`, true);
                return;
            }
            
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
                const errorMsg = error.responseJSON?.message || error.message || 'Не удалось вступить в команду';
                showToast(`❌ ${errorMsg}`, true);
                $button.prop('disabled', false).html('<i class="fas fa-sign-in-alt"></i> Вступить в команду');
            }
        });
    }

    // ========== ВЫХОД ИЗ КОМАНДЫ ==========
    function initLeaveButton() {
        $('#leaveTeamBtn').off('click').on('click', async function () {
            if (!teamDetails?.canLeaveTeam) {
                const reason = teamDetails?.rosterLockReason || 'Сейчас нельзя покинуть команду';
                showToast(`❌ ${reason}`, true);
                return;
            }
            
            if (!confirm('Вы уверены, что хотите покинуть команду?')) return;
            
            const $button = $(this);
            $button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Выход...');

            try {
                await window.api.post(`/api/teams/${window.teamData.id}/leave`);
                showToast('✅ Вы покинули команду');
                setTimeout(function () { window.location.href = '/teams'; }, 800);
            } catch (error) {
                const errorMsg = error.responseJSON?.message || error.message || 'Не удалось покинуть команду';
                showToast(`❌ ${errorMsg}`, true);
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

    // ========== ЗАПУСК ==========
    (async function init() {
        await updateAuthButtons();
        await loadTeamDetails(); // Загружаем полные данные с флагами
        initInviteButton();
        initKickButtons();
        initJoinButton();
        initLeaveButton();
        initMemberClickHandlers();
        if (typeof initModal === 'function') initModal();
    })();
});