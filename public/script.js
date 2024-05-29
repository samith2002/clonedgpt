document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const sessionsList = document.getElementById('sessions-list');

    let currentSessionId = null;

    sessionsList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const sessionId = e.target.getAttribute('data-session-id');
            if (sessionId !== currentSessionId) {
                currentSessionId = sessionId;
                // Remove active class from all session items
                document.querySelectorAll('.list-group-item.session-item').forEach(item => {
                    item.classList.remove('active');
                });
                // Add active class to the clicked session item
                e.target.classList.add('active');
                loadMessages(currentSessionId);
            }
        }
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const message = messageInput.value;
        appendMessage('user', message);

        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, sessionId: currentSessionId })
        });

        const data = await response.json();
        appendMessage('assistant', data.response);

        messageInput.value = '';
    });

    async function loadMessages(sessionId) {
        const response = await fetch(`/chat/${sessionId}`);
        const data = await response.json();
        chatBox.innerHTML = '';
        data.messages.forEach(msg => {
            appendMessage(msg.role, msg.content);
        });
    }

    function appendMessage(role, content) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', role,"code-snippet");

        if (role === 'assistant') {
            const gptLogo = document.createElement('img');
            gptLogo.src = 'images/chatgpt.'; // Replace 'path/to/gpt_logo.png' with the actual path to your GPT logo image
            gptLogo.alt = 'GPT Logo';
            gptLogo.style.width = '30px'; // Adjust the width of the logo as needed
            gptLogo.style.height = '30px'; // Adjust the height of the logo as needed
            messageElement.appendChild(gptLogo);
        }
        
    
        
        if (isCodeSnippet(content)) {
            messageElement.classList.add('code-snippet');
            const codeElement = document.createElement('pre');
            codeElement.textContent = content.replace(/```/g, ''); // Remove triple backticks
            messageElement.appendChild(codeElement);
        } else {
            messageElement.textContent = content;
        }

        chatBox.appendChild(messageElement);

        // Scroll to bottom of chat box
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function isCodeSnippet(content) {
        return content.startsWith('```') && content.endsWith('```');
    }
});
