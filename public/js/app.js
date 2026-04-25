class OneNoteAccounting {
    constructor() {
        this.records = [];
        this.currentAnalysis = null;
        this.recognition = null;
        
        this.initElements();
        this.initEventListeners();
        this.loadRecords();
        this.initSpeechRecognition();
    }

    initElements() {
        this.inputText = document.getElementById('inputText');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.analysisSection = document.getElementById('analysisSection');
        this.saveBtn = document.getElementById('saveBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.recordsList = document.getElementById('recordsList');
        this.totalExpense = document.getElementById('totalExpense');
        this.totalIncome = document.getElementById('totalIncome');
        this.voiceModal = document.getElementById('voiceModal');
        this.stopVoiceBtn = document.getElementById('stopVoiceBtn');
        this.toast = document.getElementById('toast');
        
        this.originalText = document.getElementById('originalText');
        this.recordType = document.getElementById('recordType');
        this.recordTime = document.getElementById('recordTime');
        this.recordLocation = document.getElementById('recordLocation');
        this.recordItem = document.getElementById('recordItem');
        this.recordAmount = document.getElementById('recordAmount');
        this.locationInput = document.getElementById('locationInput');
        this.itemInput = document.getElementById('itemInput');
        this.amountInput = document.getElementById('amountInput');
        this.categorySelect = document.getElementById('categorySelect');
        this.missingFields = document.getElementById('missingFields');
        this.missingList = document.getElementById('missingList');
    }

    initEventListeners() {
        this.analyzeBtn.addEventListener('click', () => this.analyzeText());
        this.voiceBtn.addEventListener('click', () => this.startVoiceInput());
        this.stopVoiceBtn.addEventListener('click', () => this.stopVoiceInput());
        this.saveBtn.addEventListener('click', () => this.saveRecord());
        this.cancelBtn.addEventListener('click', () => this.cancelAnalysis());
        
        this.locationInput.addEventListener('input', () => this.onFieldChange('location'));
        this.itemInput.addEventListener('input', () => this.onFieldChange('item'));
        this.amountInput.addEventListener('input', () => this.onFieldChange('amount'));
        
        this.inputText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.analyzeText();
            }
        });
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'zh-CN';
            
            this.recognition.onstart = () => {
                this.showVoiceModal();
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.inputText.value = transcript;
                this.hideVoiceModal();
                this.showToast('语音识别成功！');
            };
            
            this.recognition.onerror = (event) => {
                console.error('语音识别错误:', event.error);
                this.hideVoiceModal();
                this.showToast('语音识别失败，请重试', 'error');
            };
            
            this.recognition.onend = () => {
                this.hideVoiceModal();
            };
        } else {
            this.voiceBtn.disabled = true;
            this.voiceBtn.style.opacity = '0.5';
            this.voiceBtn.title = '您的浏览器不支持语音识别';
        }
    }

    startVoiceInput() {
        if (!this.recognition) {
            this.showToast('您的浏览器不支持语音识别', 'error');
            return;
        }
        
        try {
            this.recognition.start();
        } catch (e) {
            console.error('启动语音识别失败:', e);
            this.showToast('启动语音识别失败，请重试', 'error');
        }
    }

    stopVoiceInput() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.hideVoiceModal();
    }

    showVoiceModal() {
        this.voiceModal.classList.remove('hidden');
    }

    hideVoiceModal() {
        this.voiceModal.classList.add('hidden');
    }

    async analyzeText() {
        const text = this.inputText.value.trim();
        
        if (!text) {
            this.showToast('请输入一句话', 'error');
            return;
        }

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            const result = await response.json();

            if (result.success) {
                this.currentAnalysis = result.data;
                this.displayAnalysis(result.data);
                this.analysisSection.classList.remove('hidden');
            } else {
                this.showToast(result.message || '分析失败', 'error');
            }
        } catch (error) {
            console.error('分析失败:', error);
            this.showToast('网络错误，请重试', 'error');
        }
    }

    displayAnalysis(data) {
        this.originalText.textContent = data.originalText;
        this.recordType.textContent = data.type === '收入' ? '收入' : '支出';
        this.recordType.className = `field-value ${data.type === '收入' ? 'income' : 'expense'}`;
        
        const time = new Date(data.time);
        this.recordTime.textContent = this.formatDateTime(time);
        
        this.recordLocation.textContent = data.location || '未检测到';
        this.recordLocation.className = `field-value ${!data.location ? 'missing' : ''}`;
        
        this.recordItem.textContent = data.item || '未检测到';
        this.recordItem.className = `field-value ${!data.item ? 'missing' : ''}`;
        
        if (data.amount !== null) {
            this.recordAmount.textContent = `¥${data.amount.toFixed(2)}`;
            this.recordAmount.className = 'field-value';
        } else {
            this.recordAmount.textContent = '未检测到';
            this.recordAmount.className = 'field-value missing';
        }
        
        this.categorySelect.value = data.category;
        
        if (!data.location) {
            this.locationInput.classList.remove('hidden');
            this.recordLocation.classList.add('hidden');
        } else {
            this.locationInput.classList.add('hidden');
            this.recordLocation.classList.remove('hidden');
        }
        
        if (!data.item) {
            this.itemInput.classList.remove('hidden');
            this.recordItem.classList.add('hidden');
        } else {
            this.itemInput.classList.add('hidden');
            this.recordItem.classList.remove('hidden');
        }
        
        if (data.amount === null) {
            this.amountInput.classList.remove('hidden');
            this.recordAmount.classList.add('hidden');
        } else {
            this.amountInput.classList.add('hidden');
            this.recordAmount.classList.remove('hidden');
        }
        
        this.updateMissingFields(data);
    }

    updateMissingFields(data) {
        const missing = [];
        
        if (!data.location) missing.push('地点');
        if (!data.item) missing.push('物品');
        if (data.amount === null) missing.push('金额');
        
        if (missing.length > 0) {
            this.missingFields.classList.remove('hidden');
            this.missingList.innerHTML = missing.map(item => 
                `<li>${item}</li>`
            ).join('');
        } else {
            this.missingFields.classList.add('hidden');
        }
    }

    onFieldChange(field) {
        if (!this.currentAnalysis) return;
        
        if (field === 'location') {
            if (this.locationInput.value.trim()) {
                this.locationInput.classList.add('hidden');
                this.recordLocation.classList.remove('hidden');
                this.recordLocation.textContent = this.locationInput.value.trim();
                this.currentAnalysis.location = this.locationInput.value.trim();
            }
        } else if (field === 'item') {
            if (this.itemInput.value.trim()) {
                this.itemInput.classList.add('hidden');
                this.recordItem.classList.remove('hidden');
                this.recordItem.textContent = this.itemInput.value.trim();
                this.currentAnalysis.item = this.itemInput.value.trim();
            }
        } else if (field === 'amount') {
            const amount = parseFloat(this.amountInput.value);
            if (!isNaN(amount) && amount > 0) {
                this.amountInput.classList.add('hidden');
                this.recordAmount.classList.remove('hidden');
                this.recordAmount.textContent = `¥${amount.toFixed(2)}`;
                this.currentAnalysis.amount = amount;
            }
        }
        
        this.updateMissingFields(this.currentAnalysis);
    }

    async saveRecord() {
        if (!this.currentAnalysis) {
            this.showToast('没有可保存的记录', 'error');
            return;
        }
        
        const location = this.locationInput.value.trim() || this.currentAnalysis.location;
        const item = this.itemInput.value.trim() || this.currentAnalysis.item;
        const amountStr = this.amountInput.value;
        const amount = amountStr ? parseFloat(amountStr) : this.currentAnalysis.amount;
        
        const record = {
            text: this.currentAnalysis.originalText,
            time: this.currentAnalysis.time,
            location: location,
            item: item,
            amount: amount,
            category: this.categorySelect.value,
            type: this.currentAnalysis.type
        };

        try {
            const response = await fetch('/api/records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(record)
            });

            const result = await response.json();

            if (result.success) {
                this.records.unshift(result.data);
                this.renderRecords();
                this.updateStats();
                this.cancelAnalysis();
                this.inputText.value = '';
                this.showToast('记录保存成功！');
            } else {
                this.showToast(result.message || '保存失败', 'error');
            }
        } catch (error) {
            console.error('保存失败:', error);
            this.showToast('网络错误，请重试', 'error');
        }
    }

    cancelAnalysis() {
        this.analysisSection.classList.add('hidden');
        this.currentAnalysis = null;
        this.locationInput.value = '';
        this.itemInput.value = '';
        this.amountInput.value = '';
    }

    async loadRecords() {
        try {
            const response = await fetch('/api/records');
            const result = await response.json();
            
            if (result.success) {
                this.records = result.data;
                this.renderRecords();
                this.updateStats();
            }
        } catch (error) {
            console.error('加载记录失败:', error);
        }
    }

    async deleteRecord(id) {
        if (!confirm('确定要删除这条记录吗？')) {
            return;
        }

        try {
            const response = await fetch(`/api/records/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.records = this.records.filter(r => r.id !== id);
                this.renderRecords();
                this.updateStats();
                this.showToast('记录已删除');
            } else {
                this.showToast(result.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除失败:', error);
            this.showToast('网络错误，请重试', 'error');
        }
    }

    renderRecords() {
        if (this.records.length === 0) {
            this.recordsList.innerHTML = `
                <div class="empty-state">
                    <p>暂无记账记录</p>
                    <p class="hint">试试输入一句话开始记账吧！</p>
                </div>
            `;
            return;
        }

        this.recordsList.innerHTML = this.records.map(record => `
            <div class="record-item">
                <div class="record-info">
                    <div class="record-header">
                        <span class="record-type ${record.type === '收入' ? 'income' : 'expense'}">
                            ${record.type}
                        </span>
                        <span class="record-category">${record.category}</span>
                    </div>
                    <div class="record-item-text">${record.text}</div>
                    <div class="record-details">
                        ${record.item ? `<span class="record-detail">📦 ${record.item}</span>` : ''}
                        ${record.location ? `<span class="record-detail">📍 ${record.location}</span>` : ''}
                        <span class="record-detail">🕐 ${this.formatDateTime(new Date(record.time))}</span>
                    </div>
                </div>
                <div class="record-amount ${record.type === '收入' ? 'income' : 'expense'}">
                    ${record.type === '收入' ? '+' : '-'}${record.amount !== null ? `¥${record.amount.toFixed(2)}` : '未填'}
                </div>
                <div class="record-actions">
                    <button class="btn btn-danger" onclick="app.deleteRecord(${record.id})">删除</button>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        let expense = 0;
        let income = 0;

        this.records.forEach(record => {
            if (record.amount !== null) {
                if (record.type === '收入') {
                    income += record.amount;
                } else {
                    expense += record.amount;
                }
            }
        });

        this.totalExpense.textContent = `¥${expense.toFixed(2)}`;
        this.totalIncome.textContent = `¥${income.toFixed(2)}`;
    }

    formatDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const recordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return `今天 ${hours}:${minutes}`;
        } else if (diffDays === 1) {
            return `昨天 ${hours}:${minutes}`;
        } else if (diffDays === 2) {
            return `前天 ${hours}:${minutes}`;
        } else if (diffDays < 7) {
            return `${diffDays}天前 ${hours}:${minutes}`;
        } else {
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        }
    }

    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.style.background = type === 'error' ? '#dc3545' : '#28a745';
        this.toast.classList.remove('hidden');
        
        setTimeout(() => {
            this.toast.classList.add('hidden');
        }, 3000);
    }
}

const app = new OneNoteAccounting();
