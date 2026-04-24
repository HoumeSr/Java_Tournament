// ========== ДЕЙСТВИЯ С КОМАНДОЙ ==========

function updateAuthButtons() {
    const authContainer = document.getElementById('authButtons');
    if (!authContainer) return;
    
    fetch('/api/auth/check')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                const imageUrl = data.user?.imageUrl;
                
                if (imageUrl) {
                    authContainer.innerHTML = `
                        <div class="profile-icon" id="profileIcon">
                            <img src="${imageUrl}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
                        </div>
                    `;
                } else {
                    authContainer.innerHTML = `
                        <div class="profile-icon" id="profileIcon">
                            <i class="fas fa-user-circle" style="font-size: 36px; color: #9ca3af;"></i>
                        </div>
                    `;
                }
                
                document.getElementById('profileIcon')?.addEventListener('click', () => {
                    window.location.href = '/profile';
                });
                
                getCurrentUser().then(() => {
                    setTimeout(createNotificationIcon, 100);
                });
            } else {
                authContainer.innerHTML = `
                    <button class="btn-outline" id="registerBtn">Регистрация</button>
                    <button class="btn-primary" id="loginBtn">Вход</button>
                `;
                document.getElementById('registerBtn')?.addEventListener('click', () => {
                    window.location.href = '/register';
                });
                document.getElementById('loginBtn')?.addEventListener('click', () => {
                    window.location.href = '/login';
                });
            }
        })
        .catch(() => {});
}

function initActionButtons() {
    const addMemberBtn = document.getElementById('addMemberBtn');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => {
            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }
            openInviteModal();
        });
    }
    
    const addMemberCard = document.getElementById('addMemberCard');
    if (addMemberCard) {
        addMemberCard.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add') || e.target.closest('.btn-add')) return;
            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }
            openInviteModal();
        });
    }
    
    const kickBtns = document.querySelectorAll('.btn-kick');
    kickBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const userId = btn.dataset.userId;
            if (confirm('Вы уверены, что хотите исключить этого участника?')) {
                try {
                    const response = await fetch(`/api/teams/${window.teamData.id}/members/${userId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                        }
                    });
                    
                    if (response.ok) {
                        showToast('✅ Участник исключен из команды');
                        setTimeout(() => window.location.reload(), 1000);
                    } else {
                        const error = await response.json();
                        showToast(`❌ ${error.message || 'Не удалось исключить участника'}`, true);
                    }
                } catch (error) {
                    showToast('❌ Ошибка при исключении участника', true);
                }
            }
        });
    });
    
    const joinBtn = document.getElementById('joinTeamBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', async () => {
            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }
            
            try {
                if (!currentUser) {
                    await getCurrentUser();
                }
                
                const response = await fetch(`/api/teams/${window.teamData.id}/members`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                    },
                    body: JSON.stringify({ userId: currentUser?.id })
                });
                
                if (response.ok) {
                    showToast('✅ Вы вступили в команду!');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    const error = await response.json();
                    showToast(`❌ ${error.message || 'Не удалось вступить в команду'}`, true);
                }
            } catch (error) {
                showToast('❌ Ошибка при вступлении в команду', true);
            }
        });
    }
    
    const leaveBtn = document.getElementById('leaveTeamBtn');
    if (leaveBtn) {
        leaveBtn.addEventListener('click', async () => {
            if (confirm('Вы уверены, что хотите покинуть команду?')) {
                try {
                    if (!currentUser) {
                        await getCurrentUser();
                    }
                    
                    const response = await fetch(`/api/teams/${window.teamData.id}/members/${currentUser?.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                        }
                    });
                    
                    if (response.ok) {
                        showToast('✅ Вы покинули команду');
                        setTimeout(() => window.location.reload(), 1000);
                    } else {
                        const error = await response.json();
                        showToast(`❌ ${error.message || 'Не удалось покинуть команду'}`, true);
                    }
                } catch (error) {
                    showToast('❌ Ошибка при выходе из команды', true);
                }
            }
        });
    }
}

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    initActionButtons();
    initModal();
});