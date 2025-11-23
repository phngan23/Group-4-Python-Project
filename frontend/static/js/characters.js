// My Characters với ảnh thật từ frontend/static/assets/images/char1/
let characters = [];
let activeCharacter = null;

document.addEventListener("DOMContentLoaded", function () {
  loadCharacters();
});

function loadCharacters() {
  fetch("/shop/api/characters/")
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        characters = data.characters;
        activeCharacter = data.active_character;

        // 1. Cập nhật Mascot ở góc màn hình (Luôn chạy)
        updateMascot(activeCharacter);

        // 2. Cập nhật giao diện Shop (Chỉ chạy nếu đang ở trang Shop)
        if (document.getElementById("characters-grid")) {
          renderActiveCharacter();
          renderCharactersGrid();
        }
      } else {
        console.log("Failed to load characters");
        showError("Failed to load characters");
      }
    })
    .catch((error) => {
      console.error("Error loading characters:", error);
      showError("Error loading characters");
    });
}

function updateMascot(character) {
  const mascotDiv = document.querySelector(".mascot");
  if (!mascotDiv) return;

  if (character && character.image_path) {
    mascotDiv.innerHTML = `
            <img src="${character.image_path}" 
                 alt="${character.name}"
                 onerror="this.style.display='none'; this.parentElement.innerText=''">
        `;
  } else {
    // Fallback về mặc định
    mascotDiv.innerText = " ";
  }
}

function renderActiveCharacter() {
  const container = document.getElementById("active-character");

  if (!activeCharacter) {
    container.innerHTML = `
            <div class="no-active-character">
                <img src="/static/assets/images/char1/default.png" alt="No Character">
                <p>No active character selected</p>
                <p class="subtext">Unlock and select a character to get started!</p>
            </div>
        `;
    return;
  }

  container.innerHTML = `
        <div class="character-avatar-large">
            <img src="${activeCharacter.image_path}" 
                 alt="${activeCharacter.name}"
                 onerror="this.src='/static/assets/images/char1/default.png'">
        </div>
        <div class="character-name-large">${activeCharacter.name}</div>
        <div class="character-bio">${activeCharacter.bio}</div>
    `;
}

function renderCharactersGrid() {
  const container = document.getElementById("characters-grid");

  container.innerHTML = characters
    .map((character) => {
      const isActive = activeCharacter && character.id === activeCharacter.id;
      const statusClass = character.is_unlocked
        ? "status-unlocked"
        : "status-locked";
      const statusText = character.is_unlocked ? "UNLOCKED" : "LOCKED";

      return `
            <div class="character-card ${isActive ? "active" : ""}" 
                 onclick="${
                   character.is_unlocked
                     ? `selectCharacter(${character.id})`
                     : ""
                 }">
                <div class="character-avatar">
                    <img src="${character.image_path}" 
                         alt="${character.name}"
                         onerror="this.src='/static/assets/images/char1/default.png'">
                </div>
                <div class="character-name">${character.name}</div>
                <div class="character-rarity ${
                  character.rarity
                }">${character.rarity.toUpperCase()}</div>
                <div class="character-status ${statusClass}">${statusText}</div>
                
                ${
                  !character.is_unlocked
                    ? `
                    <div class="unlock-price">${character.price} coins</div>
                    <button class="select-btn" onclick="event.stopPropagation(); unlockCharacter(${character.id})">
                        Unlock
                    </button>
                `
                    : `
                    <button class="select-btn" onclick="event.stopPropagation(); selectCharacter(${
                      character.id
                    })"
                            ${isActive ? "disabled" : ""}>
                        ${isActive ? "Active" : "Select"}
                    </button>
                `
                }
            </div>
        `;
    })
    .join("");
}

// Các hàm selectCharacter, unlockCharacter giữ nguyên...
function selectCharacter(characterId) {
  fetch(`/shop/api/characters/${characterId}/activate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        activeCharacter = characters.find((c) => c.id === characterId);

        // 2. Cập nhật hình tròn NGAY LẬP TỨC (Sửa lỗi phải load lại trang)
        updateMascotDisplay(activeCharacter);

        // 3. Cập nhật giao diện Shop
        if (document.getElementById("characters-grid")) {
          renderActiveCharacter();
          renderCharactersGrid();
        }

        showNotification("Character activated successfully!", "success");
      } else {
        showNotification(data.message, "error");
      }
    })
    .catch((error) => {
      console.error("Error selecting character:", error);
      showNotification("Error selecting character", "error");
    });
}

function unlockCharacter(characterId) {
  if (!confirm("Are you sure you want to unlock this character?")) {
    return;
  }

  fetch(`/shop/api/characters/${characterId}/unlock/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        showNotification("Character unlocked successfully!", "success");
        updateCoinsDisplay(data.new_balance);
        loadCharacters();
      } else {
        showNotification(data.message, "error");
      }
    })
    .catch((error) => {
      console.error("Error unlocking character:", error);
      showNotification("Error unlocking character", "error");
    });
}

function updateCoinsDisplay(newBalance) {
  const coinElements = document.querySelectorAll("#coinCount");
  coinElements.forEach((element) => {
    element.textContent = newBalance;
  });
}

function showError(message) {
  const container = document.getElementById("characters-grid");
  container.innerHTML = `
        <div class="no-characters error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}
