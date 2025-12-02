# 🚀 快速配置指南

---

## ⚡ 立即需要做的 3 件事

### 1️⃣ 更新 GitHub Secrets（必须）

访问：`https://github.com/你的用户名/ShaneShark/settings/secrets/actions`

更新或添加以下 Secret：

- **`SERVER_HOST`**: `xx.xx.xx.xx`
- **`SERVER_USER`**: `root`（或你的服务器用户名）
- **`SSH_PRIVATE_KEY`**: 你的 SSH 私钥（用于自动部署）

> 如果没有 SSH 私钥，在本地生成：
> ```bash
> ssh-keygen -t rsa -b 4096 -C "github-actions"
> ```
> 然后将公钥添加到服务器的 `~/.ssh/authorized_keys`

---

### 2️⃣ 创建前端环境变量文件（必须）

在本地项目目录执行：

```bash
cd /Users/shane/Documents/FrontendProject/ShaneShark/frontend
cat > .env.production << 'EOF'
VITE_API_BASE_URL=https://xx/api
EOF
```

然后提交：

```bash
git add .env.production
git commit -m "chore: configure production API base URL"
git push
```

---

### 3️⃣ 配置 Nginx（如果还没配置）

在 Nginx 服务器上执行：

```bash
# 1. 创建配置文件
sudo nano /etc/nginx/sites-available/xx.conf
```

**如果 Nginx 和后端在同一台服务器 (xx.xx.xx.xx)**，粘贴：

```nginx
server {
    listen 80;
    server_name xx;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name xx;

    ssl_certificate     /etc/letsencrypt/live/xx/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/xx/privkey.pem;

    location /api/ {
        proxy_pass http://127.0.0.1:8121/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
    }
}
```

**如果 Nginx 在另一台服务器**，把 `proxy_pass` 改成：

```nginx
proxy_pass http://xx.xx.xx.xx:8121/api/;
```

然后启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/xx.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

如果还没申请 SSL 证书：

```bash
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d xx
```

---

## ✅ 验证步骤

1. **测试后端 API**：
   ```bash
   curl https://xx/api/qa/list?current=1&pageSize=12
   ```
   应该返回 JSON 数据

2. **测试前端部署**：
   访问 `https://shane-u.github.io/ShaneShark/#/qa`
   - 打开浏览器开发者工具（F12）
   - 检查 Network 标签，请求应该是 `https://xx/api/...`
   - 检查 Console 标签，不应该有 Mixed Content 错误

3. **测试自动部署**：
   - 修改后端代码并 push
   - 在 GitHub Actions 中查看部署日志
   - 确认后端服务已更新

---

## 📚 详细文档

- 完整部署说明：[DEPLOYMENT.md](./DEPLOYMENT.md)
- Nginx 配置示例：[nginx-config-example.conf](./nginx-config-example.conf)

---

## 🆘 遇到问题？

1. 检查 GitHub Secrets 是否正确配置
2. 检查后端服务是否运行：`sudo systemctl status shaneshark-backend`
3. 检查 Nginx 配置：`sudo nginx -t`
4. 查看后端日志：`sudo journalctl -u shaneshark-backend -n 50`

