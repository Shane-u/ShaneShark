# 🔍 后端服务状态检查指南

## 🚀 快速检查（在服务器上执行）

### 方法 1: 手动检查

#### 1. 检查后端服务状态

```bash
# 检查服务是否运行
sudo systemctl status shaneshark-backend

# 如果未运行，启动服务
sudo systemctl start shaneshark-backend

# 查看服务日志
sudo journalctl -u shaneshark-backend -n 50 -f
```

#### 2. 检查端口是否监听

```bash
# 检查 8121 端口
sudo netstat -tlnp | grep 8121
# 或
sudo ss -tlnp | grep 8121
```

#### 3. 测试本地 API

```bash
# 测试后端是否正常响应
curl http://localhost:8121/api/qa/list?current=1&pageSize=1

# 应该返回 JSON 数据，类似：
# {"records":[...], "total":10, "current":1, "pageSize":1}
```

#### 4. 测试远程 API

```bash
# 测试通过 Nginx 访问
curl xxxx

# 检查响应头中的 CORS 信息
curl -I -X OPTIONS xxxx
```

#### 5. 检查 Nginx 状态

```bash
# 检查 Nginx 是否运行
sudo systemctl status nginx

# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

## 🔧 常见问题解决

### 问题 1: 502 Bad Gateway

**原因**: 后端服务未运行或 Nginx 无法连接到后端

**解决步骤**:

1. **检查后端服务**
   ```bash
   sudo systemctl status shaneshark-backend
   ```

2. **如果服务未运行，启动它**
   ```bash
   sudo systemctl start shaneshark-backend
   sudo systemctl enable shaneshark-backend  # 设置开机自启
   ```

3. **检查后端日志**
   ```bash
   sudo journalctl -u shaneshark-backend -n 100
   ```

4. **检查 Nginx 配置**
   ```bash
   # 确认 proxy_pass 指向正确的后端地址
   sudo cat /etc/nginx/sites-available/shaneshark.conf | grep proxy_pass
   
   # 如果 Nginx 和后端在同一台服务器，应该是：
   # proxy_pass http://127.0.0.1:8121/api/;
   ```

5. **重启 Nginx**
   ```bash
   sudo nginx -t  # 检查配置
   sudo systemctl reload nginx  # 重新加载配置
   ```

### 问题 2: CORS 错误

**原因**: 
- 后端服务未运行（导致 502，无法返回 CORS 头）
- Nginx 配置缺少 CORS 头
- 后端 CORS 配置问题

**解决步骤**:

1. **首先确保后端服务运行**（见问题 1）

2. **检查后端 CORS 配置**
   
   后端代码中已有 CORS 配置（`CorsConfig.java`），应该允许所有来源：
   ```java
   .allowedOriginPatterns("*")
   .allowCredentials(true)
   ```

3. **如果使用 Nginx，确保不覆盖 CORS 头**
   
   检查 Nginx 配置，确保没有删除或覆盖 CORS 头：
   ```nginx
   location /api/ {
       proxy_pass http://127.0.0.1:8121/api/;
       # 不要添加 proxy_hide_header Access-Control-*;
       # 确保后端返回的 CORS 头能传递到客户端
   }
   ```

4. **测试 CORS 头**
   ```bash
   # 测试 OPTIONS 请求（预检请求）
   curl -X OPTIONS -H "Origin: http://localhost:5173" \
        -H "Access-Control-Request-Method: GET" \
        -v xxxx
   
   # 应该看到响应头中包含：
   # Access-Control-Allow-Origin: *
   # Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   ```

### 问题 3: 后端服务启动失败

**检查步骤**:

1. **查看详细错误日志**
   ```bash
   sudo journalctl -u shaneshark-backend -n 100 --no-pager
   ```

2. **检查 JAR 文件是否存在**
   ```bash
   ls -lh /root/project/shaneshark_backend/app.jar
   ```

3. **检查 Java 是否安装**
   ```bash
   java -version
   ```

4. **手动运行 JAR 文件测试**
   ```bash
   cd /root/project/shaneshark_backend
   java -jar app.jar
   # 查看是否有错误信息
   ```

## 📋 完整检查清单

- [ ] 后端服务正在运行 (`systemctl status shaneshark-backend`)
- [ ] 端口 8121 正在监听 (`netstat -tlnp | grep 8121`)
- [ ] 本地 API 测试成功 (`curl http://localhost:8121/api/qa/list?current=1&pageSize=1`)
- [ ] 远程 API 测试成功 (`curl https://xxxx`)
- [ ] CORS 头存在 (`curl -I -X OPTIONS xxxx`)
- [ ] Nginx 配置正确 (`nginx -t`)
- [ ] Nginx 正在运行 (`systemctl status nginx`)
- [ ] 防火墙规则正确（8121 端口开放或仅对 Nginx 开放）

## 🔗 相关文档

- [部署说明](./DEPLOYMENT.md)
- [快速配置](./QUICK_SETUP.md)
- [Nginx 配置示例](./nginx-config-example.conf)

