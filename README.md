# Blinko Chrome Extension 🚀

一个Blinko配套Chrome扩展，使用AI自动提取和总结网页内容。支持自定义总结模板，可以将总结内容保存到指定Blinko服务器。

原项目地址: [Blinko](https://github.com/blinko-space/blinko) 🔗

## ✨ 功能特点

- 🤖 一键提取并总结当前网页内容，保存到Blinko
- 🎯 支持自定义AI模型和参数
- 📝 可配置的总结提示词模板
- 🔗 支持选择性包含原文链接
- ✂️ 支持右键菜单发送选中文本到Blinko
- 📌 快捷记录功能，随时记录临时想法
- 🏷️ 支持为总结和划词添加自定义标签
- 💾 总结内容临时保存，防止意外关闭丢失
- 🎨 现代化UI设计，操作更加流畅

## 🔧 安装说明

1. 下载本扩展的源代码
2. 打开Chrome浏览器，进入扩展管理页面（chrome://extensions/）
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本扩展的目录

## 📖 使用指南

### ⚙️ 基本配置

首次使用前，需要在扩展的设置页面配置以下信息：

1. **目标URL** 🎯：保存总结内容的Blinko API地址
2. **认证密钥** 🔑：访问Blinko API所需的认证密钥
3. **AI模型配置** 🤖：
   - 模型URL：AI服务的API地址
   - API密钥：访问AI服务所需的密钥
   - 模型名称：使用的AI模型（默认：gpt-4o-mini）
   - 温度参数：控制输出的随机性（默认：0.5）

### 🚀 使用方法

#### 总结整个网页 📄

1. 在要总结的网页上点击扩展图标
2. 点击"提取"按钮
3. 等待AI生成总结
4. 查看总结内容，可以进行编辑
5. 点击"保存"将总结发送到目标服务器

#### 快速记录想法 ✏️

1. 点击扩展图标
2. 在快捷记录框中输入内容
3. 点击"发送"保存到Blinko

#### 总结选中文本 ✂️

1. 选中网页中的文本
2. 右键点击，选择"发送到Blinko笔记"
3. 内容会自动发送到目标服务器

### 🛠️ 自定义设置

#### 提示词模板 📝

可以自定义总结的提示词模板，使用`{content}`作为占位符表示网页内容。默认模板提供了结构化的总结格式，包括：
- 标题和主题概述
- 核心内容总结
- 重点信息提取
- 一句话总结

#### 标签设置 🏷️

- **总结标签**：为网页总结添加默认标签（如：#阅读/网页）
- **划词标签**：为选中文本添加默认标签（如：#摘录）

#### URL包含选项 🔗

可以分别设置网页总结和划词保存是否包含原文链接。启用后，链接将以Markdown格式添加到内容中。

## ❗ 故障排除

1. **无法提取内容** 🚫
   - 确保网页已完全加载
   - 检查是否有必要的权限
   - 查看控制台是否有错误信息

2. **AI服务无响应** 🤖
   - 验证API密钥是否正确
   - 检查模型URL是否可访问
   - 确认是否超出API使用限制

3. **保存失败** ❌
   - 确认目标URL是否正确
   - 验证认证密钥是否有效
   - 检查网络连接状态

## 🔄 更新日志

### v1.1.0
- ✨ 新增快捷记录功能
- 🔄 优化总结内容的临时保存机制
- 🎨 全新的现代化UI设计
- 🏷️ 支持自定义标签功能
- 🐛 修复多个已知问题

### v1.0.0
- 🚀 首次发布
- 📄 支持网页内容总结
- ✂️ 支持划词保存
- ⚙️ 支持自定义设置