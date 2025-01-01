function loginUser() {
    var username = document.getElementById('loginUsername').value;
    var password = document.getElementById('loginPassword').value;

    fetch('http://127.0.0.1:5000/login', {
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

    fetch('http://127.0.0.1:5000/register', {
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

    fetch('http://127.0.0.1:5000/upload', {
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
    fetch('http://127.0.0.1:5000/videos', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(videos => {
        const container = document.getElementById('videosContainer');
        container.innerHTML = ''; // Clear existing videos
        videos.forEach(video => {
            const videoElem = document.createElement('div');
            videoElem.innerHTML = `
                <h3>${video.title}</h3>
                <p>${video.description}</p>
                <video width="320" height="240" controls>
                    <source src="http://127.0.0.1:5000${video.filepath}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
            container.appendChild(videoElem);
        });
    })
    .catch(error => console.error('Error:', error));
}

function logoutUser() {
    fetch('http://127.0.0.1:5000/logout', {
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

