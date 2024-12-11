// 默认设置
const defaultSettings = {
    targetUrl: '',
    authKey: '',
    modelUrl: '',
    apiKey: '',
    modelName: 'gpt-4o-mini',
    temperature: 0.5,
    promptTemplate: `请你根据提供的网页内容，撰写一份结构清晰、重点突出且不遗漏重要内容的摘要。
    
要求：
1. **摘要结构：**  
    *   第一行使用'# 标题'格式取一个简要的大标题。
    *   一句话总结：请提供一个简洁、精炼的概括性语句，准确概括整个网页的核心内容。
    *   按照网页内容的逻辑顺序，依次总结各个主要部分的核心内容。
    
2. **突出重点：**  请识别并突出显示网页中的关键信息、主题、重要论点和结论。如果网页内容包含重要数据或结论，请务必在摘要中体现。
3. **不遗漏重要内容：**  在总结时，请确保覆盖网页的所有重要方面，避免关键信息缺失。
    
请注意：
*   摘要应保持客观中立，避免掺杂个人观点或情感色彩。
*   摘要的语言应简洁明了，避免使用过于专业或晦涩的词汇,并使用中文进行总结。
*   摘要的长度适中，既要全面覆盖重要内容，又要避免冗长啰嗦。
*   总结的末尾无需再进行总结，有一句话总结代替。
以下是网页内容：{content}`,
    includeSummaryUrl: true,    // 总结笔记是否包含URL
    includeSelectionUrl: false, // 划词保存是否包含URL
    includeImageUrl: true,     // 图片保存是否包含URL
    summaryTag: '#网页/总结',   // 网页总结的标签
    selectionTag: '#网页/摘录',      // 划词保存的标签
    imageTag: '#网页/图片',         // 图片保存的标签
    enableFloatingBall: true    // 是否启用悬浮球
};

// 临时存储键
const TEMP_STORAGE_KEY = 'tempSummaryData';
const QUICK_NOTE_KEY = 'quickNoteData';  // 快捷记录的存储键

// 加载设置
async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get('settings');
        let settings = result.settings;
        
        // 如果没有保存的设置，使用默认值
        if (!settings) {
            settings = { ...defaultSettings };
        } else {
            // 确保所有默认设置项都存在
            for (const key in defaultSettings) {
                if (settings[key] === undefined) {
                    settings[key] = defaultSettings[key];
                }
            }
        }

        console.log('加载的设置:', settings);
        
        // 更新UI，确保元素存在
        const elements = {
            'targetUrl': settings.targetUrl || '',
            'authKey': settings.authKey || '',
            'modelUrl': settings.modelUrl || '',
            'apiKey': settings.apiKey || '',
            'modelName': settings.modelName || 'gpt-3.5-turbo',
            'temperature': settings.temperature || '0.7',
            'promptTemplate': settings.promptTemplate || defaultSettings.promptTemplate,
            'includeSummaryUrl': settings.includeSummaryUrl !== false,
            'includeSelectionUrl': settings.includeSelectionUrl !== false,
            'includeImageUrl': settings.includeImageUrl !== false,
            'summaryTag': settings.summaryTag || defaultSettings.summaryTag,
            'selectionTag': settings.selectionTag || defaultSettings.selectionTag,
            'imageTag': settings.imageTag || defaultSettings.imageTag,
            'enableFloatingBall': settings.enableFloatingBall !== false
        };

        // 安全地更新每个元素
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });
        
        return settings;
    } catch (error) {
        console.error('加载设置时出错:', error);
        showStatus('加载设置失败: ' + error.message, 'error');
        return defaultSettings;
    }
}

// 保存设置
async function saveSettings() {
    try {
        const settings = {
            targetUrl: document.getElementById('targetUrl').value.trim(),
            authKey: document.getElementById('authKey').value.trim(),
            modelUrl: document.getElementById('modelUrl').value.trim(),
            apiKey: document.getElementById('apiKey').value.trim(),
            modelName: document.getElementById('modelName').value.trim(),
            temperature: parseFloat(document.getElementById('temperature').value) || 0.7,
            promptTemplate: document.getElementById('promptTemplate').value.trim() || defaultSettings.promptTemplate,
            includeSummaryUrl: document.getElementById('includeSummaryUrl').checked,
            includeSelectionUrl: document.getElementById('includeSelectionUrl').checked,
            includeImageUrl: document.getElementById('includeImageUrl').checked,
            summaryTag: document.getElementById('summaryTag').value.trim(),
            selectionTag: document.getElementById('selectionTag').value.trim(),
            imageTag: document.getElementById('imageTag').value.trim(),
            enableFloatingBall: document.getElementById('enableFloatingBall').checked
        };

        // 保存到chrome.storage
        await chrome.storage.sync.set({ settings });
        
        // 通知所有标签页更新悬浮球状态
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'updateFloatingBallState',
                    enabled: settings.enableFloatingBall
                });
            } catch (error) {
                console.log('Tab not ready:', tab.id);
            }
        }

        console.log('设置已保存:', settings);
        showStatus('设置已保存', 'success');
        return settings;
    } catch (error) {
        console.error('保存设置时出错:', error);
        showStatus('保存设置失败: ' + error.message, 'error');
        throw error;
    }
}

// 重置设置
async function resetSettings() {
    try {
        await chrome.storage.sync.remove('settings');
        const settings = { ...defaultSettings };
        
        // 更新UI
        document.getElementById('targetUrl').value = settings.targetUrl;
        document.getElementById('authKey').value = settings.authKey;
        document.getElementById('modelUrl').value = settings.modelUrl;
        document.getElementById('apiKey').value = settings.apiKey;
        document.getElementById('modelName').value = settings.modelName;
        document.getElementById('temperature').value = settings.temperature;
        document.getElementById('promptTemplate').value = settings.promptTemplate;
        document.getElementById('includeSummaryUrl').checked = settings.includeSummaryUrl;
        document.getElementById('includeSelectionUrl').checked = settings.includeSelectionUrl;
        document.getElementById('summaryTag').value = settings.summaryTag;
        document.getElementById('selectionTag').value = settings.selectionTag;
        document.getElementById('enableFloatingBall').checked = settings.enableFloatingBall;
        
        console.log('设置已重置为默认值:', settings);
        showStatus('设置已重置为默认值', 'success');
    } catch (error) {
        console.error('重置设置时出错:', error);
        showStatus('重置设置失败: ' + error.message, 'error');
    }
}

// 处理标签页切换
function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    const tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// 显示状态信息
function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = type;
    statusDiv.style.display = 'block';
}

// 隐藏状态信息
function hideStatus() {
    const statusDiv = document.getElementById('status');
    statusDiv.style.display = 'none';
}

// 保存临时总结数据
async function saveTempSummaryData(data) {
    try {
        await chrome.storage.local.set({ [TEMP_STORAGE_KEY]: data });
        console.log('临时数据已保存:', data);
    } catch (error) {
        console.error('保存临时数据失败:', error);
    }
}

// 清除临时总结数据
async function clearTempSummaryData() {
    try {
        await chrome.storage.local.remove(TEMP_STORAGE_KEY);
        console.log('临时数据已清除');
    } catch (error) {
        console.error('清除临时数据失败:', error);
    }
}

// 加载临时总结数据
async function loadTempSummaryData() {
    try {
        const result = await chrome.storage.local.get(TEMP_STORAGE_KEY);
        return result[TEMP_STORAGE_KEY];
    } catch (error) {
        console.error('加载临时数据失败:', error);
        return null;
    }
}

// 清空总结预览内容
function clearSummaryPreview() {
    const summaryPreview = document.getElementById('summaryPreview');
    const summaryText = document.getElementById('summaryText');
    const pageTitle = document.getElementById('pageTitle');
    const pageUrl = document.getElementById('pageUrl');

    if (summaryPreview) {
        summaryPreview.style.display = 'none';
    }
    if (summaryText) {
        summaryText.value = '';
    }
    if (pageTitle) {
        pageTitle.textContent = '';
    }
    if (pageUrl) {
        pageUrl.textContent = '';
    }
}

// 显示总结预览
async function showSummaryPreview() {
    const tempData = await loadTempSummaryData();
    if (tempData && tempData.summary) {
        document.getElementById('summaryPreview').style.display = 'block';
        document.getElementById('summaryText').value = tempData.summary;
        if (tempData.title) {
            document.getElementById('pageTitle').textContent = tempData.title;
        }
        if (tempData.url) {
            document.getElementById('pageUrl').textContent = tempData.url;
        }
    }
}

// 处理总结��应
async function handleSummaryResponse(response) {
    if (response.success) {
        const settings = await loadSettings();
        let finalSummary = response.summary;

        // 保存临时数据，不在这里添加标签
        await saveTempSummaryData({
            summary: finalSummary,
            url: response.url,
            title: response.title,
            tag: settings.summaryTag  // 只保存标签信息，不添加到内容中
        });

        // 显示预览
        await showSummaryPreview();
        showStatus('总结生成成功', 'success');
    } else {
        showStatus('生成总结失败: ' + response.error, 'error');
    }
}

// 保存总结内容
async function saveSummary() {
    try {
        const summary = document.getElementById('summaryText').value;
        const tempData = await loadTempSummaryData();
        const settings = await loadSettings();
        
        if (!summary || !tempData) {
            showStatus('没有可保存的内容', 'error');
            return;
        }

        showStatus('正在保存...', 'loading');
        
        // 在这里添加标签到内容中
        let finalContent = summary;
        if (settings.summaryTag) {
            finalContent = finalContent.trim() + '\n' + settings.summaryTag;
        }
        
        chrome.runtime.sendMessage({
            action: 'saveSummary',
            content: finalContent,
            url: settings.includeSummaryUrl ? tempData.url : undefined,
            title: tempData.title
        }, async response => {
            if (response.success) {
                showStatus('保存成功', 'success');
                // 清除文本框内容和临时数据
                document.getElementById('summaryText').value = '';
                await clearTempSummaryData();
            } else {
                showStatus('保存失败: ' + response.error, 'error');
            }
        });
    } catch (error) {
        console.error('保存总结时出错:', error);
        showStatus('保存失败: ' + error.message, 'error');
    }
}

// 获取当前标签页信息
async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

// 保存快捷记录内容
function saveQuickNote() {
    const content = document.getElementById('quickNoteInput').value;
    chrome.storage.local.set({ [QUICK_NOTE_KEY]: content });
}

// 加载快捷记录内容
async function loadQuickNote() {
    try {
        const result = await chrome.storage.local.get(QUICK_NOTE_KEY);
        if (result[QUICK_NOTE_KEY]) {
            document.getElementById('quickNoteInput').value = result[QUICK_NOTE_KEY];
        }
    } catch (error) {
        console.error('加载快捷记录失败:', error);
    }
}

// 清除快捷记录内容
function clearQuickNote() {
    document.getElementById('quickNoteInput').value = '';
    chrome.storage.local.remove(QUICK_NOTE_KEY);
}

// 发送快捷记录
async function sendQuickNote() {
    try {
        const content = document.getElementById('quickNoteInput').value;
        if (!content.trim()) {
            showStatus('请输入笔记内容', 'error');
            return;
        }

        const result = await chrome.storage.sync.get('settings');
        const settings = result.settings;
        
        if (!settings) {
            throw new Error('未找到设置信息');
        }

        chrome.runtime.sendMessage({
            action: 'saveSummary',
            content: content,
            url: undefined,  // 不包含URL
            title: undefined,
            tag: undefined,  // 不包含标签
            isSelection: false
        }, response => {
            if (response.success) {
                showStatus('发送成功', 'success');
                clearQuickNote();  // 发送成功后清除内容
            } else {
                showStatus('发送失败: ' + response.error, 'error');
            }
        });
    } catch (error) {
        showStatus('发送失败: ' + error.message, 'error');
    }
}

// 从Blinko获取AI配置
async function fetchAiConfig() {
    try {
        const targetUrl = document.getElementById('targetUrl').value.trim();
        const authKey = document.getElementById('authKey').value.trim();

        if (!targetUrl || !authKey) {
            showStatus('请先填写Blinko API URL和认证密钥', 'error');
            return;
        }

        // 构建请求URL，确保不重复添加v1
        const baseUrl = targetUrl.replace(/\/+$/, ''); // 移除���尾的斜杠
        const configUrl = `${baseUrl}/config/list`;

        showStatus('正在获取配置...', 'loading');
        
        const response = await fetch(configUrl, {
            method: 'GET',
            headers: {
                'Authorization': authKey
            }
        });

        if (!response.ok) {
            throw new Error(`获取配置失败: ${response.status}`);
        }

        const config = await response.json();
        
        if (config.aiModelProvider === 'OpenAI') {
            // 更新UI
            document.getElementById('modelUrl').value = config.aiApiEndpoint || '';
            document.getElementById('apiKey').value = config.aiApiKey || '';
            document.getElementById('modelName').value = config.aiModel || '';
            
            showStatus('AI配置获取成功', 'success');
        } else {
            showStatus('当前不支持的AI提供商: ' + config.aiModelProvider, 'error');
        }
    } catch (error) {
        console.error('获取AI配置时出错:', error);
        showStatus('获取AI配置失败: ' + error.message, 'error');
    }
}

// 检查后台总结状态
async function checkSummaryState() {
    try {
        // 首先尝试从storage获取保存的总结
        const currentSummary = await chrome.storage.local.get('currentSummary');
        const response = await chrome.runtime.sendMessage({ action: "getSummaryState" });
        
        const summaryPreview = document.getElementById('summaryPreview');
        const summaryText = document.getElementById('summaryText');
        const pageTitle = document.getElementById('pageTitle');
        const pageUrl = document.getElementById('pageUrl');
        const extractBtn = document.getElementById('extract');
        const cancelBtn = document.getElementById('cancelEdit');
        const editSummaryBtn = document.getElementById('editSummary');

        // 确保所有元素都存在
        if (!summaryPreview || !summaryText || !pageTitle || !pageUrl || !extractBtn || !cancelBtn || !editSummaryBtn) {
            console.error('找不到必要的DOM元素');
            return;
        }

        // 如果有已保存的总结，显示它
        if (currentSummary.currentSummary && currentSummary.currentSummary.summary) {
            summaryPreview.style.display = 'block';
            summaryText.value = currentSummary.currentSummary.summary;
            pageTitle.textContent = currentSummary.currentSummary.title || '';
            pageUrl.textContent = currentSummary.currentSummary.url || '';
            extractBtn.textContent = '重新生成';
            extractBtn.disabled = false;
            return;
        }

        // 否则根据状态显示
        if (response) {
            switch (response.status) {
                case 'completed':
                    // 显示已完成的总结
                    summaryPreview.style.display = 'block';
                    summaryText.value = response.summary;
                    pageTitle.textContent = response.title || '';
                    pageUrl.textContent = response.url || '';
                    extractBtn.textContent = '重新生成';
                    extractBtn.disabled = false;
                    break;
                case 'processing':
                    // 显示处理中状态
                    summaryPreview.style.display = 'block';
                    summaryText.value = '正在生成总结，请稍候...';
                    pageTitle.textContent = response.title || '';
                    pageUrl.textContent = response.url || '';
                    extractBtn.textContent = '处理中...';
                    extractBtn.disabled = true;
                    break;
                case 'error':
                    // 显示错误状态
                    showStatus(response.error, 'error');
                    extractBtn.textContent = '重新生成';
                    extractBtn.disabled = false;
                    break;
                case 'none':
                    // 重置为初始状态
                    extractBtn.textContent = '提取并总结页面内容';
                    extractBtn.disabled = false;
                    clearSummaryPreview();
                    break;
            }
        }
    } catch (error) {
        console.error('检查总结状态时出错:', error);
    }
}

// 初始化事件监听器
document.addEventListener('DOMContentLoaded', async function() {
    // 加载设置
    await loadSettings();
    
    // 检查总结状态
    await checkSummaryState();
    
    // 加载快捷记录内容
    await loadQuickNote();

    // 显示主页面
    document.getElementById('main').style.display = 'block';

    // 绑定快捷记录相关事件
    document.getElementById('quickNoteInput').addEventListener('input', saveQuickNote);
    document.getElementById('sendQuickNote').addEventListener('click', sendQuickNote);
    document.getElementById('clearQuickNote').addEventListener('click', clearQuickNote);

    // 绑定总结相关事件
    document.getElementById('extract').addEventListener('click', async () => {
        showStatus('正在获取页面内容...', 'loading');
        try {
            const tab = await getCurrentTab();
            if (!tab) {
                throw new Error('无法获取当前标签页');
            }
            chrome.tabs.sendMessage(tab.id, { action: 'getContent' }, response => {
                if (response.success) {
                    showStatus('正在生成总结...', 'loading');
                    // 发送到background进行总结
                    chrome.runtime.sendMessage({
                        action: "getContent",
                        content: response.content,
                        url: response.url,
                        title: response.title
                    });
                } else {
                    showStatus('获取页面内容失败: ' + response.error, 'error');
                }
            });
        } catch (error) {
            showStatus('获取页面内容失败: ' + error.message, 'error');
        }
    });

    // 绑定总结预览相关事件
    document.getElementById('editSummary').addEventListener('click', saveSummary);
    document.getElementById('cancelEdit').addEventListener('click', async () => {
        clearSummaryPreview();
        await clearTempSummaryData();
    });

    // 绑定设置相关事件
    document.getElementById('saveSettings').addEventListener('click', async () => {
        await saveSettings();
        showStatus('设置已保存', 'success');
        setTimeout(hideStatus, 2000);
    });

    document.getElementById('resetSettings').addEventListener('click', async () => {
        await resetSettings();
        showStatus('设置已重置为默认值', 'success');
        setTimeout(hideStatus, 2000);
    });

    // 绑定获取AI配置按钮事件
    document.getElementById('fetchAiConfig').addEventListener('click', fetchAiConfig);

    // 绑定密钥显示/隐藏事件
    document.querySelectorAll('.toggle-visibility').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (input) {
                input.classList.toggle('visible');
                // 更新按钮图标
                this.textContent = input.classList.contains('visible') ? '🔒' : '👁️';
            }
        });
    });

    // 标签切换事件
    document.querySelectorAll('.tablinks').forEach(button => {
        button.addEventListener('click', function(event) {
            openTab(event, this.dataset.tab);
        });
    });

    // 监听来自background的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'handleSummaryResponse') {
            handleSummaryResponse(request);
        }
    });

    // 加载临时总结数据
    const tempData = await loadTempSummaryData();
    if (tempData && tempData.summary) {
        await showSummaryPreview();
    }
});

// 在popup打开时检查总结状态
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 加载设置
        await loadSettings();
        
        // 检查总结状态
        await checkSummaryState();
        
        // 绑定事件监听器
        const extractBtn = document.getElementById('extract');
        const cancelBtn = document.getElementById('cancelEdit');
        const editSummaryBtn = document.getElementById('editSummary');

        if (extractBtn) {
            extractBtn.addEventListener('click', async () => {
                try {
                    // 获取当前标签页
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (!tab) {
                        throw new Error('无法获取当前标签页');
                    }

                    // 更新按钮状态
                    extractBtn.textContent = '处理中...';
                    extractBtn.disabled = true;

                    // 发送消息到content script
                    chrome.tabs.sendMessage(tab.id, { action: "getContent" });
                } catch (error) {
                    console.error('生成总结时出错:', error);
                    showStatus(error.message, 'error');
                }
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', async () => {
                try {
                    // 清除后台状态
                    await chrome.runtime.sendMessage({ action: "clearSummary" });
                    // 清除UI显示
                    clearSummaryPreview();
                    // 重置提取按钮
                    const extractBtn = document.getElementById('extract');
                    if (extractBtn) {
                        extractBtn.textContent = '提取并总结页面内容';
                        extractBtn.disabled = false;
                    }
                } catch (error) {
                    console.error('取消总结时出错:', error);
                    showStatus(error.message, 'error');
                }
            });
        }

        if (editSummaryBtn) {
            editSummaryBtn.addEventListener('click', async () => {
                try {
                    const response = await chrome.runtime.sendMessage({ action: "saveSummary" });
                    if (response.success) {
                        // 保存成功后清除UI显示
                        clearSummaryPreview();
                        // 重置提取按钮
                        if (extractBtn) {
                            extractBtn.textContent = '提取并总结页面内容';
                            extractBtn.disabled = false;
                        }
                        showStatus('保存成功', 'success');
                    } else {
                        throw new Error(response.error || '保存失败');
                    }
                } catch (error) {
                    console.error('保存总结时出错:', error);
                    showStatus(error.message, 'error');
                }
            });
        }
    } catch (error) {
        console.error('初始化popup时出错:', error);
    }
});

// 监听popup关闭事件
window.addEventListener('unload', () => {
    // 通知background.js popup已关闭
    chrome.runtime.sendMessage({ action: "popupClosed" });
});

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'handleSummaryResponse') {
        // 更新总结状态显示
        checkSummaryState();
    }
});