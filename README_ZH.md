
# NodeWarden
English：[`README.md`](./README.md)

一个运行在 **Cloudflare Workers** 上的 **Bitwarden 兼容**服务端实现，面向个人使用场景。

- 部署简单（不需要 VPS）
- 功能聚焦
- 维护成本低



> **免责声明**  
> 本项目仅供学习交流使用。我们不对任何数据丢失负责，强烈建议定期备份您的密码库。  
> 本项目与 Bitwarden 官方无关，请勿向 Bitwarden 官方反馈问题。

---

## 特性
- ✅ **完全免费，不需要在服务器上部署，再次感谢大善人！**
- ✅ 完整的密码、笔记、卡片、身份信息管理
- ✅ 文件夹和收藏功能
- ✅ 文件附件支持（基于 R2 存储）
- ✅ 导入/导出功能
- ✅ 网站图标获取
- ✅ 端到端加密（服务器无法查看明文）
- ✅ 兼容常见的 Bitwarden 官方客户端

## 测试情况：
- ✅ Windows 客户端
- ✅ 手机 App（Android / iOS）
- ✅ 浏览器扩展
- ⬜ macOS 客户端（未测试）
- ⬜ Linux 客户端（未测试）
---

# 快速开始

### 一键部署

点击下方按钮部署到 Cloudflare Workers：

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/shuaiplus/nodewarden)

**部署步骤：**

1. 使用 GitHub 登录并授权
2. 登录 Cloudflare 账户
3. **重要**：设置 `JWT_SECRET` 为强随机字符串（推荐使用 `openssl rand -hex 32` 生成）
4. KV 存储和 R2 存储桶将自动创建
5. 点击 Deploy 等待部署完成
6. 部署完成后，先打开 Cloudflare 给你的 Workers 链接（也就是你的服务地址），在网页上填写信息完成注册。

> ⚠️ **再次提醒**：请务必使用强随机的 `JWT_SECRET`，使用默认或弱密钥可能导致账户被入侵，**后果自负！**

### 配置客户端

部署完成后，在任意 Bitwarden 客户端中：

1. 打开设置（⚙️）
2. 选择「自托管环境」
3. 服务器 URL 填入：`https://你的项目名`
4. 保存并返回登录页面



---

## 本地开发

这是一个 Cloudflare Workers 的 TypeScript 项目（Wrangler）。

```bash
npm install
npm run dev
```

---


## 技术栈

- **运行环境**：Cloudflare Workers
- **数据存储**：Cloudflare KV
- **文件存储**：Cloudflare R2
- **开发语言**：TypeScript
- **加密算法**：客户端 AES-256-CBC，JWT 使用 HS256

---

## 常见问题

**Q: 如何备份数据？**  
A: 在客户端中选择「导出密码库」，保存 JSON 文件。

**Q: 忘记主密码怎么办？**  
A: 无法恢复，这是端到端加密的特性。建议妥善保管主密码。

**Q: 可以多人使用吗？**  
A: 不建议。本项目为单用户设计，多人使用请选择 Vaultwarden。

---

## 开源协议

LGPL-3.0 License

---

## 致谢

- [Bitwarden](https://bitwarden.com/) - 原始设计和客户端
- [Vaultwarden](https://github.com/dani-garcia/vaultwarden) - 服务器实现参考
- [Cloudflare Workers](https://workers.cloudflare.com/) - 无服务器平台