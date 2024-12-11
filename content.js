const https = require('https');

async function extractPageContent() {
    try {
        // 获取存储的设置
        const result = await chrome.storage.sync.get('settings');
        const settings = result.settings;

        if (!settings) {
            throw new Error('未找到设置信息');
        }

        let content;
        if (settings.useJinaReader) {
            const options = {
                hostname: 'r.jina.ai',
                path: 'https://example.com',
                headers: {
                    'Authorization': `Bearer ${settings.jinaApiKey}`
                }
            };

            return new Promise((resolve, reject) => {
                const req = https.request(options, res => {
                    let data = '';

                    res.on('data', chunk => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        try {
                            const parsedData = JSON.parse(data);
                            if (!parsedData.content) {
                                throw new Error('Jina API返回格式错误');
                            }
                            resolve(parsedData.content);
                        } catch (error) {
                            reject(error);
                        }
                    });
                });

                req.on('error', error => {
                    reject(error);
                });

                req.end();
            });
        } else {
            // 获取正文内容
            content = document.body.innerText
                .replace(/[\n\r]+/g, '\n') // 将多个换行符替换为单个
                .replace(/\s+/g, ' ') // 将多个空格替换为单个
                .trim(); // 移除首尾空白
        }

        return content;
    } catch (error) {
        console.error('提取内容时出错:', error);
        throw error;
    }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getContent") {
        try {
            const content = extractPageContent();
            console.log('提取的内容长度:', content.length);
            sendResponse({
                success: true,
                content: content,
                url: window.location.href,
                title: document.title
            });
        } catch (error) {
            console.error('提取内容时出错:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }
    return true;
});
