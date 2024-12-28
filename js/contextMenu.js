import { sendToBlinko, sendToTarget, uploadImageUrl } from './api.js';
import { showSuccessIcon } from './ui.js';
import { handleContentRequest } from './messageHandler.js';

// 初始化右键菜单
function initializeContextMenu() {
    chrome.runtime.onInstalled.addListener(() => {
        // 创建父级菜单
        chrome.contextMenus.create({
            id: "blinkoExtension",
            title: "Blinko Extension",
            contexts: ["all"]
        });

        // 创建选中文本菜单
        chrome.contextMenus.create({
            id: "sendSelectedText",
            title: "发送选中文本到Blinko",
            contexts: ["selection"],
            parentId: "blinkoExtension"
        });

        // 创建图片右键菜单
        chrome.contextMenus.create({
            id: 'saveImageToBlinko',
            title: '保存图片到Blinko',
            contexts: ['image'],
            parentId: "blinkoExtension"
        });

        // 创建总结网页内容菜单
        chrome.contextMenus.create({
            id: 'summarizePageContent',
            title: '总结网页内容',
            contexts: ['page'],
            parentId: "blinkoExtension"
        });

        // 创建提取网页内容菜单
        chrome.contextMenus.create({
            id: 'extractPageContent',
            title: '提取网页内容',
            contexts: ['page'],
            parentId: "blinkoExtension"
        });
    });
}

// 处理右键菜单点击
async function handleContextMenuClick(info, tab) {
    if (info.menuItemId === "sendSelectedText") {
        try {
            const result = await chrome.storage.sync.get('settings');
            const settings = result.settings;
            
            if (!settings) {
                throw new Error('未找到设置信息');
            }

            // 准备最终内容
            let finalContent = info.selectionText;
            if (settings.selectionTag) {
                finalContent = finalContent.trim() + '\n' + settings.selectionTag;
            }

            const response = await sendToTarget(
                finalContent,
                settings,
                tab.url,
                0,
                tab.title,
                true  // 这是划词场景
            );
            
            if (response.ok) {
                showSuccessIcon();
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'images/icon128.png',
                    title: '发送成功',
                    message: '已成功发送选中文本到Blinko'
                });
            } else {
                throw new Error(`发送选中文本失败，状态码: ${response.status}`);
            }
        } catch (error) {
            console.error('发送选中文本失败:', error);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'images/icon128.png',
                title: '发送失败',
                message: error.message
            });
        }
    }

    if (info.menuItemId === 'saveImageToBlinko') {
        try {
            // 获取设置
            const result = await chrome.storage.sync.get('settings');
            const settings = result.settings;
            
            if (!settings) {
                throw new Error('未找到设置信息');
            }

            // 先上传图片
            const imageAttachment = await uploadImageUrl(info.srcUrl, settings);

            // 构建Markdown格式的图片链接
            let content = '';
            
            // 如果设置中选择包含URL，则添加原网页链接
            if (settings.includeImageUrl) {
                content = `> 来源：[${tab.title}](${tab.url})`;
            }

            // 发送到Blinko，包含图片附件
            const response = await sendToBlinko(content, tab.url, tab.title, imageAttachment, 'image');
            
            if (response.success) {
                // 通知用户保存成功
                showSuccessIcon();
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'images/icon128.png',
                    title: '保存成功',
                    message: '已成功保存图片到Blinko'
                });
            } else {
                throw new Error(response.error || '保存失败');
            }
        } catch (error) {
            console.error('保存图片失败:', error);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'images/icon128.png',
                title: '保存失败',
                message: error.message
            });
        }
    }

    // 处理总结和提取网页内容
    if (info.menuItemId === 'summarizePageContent' || info.menuItemId === 'extractPageContent') {
        try {
            // 获取页面内容
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'getContent'
            });

            if (!response || !response.success) {
                throw new Error(response.error || '获取内容失败');
            }

            // 直接处理并保存内容
            await handleContentRequest({
                content: response.content,
                url: response.url,
                title: response.title,
                isExtractOnly: info.menuItemId === 'extractPageContent',
                directSave: true  // 标记为直接保存
            });

            // 成功通知会在handleContentRequest中处理
        } catch (error) {
            console.error('处理网页内容失败:', error);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'images/icon128.png',
                title: info.menuItemId === 'summarizePageContent' ? '总结失败' : '提取失败',
                message: error.message
            });
        }
    }
}

export {
    initializeContextMenu,
    handleContextMenuClick
}; 