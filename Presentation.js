document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.getElementById('chatContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const fileLabel = document.querySelector('.file-label');
    const fileInput = document.getElementById('fileInput');
    const currentFeatureTitle = document.querySelector('.current-feature h2');
    const currentFeatureIcon = document.querySelector('.current-feature i');
    const featureCards = document.querySelectorAll('.feature-card');

    // 调整输入框高度
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.scrollHeight > 150) {
            this.style.overflowY = 'scroll';
        } else {
            this.style.overflowY = 'hidden';
        }
    });

    // 发送消息
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (message === '') return;

        addMessage(message, 'user');
        messageInput.value = '';
        messageInput.style.height = '60px';

        // 显示AI正在输入
        const typingElement = document.createElement('div');
        typingElement.className = 'message ai-message';
        typingElement.innerHTML = `
            <div class="ai-header">
                <img src="tes.png" class="custom-icon">
                <h3>AI助手小陀螺</h3>
            </div>
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        chatContainer.appendChild(typingElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // 调用后端
        try {
            const res = await fetch('http://localhost:3001/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userMessage: message })
            });
            const data = await res.json();
            chatContainer.removeChild(typingElement);
            addMessage(data.reply, 'ai');
        } catch (err) {
            chatContainer.removeChild(typingElement);
            addMessage('AI服务异常，请稍后重试。', 'ai');
        }
    }

    // 添加消息到聊天界面
    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;

        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' +
                          now.getMinutes().toString().padStart(2, '0');

        if (sender === 'ai') {
            messageElement.innerHTML = `
                <div class="ai-header">
                    <img src="tes.png" class="custom-icon">
                    <h3>AI助手小陀螺</h3>
                </div>
                <p>${text}</p>
                <div class="message-time">${timeString}</div>
            `;
        } else {
            messageElement.innerHTML = `
                <p>${text}</p>
                <div class="message-time">${timeString}</div>
            `;
        }

        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // 事件监听
    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 切换模型并更新界面
    async function changeModel(model, featureName, iconClass) {
        await fetch('http://localhost:3001/api/model_change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model })
        });
        // 只在模式1显示文件上传
        if (model === "1") {
            fileLabel.style.display = '';
        } else {
            fileLabel.style.display = 'none';
        }
        // 清空聊天容器并添加欢迎消息
        chatContainer.innerHTML = '';
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'message ai-message';
        welcomeMessage.innerHTML = `
            <div class="ai-header">
                <img src="tes.png" class="custom-icon">
                <h3>AI助手小陀螺</h3>
            </div>
            <p>您好！现在是${featureName}模式，有什么可以帮您的吗？</p>
            <div class="message-time">刚刚</div>
        `;
        chatContainer.appendChild(welcomeMessage);
    }

    // 侧边栏功能卡片点击事件
    featureCards.forEach(card => {
        card.addEventListener('click', function() {
            featureCards.forEach(c => c.classList.remove('active-feature'));
            this.classList.add('active-feature');

            const featureName = this.getAttribute('data-feature');
            const iconClass = this.getAttribute('data-icon');
            const model = this.getAttribute('data-model');
            currentFeatureTitle.textContent = featureName;
            currentFeatureIcon.className = `fas ${iconClass}`;
            changeModel(model, featureName, iconClass);
        });
    });

    // 页面加载时只在模式1显示
    fileLabel.style.display = '';

    // 文件选择事件
    fileInput.addEventListener('change', async function() {
        const file = fileInput.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);

        // 显示用户上传
        addMessage(`已上传文件：${file.name}`, 'user');

        try {
            const res = await fetch('http://localhost:3001/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.error) {
                addMessage(data.error, 'ai');
            } else {
                addMessage(data.message, 'ai');
            }
        } catch (err) {
            addMessage('文件上传失败，请稍后重试。', 'ai');
        }
    });
});