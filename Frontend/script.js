// Base URL to dynamically adjust for deployment
const BASE_URL = `${window.location.origin}`;

function loginUser() {
    var username = document.getElementById('loginUsername').value;
    var password = document.getElementById('loginPassword').value;

    fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, password: password }),
        credentials: 'include' // Include cookies for session persistence
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.user_type === 'creator') {
            document.getElementById('videoUploadForm').style.display = 'block';
        } else {
            document.getElementById('videoList').style.display = 'block';
            loadVideos();
        }
        document.getElementById('authForms').style.display = 'none';
        document.getElementById('logoutButton').style.display = 'block'; // Show logout button
    })
    .catch(error => console.error('Error:', error));
}

function registerUser() {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var userType = document.getElementById('userType').value;

    fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, password: password, type: userType }),
        credentials: 'include' // Include cookies for session persistence
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => console.error('Error:', error));
}

function uploadVideo() {
    var title = document.getElementById('title').value;
    var description = document.getElementById('description').value;
    var videoFile = document.getElementById('videoFile').files[0];

    var formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('video', videoFile);

    fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include cookies for session persistence
    })
    .then(response => {
        if (response.status === 403) {
            return response.json().then(data => { throw new Error(data.message); });
        }
        return response.json();
    })
    .then(data => alert(data.message))
    .catch(error => alert(error.message));
}

function loadVideos() {
    fetch(`${BASE_URL}/videos`, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(videos => {
        const container = document.getElementById('videosContainer');
        container.innerHTML = ''; // Clear existing videos

        videos.forEach(video => {
            const videoElem = document.createElement('div');
            videoElem.classList.add('video-item');
            videoElem.innerHTML = `
                <h3>${video.title}</h3>
                <p>${video.description}</p>
                <video width="320" height="240" controls>
                    <source src="${BASE_URL}${video.filepath}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div id="commentsContainer-${video.id}" class="comments-container"></div>
                <textarea id="commentInput-${video.id}" placeholder="Add a comment..."></textarea>
                <select id="ratingInput-${video.id}">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5" selected>5</option>
                </select>
                <button onclick="addComment(${video.id})">Add Comment</button>
            `;
            container.appendChild(videoElem);

            // Load comments for this video
            loadComments(video.id);
        });
    })
    .catch(error => console.error('Error loading videos:', error));
}

function loadComments(videoId) {
    fetch(`${BASE_URL}/videos/${videoId}/comments`, {
        credentials: 'include' // Include cookies for session persistence
    })
    .then(response => response.json())
    .then(comments => {
        const commentsContainer = document.getElementById(`commentsContainer-${videoId}`);
        commentsContainer.innerHTML = ''; // Clear any existing comments

        if (comments.length === 0) {
            commentsContainer.innerHTML = '<p>No comments yet.</p>';
        } else {
            comments.forEach(comment => {
                const commentElem = document.createElement('div');
                commentElem.classList.add('comment');
                commentElem.innerHTML = `
                    <p><strong>User ${comment.user_id}:</strong> ${comment.content}</p>
                    <p>Rating: ${comment.rating}/5</p>
                `;
                commentsContainer.appendChild(commentElem);
            });
        }
    })
    .catch(error => console.error('Error loading comments:', error));
}

function addComment(videoId) {
    const content = document.getElementById(`commentInput-${videoId}`).value;
    const rating = document.getElementById(`ratingInput-${videoId}`).value;

    fetch(`${BASE_URL}/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: content, rating: rating }),
        credentials: 'include'
    })
    .then(response => {
        if (response.ok) {
            alert('Comment added successfully!');
            loadComments(videoId);
        } else {
            response.json().then(data => alert(data.message));
        }
    })
    .catch(error => console.error('Error adding comment:', error));
}

function logoutUser() {
    fetch(`${BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include' // Include cookies for session persistence
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Show logout success message
        document.getElementById('authForms').style.display = 'block'; // Show login/register forms
        document.getElementById('videoUploadForm').style.display = 'none'; // Hide video upload form
        document.getElementById('videoList').style.display = 'none'; // Hide video list
    })
    .catch(error => console.error('Error:', error));
}
