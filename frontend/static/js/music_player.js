let currentPlaylist = null;
let currentTrackIndex = 0;
let isPlaying = false;
let audioPlayer = new Audio();
let progressInterval = null;
let spotifyConnected = false;

document.addEventListener('DOMContentLoaded', function() {
    loadPlaylists();
    loadFavorites();
    setupEventListeners();
    checkSpotifyConnection();
});

function checkSpotifyConnection() {
    // Check URL parameters for Spotify connection status
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('spotify_connected') === 'true') {
        showNotification('Spotify connected successfully!', 'success');
    }
    if (urlParams.get('error') === 'auth_failed') {
        showNotification('Failed to connect with Spotify', 'error');
    }
}

function showLoadingState() {
    const container = document.getElementById('playlists-grid');
    container.innerHTML = `
        <div class="loading-playlists">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading playlists...</p>
        </div>
    `;
}

function showErrorState(message) {
    const container = document.getElementById('playlists-grid');
    container.innerHTML = `
        <div class="no-music">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="loadPlaylists()">Retry</button>
        </div>
    `;
}

async function loadPlaylists() {
    try {
        const response = await fetch('/music/api/playlists/');
        const data = await response.json();
        
        if (data.spotify_connected) {
            spotifyConnected = true;
            document.getElementById('favorites-section').style.display = 'block';
        }
        
        renderPlaylists(data.playlists);
        renderSpotifyConnectButton();
    } catch (error) {
        console.error('Error loading playlists:', error);
        renderPlaylists([]);
    }
}

async function loadFavorites() {
    try {
        const response = await fetch('/music/api/favorites/');
        const data = await response.json();

        const container = document.getElementById('favorites-grid');

        if (data.favorites.length === 0) {
            container.innerHTML = `
                <p class="no-music">You have no favorite playlists yet.</p>
            `;
            return;
        }

        container.innerHTML = data.favorites.map(pl => {
            const durationMinutes = Math.floor(pl.duration / 60);
            return `
                <div class="playlist-card" onclick="selectPlaylist('${pl.id}', false)">
                    <div class="playlist-header">
                        <div class="playlist-cover" style="background: ${pl.cover_color}">
                            <i class="fas fa-headphones"></i>
                        </div>
                        <div class="playlist-info">
                            <div class="playlist-name">${pl.name}</div>
                            <div class="playlist-type">${getMusicTypeDisplay(pl.type)}</div>
                        </div>
                    </div>
                    <div class="playlist-description">${pl.description}</div>
                    <div class="playlist-stats">
                        <div class="playlist-duration">
                            <i class="fas fa-clock"></i>
                            ${durationMinutes} min
                        </div>
                        <div class="track-count">
                            <i class="fas fa-music"></i>
                            ${pl.track_count} tracks
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error("Error loading favorites:", error);
    }
}


function renderSpotifyConnectButton() {
    const container = document.getElementById('playlists-grid');
    if (!spotifyConnected) {
        const connectCard = `
            <div class="playlist-card" onclick="connectSpotify()">
                <div class="playlist-header">
                    <div class="playlist-cover" style="background: #1DB954">
                        <i class="fab fa-spotify"></i>
                    </div>
                    <div class="playlist-info">
                        <div class="playlist-name">Connect Spotify</div>
                        <div class="playlist-type">Access your personal playlists</div>
                    </div>
                </div>
                <div class="playlist-description">
                    Connect your Spotify account to access your personal playlists and get better recommendations
                </div>
                <div class="playlist-stats">
                    <div class="playlist-duration">
                        <i class="fas fa-plus"></i>
                        Connect Now
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('afterbegin', connectCard);
    }
}

function renderPlaylists(playlists) {
    const container = document.getElementById('playlists-grid');
    
    if (playlists.length === 0) {
        container.innerHTML = `
            <div class="no-music">
                <i class="fas fa-music"></i>
                <p>No music playlists available.</p>
                ${!spotifyConnected ? '<button class="btn btn-primary" onclick="connectSpotify()">Connect Spotify to get started</button>' : ''}
            </div>
        `;
        return;
    }
    
    container.innerHTML = playlists.map(playlist => {
        const durationMinutes = Math.floor(playlist.duration / 60);
        const trackCount = playlist.track_count || playlist.tracks.length;
        const isSpotifyPlaylist = playlist.is_spotify;
        const coverStyle = playlist.cover_url ? 
            `background: url('${playlist.cover_url}') center/cover;` : 
            `background: ${playlist.cover_color};`;
        
        return `
            <div class="playlist-card" onclick="selectPlaylist('${playlist.id}', ${isSpotifyPlaylist})">
                <div class="playlist-header">
                    <div class="playlist-cover" style="${coverStyle}">
                        ${!playlist.cover_url ? '<i class="fas fa-headphones"></i>' : ''}
                        ${isSpotifyPlaylist ? '<i class="fab fa-spotify"></i>' : ''}
                    </div>
                    <div class="playlist-info">
                        <div class="playlist-name">${playlist.name}</div>
                        <div class="playlist-type">${getMusicTypeDisplay(playlist.type)}</div>
                    </div>
                    ${!isSpotifyPlaylist ? `
                    <button class="favorite-btn" onclick="event.stopPropagation(); toggleFavorite(${playlist.id})">
                        <i class="far fa-heart"></i>
                    </button>
                    ` : ''}
                </div>
                <div class="playlist-description">${playlist.description}</div>
                <div class="playlist-stats">
                    <div class="playlist-duration">
                        <i class="fas fa-clock"></i>
                        ${durationMinutes} min
                    </div>
                    <div class="track-count">
                        <i class="fas fa-music"></i>
                        ${trackCount} tracks
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function selectPlaylist(playlistId, isSpotifyPlaylist = false) {
    try {
        let playlistData;
        
        if (isSpotifyPlaylist) {
            // Load tracks from Spotify playlist
            const spotifyId = playlistId.replace('spotify_', '');
            const response = await fetch(`/music/api/spotify-playlist/${spotifyId}/tracks/`);
            const data = await response.json();
            
            playlistData = {
                id: playlistId,
                name: `Spotify Playlist`,
                type: 'spotify',
                cover_color: '#1DB954',
                tracks: data.tracks
            };
        } else {
            // Find in loaded playlists
            const response = await fetch('/music/api/playlists/');
            const data = await response.json();
            playlistData = data.playlists.find(p => p.id == playlistId);
        }
        
        if (!playlistData) return;
        
        currentPlaylist = playlistData;
        currentTrackIndex = 0;
        
        // Show now playing section
        document.getElementById('now-playing').style.display = 'block';
        updateNowPlayingUI();
        
        // Load and play first track
        loadTrack(currentTrackIndex);
        playCurrentTrack();
        
    } catch (error) {
        console.error('Error selecting playlist:', error);
        showNotification('Error loading playlist', 'error');
    }
}

function loadTrack(trackIndex) {
    if (!currentPlaylist || !currentPlaylist.tracks[trackIndex]) return;
    
    const track = currentPlaylist.tracks[trackIndex];
    
    if (track.audio_url) {
        audioPlayer.src = track.audio_url;
        audioPlayer.load();
        
        // Update track info
        document.getElementById('current-track').textContent = track.title;
        document.getElementById('current-artist').textContent = track.artist;
        document.getElementById('current-playlist').textContent = currentPlaylist.name;
        
        // Update cover
        const coverElement = document.getElementById('current-cover');
        if (track.cover_url) {
            coverElement.style.background = `url('${track.cover_url}') center/cover`;
            coverElement.innerHTML = '';
        } else {
            coverElement.style.background = currentPlaylist.cover_color;
            coverElement.innerHTML = '<i class="fas fa-music"></i>';
        }
    } else {
        showNotification('No preview available for this track', 'warning');
        playNextTrack();
    }
}

// Các hàm khác giữ nguyên (playCurrentTrack, togglePlayPause, etc.)
// Chỉ cần đảm bảo xử lý lỗi khi play

function playCurrentTrack() {
    if (!audioPlayer.src) {
        playNextTrack();
        return;
    }
    
    audioPlayer.play()
        .then(() => {
            isPlaying = true;
            updatePlayButton();
            startProgressTimer();
        })
        .catch(error => {
            console.error('Error playing audio:', error);
            showNotification('Cannot play this track. Trying next track...', 'warning');
            playNextTrack();
        });
}

function connectSpotify() {
    window.location.href = '/music/connect-spotify/';
}

async function toggleFavorite(playlistId, event) {
    const btn = event.target.closest('.favorite-btn');
    const icon = btn.querySelector('i');
    
    try {
        const response = await fetch(`/music/api/favorite/${playlistId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'added') {
            icon.className = 'fas fa-heart';
            btn.classList.add('active');
            showNotification('Added to favorites', 'success');
        } else {
            icon.className = 'far fa-heart';
            btn.classList.remove('active');
            showNotification('Removed from favorites', 'info');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showNotification('Error updating favorites', 'error');
    }
    
    event.stopPropagation();
}

function getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

function showNotification(message, type = 'info') {
    // Simple notification implementation
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        z-index: 1000;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Các hàm utility khác giữ nguyên...
function getMusicTypeDisplay(type) {
    const types = {
        'lofi': 'Lo-Fi Beats',
        'nature': 'Nature Sounds', 
        'classical': 'Classical',
        'ambient': 'Ambient',
        'binaural': 'Binaural Beats',
        'spotify': 'Spotify Playlist'
    };
    return types[type] || type;
}


function setupEventListeners() {
    // Audio player events
    audioPlayer.addEventListener('ended', playNextTrack);
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', updateTotalTime);
    
    // Control buttons
    document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
    document.getElementById('prev-btn').addEventListener('click', playPreviousTrack);
    document.getElementById('next-btn').addEventListener('click', playNextTrack);
    
    // Progress bar click
    document.querySelector('.progress-bar').addEventListener('click', seekAudio);
}

function togglePlayPause() {
    if (!currentPlaylist) return;
    
    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
    } else {
        playCurrentTrack();
    }
    updatePlayButton();
}

function updatePlayButton() {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const icon = playPauseBtn.querySelector('i');
    
    if (isPlaying) {
        icon.className = 'fas fa-pause';
    } else {
        icon.className = 'fas fa-play';
    }
    
    // Enable controls if we have a playlist
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (currentPlaylist) {
        playPauseBtn.disabled = false;
        prevBtn.disabled = currentTrackIndex === 0;
        nextBtn.disabled = currentTrackIndex === currentPlaylist.tracks.length - 1;
    }
}

function playNextTrack() {
    if (!currentPlaylist) return;
    
    if (currentTrackIndex < currentPlaylist.tracks.length - 1) {
        currentTrackIndex++;
        loadTrack(currentTrackIndex);
        playCurrentTrack();
    } else {
        // End of playlist
        isPlaying = false;
        updatePlayButton();
        showNotification('Playlist finished', 'info');
    }
}

function playPreviousTrack() {
    if (!currentPlaylist || currentTrackIndex === 0) return;
    
    currentTrackIndex--;
    loadTrack(currentTrackIndex);
    playCurrentTrack();
}

function startProgressTimer() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    progressInterval = setInterval(updateProgress, 1000);
}

function updateProgress() {
    if (!audioPlayer.duration) return;
    
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    
    // Update time display
    document.getElementById('current-time').textContent = formatTime(audioPlayer.currentTime);
}

function updateTotalTime() {
    document.getElementById('total-time').textContent = formatTime(audioPlayer.duration);
}

function seekAudio(event) {
    if (!audioPlayer.duration) return;
    
    const progressBar = event.currentTarget;
    const clickPosition = event.offsetX;
    const progressBarWidth = progressBar.offsetWidth;
    const seekTime = (clickPosition / progressBarWidth) * audioPlayer.duration;
    
    audioPlayer.currentTime = seekTime;
    updateProgress();
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateNowPlayingUI() {
    if (!currentPlaylist) return;
    
    document.getElementById('current-track').textContent = 'Loading...';
    document.getElementById('current-artist').textContent = '-';
    document.getElementById('current-playlist').textContent = currentPlaylist.name;
}