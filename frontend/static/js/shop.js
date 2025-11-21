//console.log("SHOP JS LOADED!!!");

document.addEventListener("DOMContentLoaded", () => {

    const grid = document.getElementById("characters-grid");

    const modalUnlocked = document.getElementById("character-modal");
    const modalLocked = document.getElementById("locked-modal");
    const modalUnlock = document.getElementById("unlock-modal");

    const modalImg = document.getElementById("modal-character-img");
    const modalEmoji = document.getElementById("modal-character-emoji");
    const modalMsg = document.getElementById("modal-unlock-message");
    const modalGreeting = document.getElementById("modal-character-greeting");

    const unlockEmoji = document.getElementById("unlock-character-emoji");
    const unlockName = document.getElementById("unlock-character-name");
    const unlockPrice = document.getElementById("unlock-price");

    const confirmUnlockBtn = document.getElementById("confirm-unlock");
    const cancelUnlockBtn = document.getElementById("cancel-unlock");

    let selectedCharacterId = null;

    loadCharacters();

    function loadCharacters() {
        fetch("/shop/api/characters/")
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                renderCharacters(data.characters, data.active_character);
            }
        });
    }

    function renderCharacters(list, activeCharacter) {
        grid.innerHTML = "";

        list.forEach(char => {
            const card = document.createElement("div");
            card.className = `character-card ${char.is_unlocked ? "unlocked" : "locked"}`;

            card.innerHTML = `
                ${!char.is_unlocked ? `<div class="lock-icon">🔒</div>` : ""}
                
                <div class="character-avatar">
                    <img src="${char.image_path}" alt="${char.name}">
                    <div class="character-emoji">${char.emoji}</div>
                </div>

                <div class="character-name">${char.name}</div>

                <div class="character-status ${char.is_unlocked ? "unlocked" : "locked"}">
                    ${char.is_unlocked ? "UNLOCKED" : "LOCKED"}
                </div>

                ${
                    char.is_unlocked
                    ? `
                        <div class="character-actions">
                            <button class="select-btn" data-id="${char.id}"
                                ${activeCharacter && activeCharacter.id === char.id ? "disabled" : ""}>
                                ${activeCharacter && activeCharacter.id === char.id ? "ACTIVE" : "SELECT"}
                            </button>
                        </div>
                    `
                    : `
                        <div class="character-price">Price: ${char.price} Coins</div>
                        <div class="character-actions">
                            <button class="unlock-btn" data-id="${char.id}" data-price="${char.price}">
                                UNLOCK
                            </button>
                        </div>
                    `
                }
            `;

            grid.appendChild(card);
        });

        bindEvents();
    }

    function bindEvents() {
        // Unlocked Button
        document.querySelectorAll(".unlock-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                selectedCharacterId = btn.dataset.id;

                unlockEmoji.textContent = "🎁";
                unlockName.textContent = "Unlock Character";
                unlockPrice.textContent = btn.dataset.price + " Coins";

                modalUnlock.classList.add("active");
            });
        });

        // Select Button
        document.querySelectorAll(".select-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                activateCharacter(btn.dataset.id);
            });
        });

        // CLICK VÀO CARD BỊ KHÓA → SHOW LOCKED MODAL
        document.querySelectorAll(".character-card.locked").forEach(card => {
            card.addEventListener("click", () => {
                modalLocked.classList.add("active");
            });
        });

        // CLICK VÀO CARD ĐÃ MỞ KHÓA → SHOW UNLOCKED MODAL
        document.querySelectorAll(".character-card.unlocked").forEach(card => {
            card.addEventListener("click", () => {
                modalUnlocked.classList.add("active");

                const imgSrc = card.querySelector("img").src;
                const emoji = card.querySelector(".character-emoji").textContent;
                const name = card.querySelector(".character-name").textContent;

                modalImg.src = imgSrc;
                //modalEmoji.textContent = emoji;
                modalMsg.textContent = `${name} is unlocked!`;
                modalGreeting.textContent = "Nice to meet you! Let's study together!";
            });
        });

        // CANCEL & CONFIRM MỞ KHÓA
        cancelUnlockBtn.addEventListener("click", () => {
            modalUnlock.classList.remove("active");
        });

        confirmUnlockBtn.addEventListener("click", () => {
            unlockCharacter(selectedCharacterId);
        });

        // Close unlocked modal
        const closeUnlocked = document.getElementById("close-unlocked-modal");
        if (closeUnlocked) {
            closeUnlocked.addEventListener("click", () => {
                modalUnlocked.classList.remove("active");
            });
        }

        // Close locked modal
        const closeLocked = document.getElementById("close-locked-modal");
        if (closeLocked) {
            closeLocked.addEventListener("click", () => {
                modalLocked.classList.remove("active");
            });
        }

    }

    function unlockCharacter(id) {
        fetch(`/shop/buy/${id}/`, {
            method: "POST",
            headers: { "X-CSRFToken": getCSRF() }
        })
        .then(res => res.json())
        .then(data => {
            modalUnlock.classList.remove("active");

            if (data.status === "success") {
                modalUnlocked.classList.add("active");

                modalImg.src = data.character.image_path;
                modalEmoji.textContent = data.character.emoji;
                modalMsg.textContent = `You unlocked ${data.character.name}!`;
                modalGreeting.textContent = data.character.random_quote;

                loadCharacters();
            } else {
                alert(data.message);
            }
        });
    }

    function activateCharacter(id) {
        fetch(`/shop/activate/${id}/`, {
            method: "POST",
            headers: { "X-CSRFToken": getCSRF() }
        })
        .then(res => res.json())
        .then(() => {
            loadCharacters();
        });
    }

    function getCSRF() {
        const cookie = document.cookie.split("; ").find(x => x.startsWith("csrftoken="));
        return cookie ? cookie.split("=")[1] : "";
    }
});
