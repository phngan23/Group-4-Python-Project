/// Game Functionality - Updated for Coin System
function initializeGame() {
    const characterCards = document.querySelectorAll('.character-card');
    const characterModal = document.getElementById('character-modal');
    const lockedModal = document.getElementById('locked-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');

    // Character click events - chỉ xử lý khi click vào card, không phải nút
    characterCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Ngăn sự kiện khi click vào nút unlock/select
            if (e.target.classList.contains('unlock-btn') || 
                e.target.classList.contains('select-btn') ||
                e.target.closest('.unlock-btn') || 
                e.target.closest('.select-btn')) {
                return;
            }
            
            const isUnlocked = this.classList.contains('unlocked');
            
            if (isUnlocked) {
                // Show congratulations modal
                showCharacterModal(this);
            } else {
                // Show locked modal
                showLockedModal();
            }
        });
    });

    // Close modal events
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            closeModals();
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === characterModal) {
            characterModal.classList.remove('active');
        }
        if (event.target === lockedModal) {
            lockedModal.classList.remove('active');
        }
    });

    // Cập nhật mascot khi trang được load
    if (window.coinSystem) {
        window.coinSystem.updateMascot(window.coinSystem.currentCharacter);
    }
}

function showCharacterModal(card) {
    const characterModal = document.getElementById('character-modal');
    const character = card.getAttribute('data-character');
    const modalCharacterAvatar = characterModal.querySelector('.modal-character-avatar');
    const characterGreeting = characterModal.querySelector('.character-greeting');
    
    // Lấy thông tin nhân vật từ coinSystem
    const characterInfo = window.coinSystem ? window.coinSystem.getCharacterInfo(character) : null;
    
    // Update character avatar
    const charImg = card.querySelector('img');
    const emoji = card.querySelector('.character-emoji').textContent;
    
    // Reset avatar
    modalCharacterAvatar.innerHTML = '';
    modalCharacterAvatar.style.backgroundImage = 'none';
    
    if (charImg && charImg.src && !charImg.style.display) {
        const img = document.createElement('img');
        img.src = charImg.src;
        img.alt = characterInfo ? characterInfo.name : 'Character';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%';
        modalCharacterAvatar.appendChild(img);
    } else {
        const emojiElement = document.createElement('div');
        emojiElement.className = 'character-emoji';
        emojiElement.textContent = characterInfo ? characterInfo.emoji : emoji;
        emojiElement.style.fontSize = '50px';
        modalCharacterAvatar.appendChild(emojiElement);
    }
    
    // Set character-specific greeting
    const greetings = {
        'bunny': "HELLOOO! MY NAME IS BUNNY!<br>NICE TO MEET YOU !? 🐰",
        'fox': "HELLO! I'M FOXY THE READER!<br>READ ANY GOOD BOOKS LATELY? 📚",
        'bear': "GREETINGS! I'M BEAR THE THINKER!<br>LET'S SOLVE SOME PROBLEMS! 🧠",
        'owl': "HOOT HOOT! I'M OWL PROFESSOR!<br>READY TO LEARN SOMETHING NEW? 🦉",
        'cat': "MEOW! I'M CAT CODER!<br>LET'S WRITE SOME AMAZING CODE! 💻",
        'panda': "HI THERE! I'M PANDA WRITER!<br>READY TO CREATE SOME STORIES? 📝"
    };
    
    characterGreeting.innerHTML = greetings[character] || "HELLOOO! MY NAME IS ...<br>NICE TO MEET YOU !?";
    
    characterModal.classList.add('active');
}

function showLockedModal() {
    const lockedModal = document.getElementById('locked-modal');
    lockedModal.classList.add('active');
}

function closeModals() {
    document.querySelectorAll('.character-modal, .locked-modal, .unlock-modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Game page loaded - Character selection ready');
    initializeGame();
});

// Hàm để các file khác có thể gọi
window.gameSystem = {
    showCharacterModal,
    showLockedModal,
    closeModals
};