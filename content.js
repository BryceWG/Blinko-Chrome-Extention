// 提取页面内容
function extractPageContent() {
    // 创建一个副本以避免修改原始DOM
    const clone = document.cloneNode(true);
    
    // 移除不需要的元素
    const elementsToRemove = clone.querySelectorAll('script, style, noscript, iframe, img, svg, video, audio, canvas, [aria-hidden="true"]');
    elementsToRemove.forEach(element => element.remove());
    
    // 获取正文内容
    const content = document.body.innerText
        .replace(/[\n\r]+/g, '\n') // 将多个换行符替换为单个
        .replace(/\s+/g, ' ') // 将多个空格替换为单个
        .trim(); // 移除首尾空白
    
    return content;
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getContent") {
        try {
            const content = extractPageContent();
            console.log('提取的内容长度:', content.length);
            sendResponse({
                success: true,
                content: content
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