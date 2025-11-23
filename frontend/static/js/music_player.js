// Tạo global music player nếu chưa có
if (!window.globalMusicPlayer) {
    window.globalMusicPlayer = {
        audioPlayer: new Audio(),
        isPlaying: false,
        currentTrack: null,
        tracks: [],
        currentIndex: 0
    };
}

const audioPlayer = window.globalMusicPlayer.audioPlayer;
let tracks = window.globalMusicPlayer.tracks || [];
let currentIndex = window.globalMusicPlayer.currentIndex || 0;
let isPlaying = window.globalMusicPlayer.isPlaying || false;
let progressInterval = null;

function renderTrackGrid() {
    const grid = document.getElementById("music-grid");
    if (!grid) return;

    grid.innerHTML = tracks
        .map((t, index) => {
            const coverStyle = t.cover_image_url
                ? `background-image: url('${t.cover_image_url}'); background-size: cover; background-position: center;`
                : `background: ${t.cover_color || "#6C63FF"};`;

            const description = t.description || "";

            return `
            <div class="music-card" data-index="${index}">
                <div class="music-cover" style="${coverStyle}"></div>
                <div class="music-info">
                    <h4>${t.title}</h4>
                    <p>${description}</p>
                </div>
                <button class="play-btn" data-index="${index}">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        `;
        })
        .join("");

    // Click vào nút play
    grid.querySelectorAll(".play-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const idx = Number(btn.dataset.index);
            startTrack(idx);
        });
    });

    // Click vào cả card cũng play
    grid.querySelectorAll(".music-card").forEach((card) => {
        card.addEventListener("click", () => {
            const idx = Number(card.dataset.index);
            startTrack(idx);
        });
    });
}

async function loadTracks() {
    const grid = document.getElementById("music-grid");
    if (!grid) return;

    grid.innerHTML = `<p>Loading tracks...</p>`;

    try {
        const res = await fetch("/music/api/tracks/");
        const data = await res.json();

        if (data.status !== "success") {
            grid.innerHTML = `<p>Failed to load tracks.</p>`;
            return;
        }

        tracks = data.tracks || [];
        
        // Cập nhật global state
        window.globalMusicPlayer.tracks = tracks;
        window.globalMusicPlayer.currentIndex = currentIndex;

        if (!tracks.length) {
            grid.innerHTML = `<p>No tracks available yet. Please add some in Django admin.</p>`;
            return;
        }

        renderTrackGrid();
        
        // Nếu đang có track phát, cập nhật UI
        if (window.globalMusicPlayer.currentTrack && window.globalMusicPlayer.isPlaying) {
            const savedIndex = tracks.findIndex(t => 
                t.audio_url === window.globalMusicPlayer.currentTrack.audio_url
            );
            if (savedIndex !== -1) {
                currentIndex = savedIndex;
                window.globalMusicPlayer.currentIndex = savedIndex;
                updateNowPlayingInfo(tracks[savedIndex]);
                showNowPlaying();
                updatePlayButton();
            }
        }
    } catch (err) {
        console.error("Error loading tracks:", err);
        grid.innerHTML = `<p>Error loading tracks.</p>`;
    }
}

function savePlayerState() {
    const playerState = {
        isPlaying: isPlaying,
        currentIndex: currentIndex,
        currentTime: audioPlayer.currentTime,
        currentTrack: tracks[currentIndex] || null
    };
    sessionStorage.setItem('musicPlayerState', JSON.stringify(playerState));
}

function restorePlayerState() {
    const savedState = sessionStorage.getItem('musicPlayerState');
    if (savedState) {
        const state = JSON.parse(savedState);
        
        // Khôi phục global state
        window.globalMusicPlayer.isPlaying = state.isPlaying;
        window.globalMusicPlayer.currentTrack = state.currentTrack;
        window.globalMusicPlayer.currentIndex = state.currentIndex;
        
        // Khôi phục local state
        isPlaying = state.isPlaying;
        currentIndex = state.currentIndex;
        
        // Nếu có track đang phát, tiếp tục phát
        if (state.currentTrack && state.isPlaying) {
            audioPlayer.src = state.currentTrack.audio_url;
            audioPlayer.currentTime = state.currentTime || 0;
            
            // Chỉ play nếu đang ở trang music (có UI controls)
            if (document.getElementById('now-playing')) {
                updateNowPlayingInfo(state.currentTrack);
                showNowPlaying();
                playAudio();
            } else {
                // Nếu đang ở app khác, vẫn tiếp tục phát nhưng không hiển thị UI
                audioPlayer.play().catch(console.error);
            }
        }
    }
}

function startTrack(index) {
    if (!tracks.length || !tracks[index]) return;

    currentIndex = index;
    const track = tracks[index];

    if (!track.audio_url) {
        showNotification("This track has no audio file.", "error");
        return;
    }

    audioPlayer.src = track.audio_url;
    audioPlayer.load();

    // Cập nhật global state
    window.globalMusicPlayer.currentTrack = track;
    window.globalMusicPlayer.currentIndex = index;
    window.globalMusicPlayer.isPlaying = true;

    updateNowPlayingInfo(track);
    showNowPlaying();
    playAudio();
    savePlayerState();
}

function showNowPlaying() {
    const section = document.getElementById("now-playing");
    if (section) section.style.display = "block";
}

function updateNowPlayingInfo(track) {
    const titleEl = document.getElementById("current-track");
    const artistEl = document.getElementById("current-artist");
    const playlistEl = document.getElementById("current-playlist");
    const coverEl = document.getElementById("current-cover");

    if (titleEl) titleEl.textContent = track.title || "Unknown title";
    if (artistEl) artistEl.textContent = "Focus music";
    if (playlistEl) playlistEl.textContent = getCategoryLabel(track.category);

    if (coverEl) {
        if (track.cover_image_url) {
            coverEl.style.background = `url('${track.cover_image_url}') center/cover`;
            coverEl.innerHTML = "";
        } else {
            coverEl.style.background = track.cover_color || "var(--primary)";
            coverEl.innerHTML = '<i class="fas fa-music"></i>';
        }
    }

    updateControlButtons();
}

function setupPlayerEvents() {
    const playPauseBtn = document.getElementById("play-pause-btn");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const progressBar = document.querySelector(".progress-bar");

    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", togglePlayPause);
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", playPreviousTrack);
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", playNextTrack);
    }

    if (progressBar) {
        progressBar.addEventListener("click", seekAudio);
    }

    // Audio events
    audioPlayer.addEventListener("ended", playNextTrack);
    audioPlayer.addEventListener("timeupdate", updateProgress);
    audioPlayer.addEventListener("loadedmetadata", updateTotalTime);
    audioPlayer.addEventListener("timeupdate", savePlayerState);
}

function playAudio() {
    if (!audioPlayer.src) return;

    audioPlayer
        .play()
        .then(() => {
            isPlaying = true;
            window.globalMusicPlayer.isPlaying = true;
            updatePlayButton();
            startProgressTimer();
            savePlayerState();
        })
        .catch((err) => {
            console.error("Error playing audio:", err);
            showNotification("Cannot play this track.", "error");
        });
}

function pauseAudio() {
    audioPlayer.pause();
    isPlaying = false;
    window.globalMusicPlayer.isPlaying = false;
    updatePlayButton();
    stopProgressTimer();
    savePlayerState();
}

function togglePlayPause() {
    if (!tracks.length) return;

    if (isPlaying) {
        pauseAudio();
    } else {
        if (!audioPlayer.src && tracks[currentIndex]) {
            startTrack(currentIndex);
        } else {
            playAudio();
        }
    }
}

function playNextTrack() {
    if (!tracks.length) return;

    if (currentIndex < tracks.length - 1) {
        currentIndex++;
        startTrack(currentIndex);
    } else {
        // Hết playlist
        isPlaying = false;
        window.globalMusicPlayer.isPlaying = false;
        updatePlayButton();
        stopProgressTimer();
        showNotification("Playlist finished.", "info");
        savePlayerState();
    }
}

function playPreviousTrack() {
    if (!tracks.length || currentIndex === 0) return;
    currentIndex--;
    startTrack(currentIndex);
}

function updatePlayButton() {
    const playPauseBtn = document.getElementById("play-pause-btn");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    if (!playPauseBtn) return;

    const icon = playPauseBtn.querySelector("i");
    if (icon) {
        icon.className = isPlaying ? "fas fa-pause" : "fas fa-play";
    }

    // Enable/disable khi đã chọn track
    if (tracks.length) {
        playPauseBtn.disabled = false;
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex === tracks.length - 1;
    }
}

function updateControlButtons() {
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const playPauseBtn = document.getElementById("play-pause-btn");

    if (playPauseBtn) playPauseBtn.disabled = false;
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex === tracks.length - 1;
}

function startProgressTimer() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    progressInterval = setInterval(updateProgress, 1000);
}

function stopProgressTimer() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

function updateProgress() {
    const progressFill = document.getElementById("progress-fill");
    const currentTimeEl = document.getElementById("current-time");

    if (!audioPlayer.duration || !progressFill) return;

    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressFill.style.width = `${progress}%`;

    if (currentTimeEl) {
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    }
}

function updateTotalTime() {
    const totalTimeEl = document.getElementById("total-time");
    if (totalTimeEl && audioPlayer.duration) {
        totalTimeEl.textContent = formatTime(audioPlayer.duration);
    }
}

function seekAudio(event) {
    if (!audioPlayer.duration) return;

    const progressBar = event.currentTarget;
    const clickX = event.offsetX;
    const width = progressBar.offsetWidth;
    const ratio = clickX / width;

    audioPlayer.currentTime = ratio * audioPlayer.duration;
    updateProgress();
    savePlayerState();
}

function formatTime(seconds) {
    const s = Math.floor(seconds || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getCategoryLabel(category) {
    const map = {
        lofi: "Lo-Fi Beats",
        nature: "Nature Sounds",
        classical: "Classical",
        ambient: "Ambient",
        other: "Focus Music",
    };
    return map[category] || "Focus Music";
}

function showNotification(message, type = "info") {
    const div = document.createElement("div");
    div.textContent = message;

    let bg = "#2196F3";
    if (type === "success") bg = "#4CAF50";
    if (type === "error") bg = "#f44336";
    if (type === "info") bg = "#2196F3";

    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bg};
        color: white;
        padding: 10px 16px;
        border-radius: 6px;
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2500);
}

// Lưu state khi rời trang
window.addEventListener('beforeunload', savePlayerState);

// Khởi động player khi trang load
document.addEventListener("DOMContentLoaded", () => {
    // Khôi phục state trước khi load tracks
    restorePlayerState();
    loadTracks();
    setupPlayerEvents();
});

// Auto-save state mỗi 5 giây
setInterval(savePlayerState, 5000);