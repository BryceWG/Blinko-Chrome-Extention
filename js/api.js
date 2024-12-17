// 获取完整的API URL
function getFullApiUrl(baseUrl, endpoint) {
    try {
        const url = new URL(baseUrl);
        const pathParts = url.pathname.split('/');
        const v1Index = pathParts.indexOf('v1');
        if (v1Index === -1) {
            throw new Error('URL格式不正确，需要包含/v1路径');
        }
        return url.origin + pathParts.slice(0, v1Index + 1).join('/') + endpoint;
    } catch (error) {
        console.error('解析URL时出错:', error);
        throw new Error('URL格式不正确: ' + error.message);
    }
}

// 从模型获取总结
async function getSummaryFromModel(content, settings) {
    try {
        const prompt = settings.promptTemplate.replace('{content}', content);
        
        // 获取完整的API URL
        const fullUrl = getFullApiUrl(settings.modelUrl, '/chat/completions');
        
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify({
                model: settings.modelName,
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                temperature: settings.temperature
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API请求失败: ${response.status} ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('API返回式错误');
        }

        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('获取总结时出错:', error);
        throw error;
    }
}

// 发送内容到Blinko
async function sendToBlinko(content, url, title) {
    try {
        // 获取设置
        const result = await browser.storage.sync.get('settings');
        const settings = result.settings;
        
        if (!settings || !settings.targetUrl || !settings.authKey) {
            throw new Error('请先配置Blinko API URL和认证密钥');
        }

        // 构建请求URL，确保不重复添加v1
        const baseUrl = settings.targetUrl.replace(/\/+$/, ''); // 移除末尾的斜杠
        const requestUrl = `${baseUrl}/note/upsert`;

        // 准备认证头部
        const headers = new Headers({
            'Content-Type': 'application/json',
            'Authorization': settings.authKey.startsWith('Bearer ') ? settings.authKey : `Bearer ${settings.authKey}`
        });

        // 发送请求
        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                content: content
            })
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '未知错误');
            throw new Error(`保存失败: ${response.status}, ${errorText}`);
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('发送到Blinko失败:', error);
        return { success: false, error: error.message };
    }
}

async function setExtensionIcon(iconPath) {
    try {
        // 使用统一的action API
        const api = typeof browser !== 'undefined' ? browser : chrome;
        await api.action.setIcon({
            path: api.runtime.getURL(iconPath)
        });
    } catch (error) {
        console.error('设置图标失败:', error);
    }
}

async function sendToTarget(content, settings, url, retryCount = 0, title = '', isSelection = false) {
    if (!settings.targetUrl) {
        throw new Error('请设置目标URL');
    }

    if (!settings.authKey) {
        throw new Error('请设置认证密钥');
    }

    try {
        let finalContent = content;
        // 根据不同场景和设置决定是否添加URL
        if (url && ((isSelection && settings.includeSelectionUrl) || (!isSelection && settings.includeSummaryUrl))) {
            finalContent = `${finalContent}\n\n原文链接：[${title || url}](${url})`;
        }

        // 获取完整的API URL
        const fullUrl = getFullApiUrl(settings.targetUrl, '/note/upsert');

        // 准备认证头部
        const headers = new Headers({
            'Content-Type': 'application/json',
            'Authorization': settings.authKey.startsWith('Bearer ') ? settings.authKey : `Bearer ${settings.authKey}`
        });

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                content: finalContent
            })
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '未知错误');
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        // 显示成功图标
        await setExtensionIcon("images/icon128_success.png");
        
        // 3秒后恢复原始图标
        setTimeout(() => {
            setExtensionIcon("images/icon128.png");
        }, 3000);

        return response;
    } catch (error) {
        console.error('发送请求失败:', error);
        if (retryCount < 3) {
            // 添加延迟重试
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return sendToTarget(content, settings, url, retryCount + 1, title, isSelection);
        }
        throw new Error(`发送失败: ${error.message}`);
    }
}

export {
    getFullApiUrl,
    getSummaryFromModel,
    sendToBlinko,
    sendToTarget
}; 