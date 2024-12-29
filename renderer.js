// renderer.js

const repoList = document.getElementById('repo-list');
let selectedRepo = null;
const loadingDiv = document.getElementById('loading');

// Highlight selected repo
repoList.addEventListener('click', (event) => {
    const li = event.target;
    if (li.tagName.toLowerCase() === 'li') {
        // Clear previous selection
        Array.from(repoList.children).forEach((child) => {
            child.style.backgroundColor = '';
        });
        // Highlight new selection
        li.style.backgroundColor = '#ddd';
        selectedRepo = li.dataset.repo;
    }
});

document.getElementById('start-btn').addEventListener('click', async () => {
    if (!selectedRepo) {
        alert('Please select a repository first!');
        return;
    }

    console.log('Starting container with repo:', selectedRepo);
    loadingDiv.style.display = 'block';
    console.log('oh loadingDiv OPENED 2');
    const result = await window.electronAPI.startContainer(selectedRepo);

    if (result.success) {
        alert(result.message);
        document.getElementById('repo-picker').style.display = 'none';
        showCodeServerUI();
        loadingDiv.style.display = 'none';
    } else {
        alert('Error: ' + result.message);
    }
});

const showCodeServerUI = (url = 'http://127.0.0.1:8080') => {
    const iframeContainerDiv = document.getElementById('code-server-iframe-container');
    const iframe = document.createElement('iframe');
    iframe.classList.add('code-server-iframe');
    iframe.src = url;
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    iframeContainerDiv.appendChild(iframe);
}

// Listen for message to show code-server UI
window.electronAPI.showCodeServerUI((url) => {
    const iframe = document.querySelector('.code-server-iframe');
    if (iframe) {
        loadingDiv.style.display = 'block';
        console.log('oh loadingDiv OPENED 2');
        setTimeout(() => {
            iframe.src = url;
            console.log('oh jeez url set', url);
            loadingDiv.style.display = 'none';
            console.log('oh loadingDiv CLOSED 2');
        }, 5000);
    } else {
        showCodeServerUI(url);
    }
});
