// 从Jina Reader API获取网页内容
async function getWebContent(url, settings) {
    try {
        const headers = {
            "Accept": "application/json"
        };

        // 根据设置决定是否添加图片和API key相关header
        if (!settings.saveWebImages) {
            headers["X-Retain-Images"] = "none";
        }

        if (settings.useJinaApiKey && settings.jinaApiKey) {
            headers["Authorization"] = `Bearer ${settings.jinaApiKey}`;
        }

        const response = await fetch(`https://r.jina.ai/${url}`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.code !== 200 || !data.data) {
            throw new Error('API返回格式错误');
        }

        // 组织返回内容
        let content = `# ${data.data.title}\n\n`;
        content += data.data.content;
        content += `\n\n原文链接：[${data.data.title}](${data.data.url})`;

        return {
            success: true,
            content: content,
            title: data.data.title,
            url: data.data.url
        };
    } catch (error) {
        console.error('获取网页内容失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

export {
    getWebContent
}; 