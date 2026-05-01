// team-modal.js
(function() {
    let selectedUserId = null;
    let selectedUserData = null;
    let searchTimeout = null;

    function showToast(message, isError = false) {
        const $toast = $('#demoToast');
        if (!$toast.length) return;
        $toast.text(message).css({ background: isError ? '#b91c1c' : '#1f2937', opacity: '1', visibility: 'visible' });
        setTimeout(function () { $toast.css({ opacity: '0', visibility: 'hidden' }); }, 3000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            if (m === '"') return '&quot;';
            if (m === "'") return '&#039;';
            return m;
        });
    }

    function openInviteModal() {
        const $modal = $('#inviteModal');
        if (!$modal.length) return;

        $modal.css('display', 'flex');
        $('body').css('overflow', 'hidden');

        $('#usernameOrEmail').val('');
        $('#searchResults').css('display', 'none').empty();
        $('#selectedUserContainer').css('display', 'none');
        $('#sendInviteBtn').prop('disabled', true);

        selectedUserId = null;
        selectedUserData = null;
        
        setTimeout(() => $('#usernameOrEmail').trigger('focus'), 50);
    }

    function closeInviteModal() {
        const $modal = $('#inviteModal');
        if (!$modal.length) return;

        $modal.css('display', 'none');
        $('body').css('overflow', '');

        selectedUserId = null;
        selectedUserData = null;
    }

    async function searchUsers(query) {
        if (!query || query.length < 2) {
            $('#searchResults').css('display', 'none');
            return;
        }

        const $resultsDiv = $('#searchResults');
        $resultsDiv.css('display', 'block').html('<div class="loading-users"><i class="fas fa-spinner fa-spin"></i><br>Поиск...</div>');

        try {
            const users = await window.api.get(`/api/users/search?q=${encodeURIComponent(query)}`);

            if (!users || users.length === 0) {
                $resultsDiv.html('<div class="no-results"><i class="fas fa-user-slash"></i><br>Пользователь не найден</div>');
                return;
            }

            $resultsDiv.empty();

            users.forEach(user => {
                if (!user) return;

                const username = user.username || 'Без имени';

                const $userDiv = $(`
                    <div class="search-result-item">
                        <div class="search-result-info">
                            <span class="search-result-username">${escapeHtml(username)}</span>
                            <span class="search-result-email">${escapeHtml(user.country || 'Игрок')}</span>
                        </div>
                        <button class="search-result-select"
                            data-user-id="${user.id}"
                            data-username="${escapeHtml(username)}"
                            data-country="${escapeHtml(user.country || '')}"
                            data-image="${escapeHtml(user.imageUrl || '')}">
                            Выбрать
                        </button>
                    </div>
                `);

                $userDiv.find('.search-result-select').on('click', (e) => {
                    e.stopPropagation();
                    selectUser({
                        id: user.id,
                        username: username,
                        country: user.country,
                        imageUrl: user.imageUrl
                    });
                });

                $resultsDiv.append($userDiv);
            });
        } catch (error) {
            console.error('Search error:', error);
            $resultsDiv.html(`<div class="no-results"><i class="fas fa-exclamation-triangle"></i><br>${escapeHtml(error.message)}</div>`);
        }
    }

    function selectUser(user) {
        if (!user) {
            showToast('❌ Не удалось выбрать пользователя', true);
            return;
        }

        selectedUserId = user.id;
        selectedUserData = user;

        $('#searchResults').css('display', 'none');
        $('#usernameOrEmail').val(user.username || '');

        const $selectedContainer = $('#selectedUserContainer');
        const $selectedCard = $('#selectedUserCard');

        const avatarHtml = user.imageUrl
            ? `<img src="${escapeHtml(user.imageUrl)}" alt="avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
               <i class="fas fa-user-circle" style="display: none;"></i>`
            : `<i class="fas fa-user-circle"></i>`;

        $selectedCard.html(`
            <div class="selected-user-avatar">
                ${avatarHtml}
            </div>
            <div class="selected-user-info">
                <span class="selected-user-name">${escapeHtml(user.username || 'Без имени')}</span>
                <span class="selected-user-email">${escapeHtml(user.country || 'Игрок')}</span>
            </div>
            <button class="change-user-btn" id="changeUserBtn" title="Изменить">
                <i class="fas fa-pen"></i>
            </button>
        `);

        $selectedContainer.css('display', 'block');
        $('#sendInviteBtn').prop('disabled', false);

        $('#changeUserBtn').off('click').on('click', () => {
            $selectedContainer.css('display', 'none');
            $('#sendInviteBtn').prop('disabled', true);
            $('#usernameOrEmail').val('').trigger('focus');

            selectedUserId = null;
            selectedUserData = null;
        });
    }

    async function sendInvite() {
        if (!selectedUserId) {
            showToast('❌ Выберите пользователя', true);
            return;
        }

        if (window.teamData?.currentMembersCount >= window.teamData?.maxMembersCount) {
            showToast('❌ Команда уже заполнена', true);
            closeInviteModal();
            return;
        }

        if (window.currentUser && window.currentUser.id === selectedUserId) {
            showToast('❌ Нельзя пригласить самого себя', true);
            return;
        }

        const $sendBtn = $('#sendInviteBtn');
        const originalText = $sendBtn.html();

        $sendBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Отправка...');

        try {
            const teamId = window.teamData && window.teamData.id;

            if (!teamId) {
                throw new Error('Не удалось определить команду для приглашения');
            }

            const invitedUsername = selectedUserData?.username || 'игроку';

            await window.api.post(`/api/teams/${teamId}/invite`, {
                userId: selectedUserId
            });

            closeInviteModal();
            showToast(`✅ Приглашение отправлено игроку ${escapeHtml(invitedUsername)}!`);
        } catch (error) {
            showToast(`❌ ${error.message}`, true);
        } finally {
            $sendBtn.prop('disabled', false).html(originalText);
        }
    }

    function initModal() {
        const $searchInput = $('#usernameOrEmail');

        if ($searchInput.length) {
            $searchInput.off('input').on('input', (e) => {
                if (searchTimeout) clearTimeout(searchTimeout);

                searchTimeout = setTimeout(() => {
                    searchUsers($(e.target).val().trim());
                }, 300);
            });

            $searchInput.off('focus').on('focus', () => {
                const val = $searchInput.val().trim();
                if (val.length >= 2 && !selectedUserId) {
                    searchUsers(val);
                }
            });
        }

        $('#sendInviteBtn').off('click').on('click', sendInvite);
        $('#closeInviteModalBtn, #cancelInviteBtn').off('click').on('click', closeInviteModal);
        $('#inviteModal .modal-overlay').off('click').on('click', closeInviteModal);

        $(document).off('keydown').on('keydown', (e) => {
            if (e.key === 'Escape') {
                const $modal = $('#inviteModal');
                if ($modal.length && $modal.css('display') === 'flex') {
                    closeInviteModal();
                }
            }
        });
    }

    // Экспортируем функции в глобальную область
    window.openInviteModal = openInviteModal;
    window.closeInviteModal = closeInviteModal;
    window.initModal = initModal;
})();