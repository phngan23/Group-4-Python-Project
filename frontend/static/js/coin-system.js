// Coin System Management - Updated for New Pomodoro Timer
class CoinSystem {
    constructor() {
        this.coins = parseInt(localStorage.getItem('userCoins')) || 0;
        this.unlockedCharacters = JSON.parse(localStorage.getItem('unlockedCharacters')) || ['bunny'];
        this.totalStudyTime = parseInt(localStorage.getItem('totalStudyTime')) || 0; // Tổng thời gian học (giây)
        this.currentStudySession = parseInt(localStorage.getItem('currentStudySession')) || 0; // Thời gian học hiện tại (giây)
        this.currentCharacter = localStorage.getItem('currentCharacter') || 'bunny';
        
        this.init();
    }

    init() {
        this.updateCoinDisplay();
        this.updateCharacterStates();
        this.setupEventListeners();
        this.loadStudyProgress();
        console.log('Coin System initialized:', {
            coins: this.coins,
            unlockedCharacters: this.unlockedCharacters,
            totalStudyTime: this.totalStudyTime,
            currentStudySession: this.currentStudySession
        });
    }

    // Cập nhật hiển thị xu
    updateCoinDisplay() {
        const coinCount = document.getElementById('coinCount');
        if (coinCount) {
            coinCount.textContent = this.coins;
        }
    }

    // Cập nhật trạng thái nhân vật
    updateCharacterStates() {
        const characterCards = document.querySelectorAll('.character-card');
        
        characterCards.forEach(card => {
            const character = card.dataset.character;
            const price = parseInt(card.dataset.price);
            const unlockBtn = card.querySelector('.unlock-btn');
            const selectBtn = card.querySelector('.select-btn');
            
            // Kiểm tra đã mở khóa chưa
            if (this.unlockedCharacters.includes(character)) {
                card.classList.remove('locked');
                card.classList.add('unlocked');
                if (unlockBtn) unlockBtn.style.display = 'none';
                if (selectBtn) selectBtn.style.display = 'block';
                
                // Highlight nhân vật đang chọn
                if (character === this.currentCharacter) {
                    card.style.border = '2px solid var(--success)';
                    selectBtn.textContent = 'SELECTED';
                    selectBtn.disabled = true;
                } else {
                    card.style.border = '';
                    selectBtn.textContent = 'SELECT';
                    selectBtn.disabled = false;
                }
            } else {
                card.classList.remove('unlocked');
                card.classList.add('locked');
                if (unlockBtn) {
                    unlockBtn.style.display = 'block';
                    unlockBtn.disabled = this.coins < price;
                }
                if (selectBtn) selectBtn.style.display = 'none';
            }
        });
    }

    // Thiết lập event listeners
    setupEventListeners() {
        // Nút mở khóa
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('unlock-btn')) {
                this.handleUnlockClick(e.target);
            }
            
            // Nút chọn nhân vật
            if (e.target.classList.contains('select-btn')) {
                this.handleSelectClick(e.target);
            }
            
            // Xác nhận mở khóa
            if (e.target.id === 'confirm-unlock') {
                this.confirmUnlock();
            }
            
            // Hủy mở khóa
            if (e.target.id === 'cancel-unlock') {
                this.closeUnlockModal();
            }
        });
    }

    // Xử lý click nút mở khóa
    handleUnlockClick(button) {
        const characterCard = button.closest('.character-card');
        const character = characterCard.dataset.character;
        const price = parseInt(characterCard.dataset.price);
        
        if (this.coins >= price) {
            this.showUnlockModal(character, price);
        } else {
            this.showErrorNotification(`You need ${price - this.coins} more coins to unlock this character!`);
        }
    }

    // Hiển thị modal xác nhận mở khóa
    showUnlockModal(character, price) {
        const modal = document.getElementById('unlock-modal');
        const avatar = document.getElementById('unlock-character-avatar');
        const name = document.getElementById('unlock-character-name');
        const priceDisplay = document.getElementById('unlock-price');
        
        // Lấy thông tin nhân vật
        const characterInfo = this.getCharacterInfo(character);
        
        // Cập nhật avatar
        avatar.innerHTML = `
            <img src="${characterInfo.image}" alt="${characterInfo.name}" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <div class="character-emoji" style="display: none">${characterInfo.emoji}</div>
        `;
        
        name.textContent = `Unlock ${characterInfo.name}`;
        priceDisplay.textContent = `${price} Coins`;
        
        modal.classList.add('active');
        this.currentUnlockCharacter = character;
        this.currentUnlockPrice = price;
    }

    // Đóng modal mở khóa
    closeUnlockModal() {
        const modal = document.getElementById('unlock-modal');
        modal.classList.remove('active');
        this.currentUnlockCharacter = null;
        this.currentUnlockPrice = null;
    }

    // Xác nhận mở khóa
    confirmUnlock() {
        if (!this.currentUnlockCharacter || !this.currentUnlockPrice) return;
        
        if (this.coins >= this.currentUnlockPrice) {
            // Trừ xu
            this.coins -= this.currentUnlockPrice;
            
            // Mở khóa nhân vật
            this.unlockedCharacters.push(this.currentUnlockCharacter);
            
            // Lưu vào localStorage
            this.saveToStorage();
            
            // Cập nhật giao diện
            this.updateCoinDisplay();
            this.updateCharacterStates();
            
            // Hiển thị thông báo
            this.showSuccessNotification(`Unlocked ${this.getCharacterInfo(this.currentUnlockCharacter).name}!`);
            
            // Đóng modal
            this.closeUnlockModal();
        }
    }

    // Xử lý chọn nhân vật
    handleSelectClick(button) {
        const characterCard = button.closest('.character-card');
        const character = characterCard.dataset.character;
        
        this.currentCharacter = character;
        localStorage.setItem('currentCharacter', character);
        
        // Cập nhật mascot
        this.updateMascot(character);
        
        // Cập nhật giao diện
        this.updateCharacterStates();
        
        this.showSuccessNotification(`Selected ${this.getCharacterInfo(character).name}!`);
    }

    // Cập nhật mascot
    updateMascot(character) {
        const mascot = document.querySelector('.mascot');
        const characterInfo = this.getCharacterInfo(character);
        
        if (mascot) {
            mascot.innerHTML = `
                <img src="${characterInfo.image}" alt="${characterInfo.name}" 
                     style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div style="display: none; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 30px;">
                    ${characterInfo.emoji}
                </div>
            `;
        }
    }

    // ==================== POMODORO INTEGRATION ====================

    // Thêm thời gian học từ Pomodoro (gọi mỗi giây khi timer chạy)
    addStudyTime(seconds) {
        this.currentStudySession += seconds;
        this.totalStudyTime += seconds;
        
        // Cập nhật progress bar
        this.updateStudyProgress();
        
        // Auto-save mỗi 30 giây
        if (this.currentStudySession % 30 === 0) {
            this.saveToStorage();
        }
        
        console.log(`Study time added: ${seconds}s, Total: ${this.totalStudyTime}s`);
    }

    // Khi người dùng hoàn thành session (bấm "I'm done")
    completeStudySession() {
        const sessionMinutes = Math.floor(this.currentStudySession / 60);
        
        if (sessionMinutes > 0) {
            // Tính số xu kiếm được (25 xu mỗi 25 phút)
            const coinsBefore = this.coins;
            const coinsEarned = Math.floor(sessionMinutes / 25) * 25;
            
            if (coinsEarned > 0) {
                this.coins += coinsEarned;
                this.saveToStorage();
                this.updateCoinDisplay();
                this.updateCharacterStates();
                
                // Hiển thị thông báo
                this.showSuccessNotification(
                    `Great job! You earned ${coinsEarned} coins for ${sessionMinutes} minutes of study!`
                );
            }
            
            // Reset session
            this.currentStudySession = 0;
            this.saveToStorage();
            this.updateStudyProgress();
            
            console.log(`Session completed: ${sessionMinutes} minutes, Coins earned: ${coinsEarned}`);
        }
        
        return sessionMinutes;
    }

    // Khi người dùng tiếp tục học (bấm "Continue studying")
    continueStudySession() {
        // Giữ nguyên currentStudySession để tiếp tục
        console.log('Study session continued');
    }

    // Cập nhật progress bar
    updateStudyProgress() {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const progressMessage = document.getElementById('progress-message');
        
        if (progressFill && progressText && progressMessage) {
            const sessionMinutes = Math.floor(this.currentStudySession / 60);
            const currentBlockMinutes = sessionMinutes % 25;
            const progressPercent = (currentBlockMinutes / 25) * 100;
            
            progressFill.style.width = `${progressPercent}%`;
            progressText.textContent = `${sessionMinutes} minutes studied`;
            
            if (sessionMinutes === 0) {
                progressMessage.textContent = 'Start studying to earn coins!';
            } else if (currentBlockMinutes === 0 && sessionMinutes > 0) {
                progressMessage.textContent = `🎉 You earned 25 coins! Keep going!`;
            } else {
                const minutesToNextCoin = 25 - currentBlockMinutes;
                progressMessage.textContent = `${minutesToNextCoin} minutes until next 25 coins!`;
            }
        }
    }

    // Tải tiến độ học
    loadStudyProgress() {
        this.updateStudyProgress();
    }

    // ==================== NOTIFICATION SYSTEM ====================

    // Hiển thị thông báo xu
    showCoinNotification(amount) {
        const notification = document.getElementById('coin-notification');
        const text = notification.querySelector('.achievement-text');
        
        text.textContent = `You earned ${amount} coins!`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Hiển thị thông báo thành công
    showSuccessNotification(message) {
        const notification = document.getElementById('coin-notification');
        const text = notification.querySelector('.achievement-text');
        const icon = notification.querySelector('.achievement-icon');
        
        text.textContent = message;
        icon.textContent = '🎉';
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            icon.textContent = '💰';
        }, 4000);
    }

    // Hiển thị thông báo lỗi
    showErrorNotification(message) {
        const notification = document.getElementById('coin-notification');
        const text = notification.querySelector('.achievement-text');
        const icon = notification.querySelector('.achievement-icon');
        
        text.textContent = message;
        icon.textContent = '⚠️';
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            icon.textContent = '💰';
        }, 3000);
    }

    // ==================== CHARACTER INFO ====================

    // Lấy thông tin nhân vật
    getCharacterInfo(character) {
        const characters = {
            'bunny': { 
                name: 'Bunny Scholar', 
                emoji: '🐰',
                image: 'assets/images/char1.png'
            },
            'fox': { 
                name: 'Fox Reader', 
                emoji: '🦊',
                image: 'assets/images/char2.png'
            },
            'bear': { 
                name: 'Bear Thinker', 
                emoji: '🐻',
                image: 'assets/images/char3.png'
            },
            'owl': { 
                name: 'Owl Professor', 
                emoji: '🦉',
                image: 'assets/images/char4.png'
            },
            'cat': { 
                name: 'Cat Coder', 
                emoji: '🐱',
                image: 'assets/images/char5.png'
            },
            'panda': { 
                name: 'Panda Writer', 
                emoji: '🐼',
                image: 'assets/images/char6.png'
            }
        };
        
        return characters[character] || { name: 'Unknown', emoji: '❓', image: '' };
    }

    // ==================== STORAGE MANAGEMENT ====================

    // Lưu vào localStorage
    saveToStorage() {
        localStorage.setItem('userCoins', this.coins.toString());
        localStorage.setItem('unlockedCharacters', JSON.stringify(this.unlockedCharacters));
        localStorage.setItem('totalStudyTime', this.totalStudyTime.toString());
        localStorage.setItem('currentStudySession', this.currentStudySession.toString());
    }

    // ==================== DEBUG & TESTING ====================

    // Reset hệ thống (cho testing)
    reset() {
        this.coins = 0;
        this.unlockedCharacters = ['bunny'];
        this.totalStudyTime = 0;
        this.currentStudySession = 0;
        this.currentCharacter = 'bunny';
        this.saveToStorage();
        this.updateCoinDisplay();
        this.updateCharacterStates();
        this.updateStudyProgress();
        
        this.showSuccessNotification('System reset successfully!');
    }

    // Thêm xu (cho testing)
    addCoins(amount) {
        this.coins += amount;
        this.saveToStorage();
        this.updateCoinDisplay();
        this.updateCharacterStates();
        this.showCoinNotification(amount);
    }

    // Xem thông tin hệ thống (cho testing)
    getStats() {
        return {
            coins: this.coins,
            unlockedCharacters: this.unlockedCharacters,
            totalStudyMinutes: Math.floor(this.totalStudyTime / 60),
            currentSessionMinutes: Math.floor(this.currentStudySession / 60),
            currentCharacter: this.currentCharacter
        };
    }
}

// Khởi tạo hệ thống xu
const coinSystem = new CoinSystem();

// Export cho các file khác sử dụng
window.coinSystem = coinSystem;

console.log('Coin System loaded successfully!');
