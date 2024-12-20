import { loadSettings, saveSettings, resetSettings, fetchAiConfig } from './settings.js';
import { initializeUIListeners, showStatus, hideStatus } from './ui.js';
import { loadQuickNote, initializeQuickNoteListeners } from './quickNote.js';
import { checkSummaryState, initializeSummaryListeners, handleSummaryResponse } from './summary.js';

// 初始化事件监听器
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 检查是否是通过通知点击打开的
        const result = await browser.storage.local.get(['notificationClicked', 'notificationTabId']);
        if (result.notificationClicked) {
            // 检查当前标签页是否匹配
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.id === result.notificationTabId) {
                // 清除标记
                await browser.storage.local.remove(['notificationClicked', 'notificationTabId']);
                // 切换到主页面
                const mainTab = document.querySelector('.tablinks[data-tab="main"]');
                if (mainTab) {
                    mainTab.click();
                }
            }
        }

        // 加载设置
        await loadSettings();
        
        // 检查总结状态
        await checkSummaryState();
        
        // 加载快捷记录内容
        await loadQuickNote();

        // 显示主页面
        document.getElementById('main').style.display = 'block';

        // 初始化所有事件监听器
        initializeUIListeners();
        initializeQuickNoteListeners();
        initializeSummaryListeners();

        // 绑定提取网页正文按钮事件
        document.getElementById('extractContent').addEventListener('click', async () => {
            try {
                showStatus('正在提取网页内容...', 'loading');
                const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
                if (!tab) {
                    throw new Error('无法获取当前标签页');
                }

                // 发送消息到content script获取内容
                const response = await browser.tabs.sendMessage(tab.id, {
                    action: 'getContent'
                });

                if (!response || !response.success) {
                    throw new Error(response.error || '获取内容失败');
                }

                // 发送到background处理
                await browser.runtime.sendMessage({
                    action: 'getContent',
                    content: response.content,
                    url: response.url,
                    title: response.title,
                    isExtractOnly: true
                });

            } catch (error) {
                console.error('提取网页内容失败:', error);
                showStatus('提取失败: ' + error.message, 'error');
            }
        });

        // 绑定设置相关事件
        document.getElementById('saveSettings').addEventListener('click', async () => {
            try {
                await saveSettings();
                showStatus('设置已保存', 'success');
                setTimeout(hideStatus, 2000);
            } catch (error) {
                showStatus('保存设置失败: ' + error.message, 'error');
            }
        });

        document.getElementById('resetSettings').addEventListener('click', async () => {
            try {
                await resetSettings();
                showStatus('设置已重置为默认值', 'success');
                setTimeout(hideStatus, 2000);
            } catch (error) {
                showStatus('重置设置失败: ' + error.message, 'error');
            }
        });

        // 绑定获取AI配置按钮事件
        document.getElementById('fetchAiConfig').addEventListener('click', fetchAiConfig);

    } catch (error) {
        console.error('初始化失败:', error);
        showStatus('初始化失败: ' + error.message, 'error');
    }
});

// 监听来自background的消息
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request && request.action === 'handleSummaryResponse') {
        handleSummaryResponse(request);
        sendResponse({ received: true });
    } else if (request && request.action === 'saveSummaryResponse') {
        if (request.response.success) {
            showStatus('保存成功', 'success');
            setTimeout(hideStatus, 2000);
        } else {
            showStatus('保存失败: ' + request.response.error, 'error');
        }
        sendResponse({ received: true });
    } else if (request && request.action === 'floatingBallResponse') {
        if (request.response.success) {
            showStatus(request.response.isExtractOnly ? '提取成功' : '总结成功', 'success');
            setTimeout(hideStatus, 2000);
        } else {
            showStatus((request.response.isExtractOnly ? '提取' : '总结') + '失败: ' + request.response.error, 'error');
        }
        sendResponse({ received: true });
    } else if (request && request.action === 'clearSummaryResponse') {
        if (request.success) {
            showStatus('清除成功', 'success');
            setTimeout(hideStatus, 2000);
        }
        sendResponse({ received: true });
    }
    return false;  // 不保持消息通道开放
});

// 在popup关闭时通知background
window.addEventListener('unload', async () => {
    try {
        // 如果summaryPreview是隐藏的，说明用户已经取消或保存了内容，这时我们需要清理存储
        const summaryPreview = document.getElementById('summaryPreview');
        if (summaryPreview && summaryPreview.style.display === 'none') {
            await browser.storage.local.remove('currentSummary');
        }
        
        browser.runtime.sendMessage({ action: "popupClosed" }).catch(() => {
            // 忽略错误，popup关闭时可能会出现连接错误
        });
    } catch (error) {
        // 忽略错误
    }
}); 