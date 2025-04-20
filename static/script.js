document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const clearChatButton = document.getElementById('clear-chat');
    const downloadChatButton = document.getElementById('download-chat');
    const emojiTrigger = document.getElementById('emoji-trigger');
    const typingStatus = document.getElementById('typing-status');
    const screenReaderStatus = document.getElementById('screen-reader-status');
    
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        // Reset height if empty
        if (this.value.trim() === '') {
            this.style.height = '';
        }
    });
    
    // Create emoji modal with Bootstrap
    const emojiModal = new bootstrap.Modal(document.getElementById('emoji-modal'), {
        keyboard: true
    });
    
    // Common emojis
    const commonEmojis = [
        '😊', '😃', '😄', '😁', '😆', '😅', '😂', '🙂', '🙃', '😉',
        '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝',
        '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒',
        '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩',
        '🥺', '😢', '😭', '😤', '😠', '😡', '👍', '👎', '👏', '🙌'
    ];
    
    // Populate emoji container
    const emojiContainer = document.querySelector('.emoji-container');
    commonEmojis.forEach(emoji => {
        const emojiItem = document.createElement('div');
        emojiItem.className = 'emoji-item';
        emojiItem.textContent = emoji;
        emojiItem.addEventListener('click', () => {
            messageInput.value += emoji;
            emojiModal.hide();
            messageInput.focus();
        });
        emojiContainer.appendChild(emojiItem);
    });
    
    // Open emoji modal
    emojiTrigger.addEventListener('click', () => {
        emojiModal.show();
    });
    
    // Store chat history in local storage
    function saveChatHistory() {
        const messages = Array.from(chatMessages.querySelectorAll('.message-wrapper')).map(wrapper => {
            const messageElement = wrapper.querySelector('.message');
            const timeElement = wrapper.querySelector('.message-time');
            const isUser = wrapper.classList.contains('user-message-wrapper');
            
            return {
                content: messageElement.innerHTML,
                time: timeElement.textContent,
                isUser: isUser,
                isUrgent: messageElement.classList.contains('urgent-message')
            };
        });
        
        localStorage.setItem('supportChatHistory', JSON.stringify(messages));
    }
    
    // Load chat history from local storage
    function loadChatHistory() {
        const history = localStorage.getItem('supportChatHistory');
        if (history) {
            const messages = JSON.parse(history);
            
            // Clear current messages
            chatMessages.innerHTML = '';
            
            // Add messages from history
            messages.forEach(msg => {
                if (msg.isUser) {
                    addUserMessage(msg.content, msg.time, true);
                } else {
                    addBotMessage(msg.content, msg.isUrgent, msg.time, true);
                }
            });
            
            scrollToBottom();
        } else {
            // Add welcome message if no history
            addBotMessage("Hello! I'm here to chat with you. How are you feeling today?");
        }
    }
    
    // Clear chat history
    clearChatButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            localStorage.removeItem('supportChatHistory');
            chatMessages.innerHTML = '';
            addBotMessage("Hello! I'm here to chat with you. How are you feeling today?");
        }
    });
    
    // Download chat history as text file
    downloadChatButton.addEventListener('click', function() {
        let historyText = "Support Chat History\n";
        historyText += "===================\n\n";
        
        const messages = chatMessages.querySelectorAll('.message-wrapper');
        
        messages.forEach(wrapper => {
            const sender = wrapper.classList.contains('user-message-wrapper') ? 'You' : 'Support';
            const messageElement = wrapper.querySelector('.message');
            const timeElement = wrapper.querySelector('.message-time');
            
            // Extract just the text content to avoid HTML tags
            const messageText = messageElement.textContent.trim();
            const messageTime = timeElement.textContent;
            
            historyText += `${sender} (${messageTime}):\n${messageText}\n\n`;
        });
        
        // Create and trigger download
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(historyText));
        element.setAttribute('download', 'support-chat-history.txt');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    });
    
    // Send message when button is clicked
    sendButton.addEventListener('click', sendMessage);
    
    // Send message when Enter key is pressed (but allow Shift+Enter for new line)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            // Add user message to chat
            addUserMessage(message);
            
            // Clear input and reset height
            messageInput.value = '';
            messageInput.style.height = '';
            messageInput.focus();
            
            // Show typing indicator
            showTypingIndicator();
            updateTypingStatus('Support is typing...');
            
            // Send message to API
            fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            })
            .then(response => response.json())
            .then(data => {
                // Remove typing indicator
                removeTypingIndicator();
                updateTypingStatus('');
                
                // Add bot response to chat
                const isPotentialSuicide = data.message_type === "Potential Suicide Post";
                addBotMessage(data.response, isPotentialSuicide);
                
                // Announce to screen readers
                updateScreenReaderStatus("New message from support: " + 
                    data.response.replace(/<[^>]*>?/gm, ''));
            })
            .catch(error => {
                // Remove typing indicator
                removeTypingIndicator();
                updateTypingStatus('');
                
                // Add error message
                addBotMessage("I'm sorry, I couldn't process your message. Please try again.");
                console.error('Error:', error);
            });
        }
    }

    function addUserMessage(message, time = null, fromHistory = false) {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper user-message-wrapper';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        
        // Process text or use HTML content if from history
        if (fromHistory) {
            messageElement.innerHTML = message;
        } else {
            // Escape HTML and process links
            const safeMessage = message
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                // Process URLs into links
                .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
            
            messageElement.innerHTML = safeMessage;
        }
        
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = time || getCurrentTime();
        
        contentDiv.appendChild(messageElement);
        contentDiv.appendChild(timeElement);
        
        wrapper.appendChild(contentDiv);
        chatMessages.appendChild(wrapper);
        
        // Save to local storage if not loading from history
        if (!fromHistory) {
            saveChatHistory();
            updateScreenReaderStatus("Message sent: " + message);
        }
        
        scrollToBottom();
    }

    function addBotMessage(message, isUrgent = false, time = null, fromHistory = false) {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper bot-message-wrapper';
        
        // Add avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar-container';
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar support-avatar';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-headset';
        
        avatar.appendChild(icon);
        avatarDiv.appendChild(avatar);
        
        const statusIndicator = document.createElement('span');
        statusIndicator.className = 'status-indicator online';
        avatarDiv.appendChild(statusIndicator);
        
        wrapper.appendChild(avatarDiv);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        
        if (isUrgent) {
            messageElement.classList.add('urgent-message');
        }
        
        // Use provided HTML or process markdown-style links
        if (fromHistory) {
            messageElement.innerHTML = message;
        } else {
            // Process markdown-style links and line breaks
            const processedMessage = message
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
                .replace(/\n/g, '<br>');
            
            messageElement.innerHTML = processedMessage;
        }
        
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = time || getCurrentTime();
        
        contentDiv.appendChild(messageElement);
        contentDiv.appendChild(timeElement);
        
        wrapper.appendChild(contentDiv);
        chatMessages.appendChild(wrapper);
        
        // Save to local storage if not loading from history
        if (!fromHistory) {
            saveChatHistory();
        }
        
        scrollToBottom();
    }

    function showTypingIndicator() {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper bot-message-wrapper';
        wrapper.id = 'typing-wrapper';
        
        // Add avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar-container';
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar support-avatar';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-headset';
        
        avatar.appendChild(icon);
        avatarDiv.appendChild(avatar);
        
        const statusIndicator = document.createElement('span');
        statusIndicator.className = 'status-indicator online';
        avatarDiv.appendChild(statusIndicator);
        
        wrapper.appendChild(avatarDiv);
        
        const typingElement = document.createElement('div');
        typingElement.className = 'typing-indicator';
        typingElement.id = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            typingElement.appendChild(dot);
        }
        
        wrapper.appendChild(typingElement);
        chatMessages.appendChild(wrapper);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const typingWrapper = document.getElementById('typing-wrapper');
        if (typingWrapper) {
            typingWrapper.remove();
        }
    }

    function updateTypingStatus(text) {
        typingStatus.textContent = text;
    }

    function updateScreenReaderStatus(text) {
        screenReaderStatus.textContent = text;
        setTimeout(() => {
            screenReaderStatus.textContent = '';
        }, 5000);
    }

    function getCurrentTime() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        return `${hours}:${minutes} ${ampm}`;
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to check if chat history should be grouped by date
    function groupChatByDate() {
        // Implementation can be added if date grouping is needed
    }
    
    // Initialize the chat
    loadChatHistory();
});