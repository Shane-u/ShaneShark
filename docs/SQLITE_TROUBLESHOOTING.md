# SQLite 数据库连接问题排查指南

## 问题现象
应用无法连接到 SQLite 数据库，报错 `no such table: qa_info`

## 排查步骤

### 1. 检查 .env 文件位置和内容

**重要：`.env` 文件必须在 `/root/envFiles/.env`，不是项目目录！**

```bash
# SSH 连接到服务器
ssh root@your-server

# 检查 .env 文件是否存在
ls -la /root/envFiles/.env

# 查看 .env 文件内容（确认 SQLITE_DB_PATH 配置）
cat /root/envFiles/.env | grep SQLITE_DB_PATH
```

**`.env` 文件格式要求：**
- 每行一个环境变量
- 格式：`KEY=VALUE`（等号两边不能有空格）
- 不能有空行或注释（systemd 的 EnvironmentFile 不支持注释）

**正确的格式示例：**
```bash
SQLITE_DB_PATH=/root/project/shaneshark_backend/data/qa.db
DOUBAO_API_KEY=3a2e7379-9038-4f38-9866-898bb460059f
```

**错误的格式（会导致问题）：**
```bash
SQLITE_DB_PATH = /root/project/shaneshark_backend/data/qa.db  # 等号两边有空格
# SQLITE_DB_PATH=/root/project/shaneshark_backend/data/qa.db  # 注释行
```

### 2. 检查数据库目录和文件权限

```bash
# 检查数据库目录是否存在
ls -la /root/project/shaneshark_backend/data/

# 如果目录不存在，创建它
mkdir -p /root/project/shaneshark_backend/data

# 检查数据库文件权限（如果存在）
ls -la /root/project/shaneshark_backend/data/qa.db

# 确保目录和文件有正确的权限
chmod 755 /root/project/shaneshark_backend/data
chmod 644 /root/project/shaneshark_backend/data/qa.db  # 如果文件存在
```

### 3. 检查 systemd 服务配置

```bash
# 查看服务配置
cat /etc/systemd/system/shaneshark-backend.service

# 确认 EnvironmentFile 配置正确
# 应该看到：EnvironmentFile=/root/envFiles/.env
```

### 4. 重新加载 systemd 配置并重启服务

```bash
# 重新加载 systemd 配置（读取新的环境变量）
systemctl daemon-reload

# 重启服务
systemctl restart shaneshark-backend

# 查看服务状态
systemctl status shaneshark-backend

# 查看启动日志（确认数据库路径）
journalctl -u shaneshark-backend -n 100 --no-pager | grep -i "sqlite\|database"
```

### 5. 验证环境变量是否被正确加载

查看应用启动日志，应该看到类似以下内容：
```
=== SQLite 数据库配置 ===
数据库路径配置值: /root/project/shaneshark_backend/data/qa.db
环境变量 SQLITE_DB_PATH: /root/project/shaneshark_backend/data/qa.db
SQLite 数据库绝对路径: /root/project/shaneshark_backend/data/qa.db
========================
```

如果看到 `未检测到环境变量 SQLITE_DB_PATH`，说明环境变量没有被正确加载。

### 6. 手动测试数据库连接

```bash
# 安装 sqlite3（如果未安装）
# Ubuntu/Debian: apt-get install sqlite3
# CentOS/RHEL: yum install sqlite3

# 测试数据库文件
sqlite3 /root/project/shaneshark_backend/data/qa.db "SELECT name FROM sqlite_master WHERE type='table';"

# 如果表不存在，手动执行创建表的 SQL
sqlite3 /root/project/shaneshark_backend/data/qa.db < /path/to/create_qa_table.sql
```

## 常见问题

### 问题1：环境变量没有被加载

**原因：**
- `.env` 文件位置不对（应该在 `/root/envFiles/.env`）
- `.env` 文件格式错误（有空格、注释等）
- systemd 服务没有重新加载

**解决方法：**
1. 确认 `.env` 文件在 `/root/envFiles/.env`
2. 检查文件格式（每行 `KEY=VALUE`，无空格，无注释）
3. 执行 `systemctl daemon-reload` 和 `systemctl restart shaneshark-backend`

### 问题2：数据库文件权限问题

**原因：**
- 数据库目录或文件权限不足
- 应用运行用户（root）无法写入数据库文件

**解决方法：**
```bash
chmod 755 /root/project/shaneshark_backend/data
chmod 644 /root/project/shaneshark_backend/data/qa.db
chown root:root /root/project/shaneshark_backend/data/qa.db
```

### 问题3：数据库表不存在

**原因：**
- 数据库初始化失败
- SQL 脚本执行失败

**解决方法：**
1. 查看应用启动日志，确认初始化是否成功
2. 如果初始化失败，手动执行 SQL 脚本创建表
3. 确保 SQL 脚本文件在 JAR 包的 `classpath:sql/` 目录下

## 快速修复脚本

在服务器上执行以下命令进行快速修复：

```bash
#!/bin/bash
# 快速修复 SQLite 连接问题

# 1. 创建 .env 文件目录（如果不存在）
mkdir -p /root/envFiles

# 2. 创建或更新 .env 文件
cat > /root/envFiles/.env << 'EOF'
SQLITE_DB_PATH=/root/project/shaneshark_backend/data/qa.db
DOUBAO_API_KEY=3a2e7379-9038-4f38-9866-898bb460059f
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=doubao-1-5-lite-32k-250115
DOUBAO_TIMEOUT=60000
DEEPSEEK_API_KEY=95c87328-e0d0-4127-83f9-d1fc421bdcc7
DEEPSEEK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DEEPSEEK_MODEL=deepseek-v3-1-terminus
DEEPSEEK_TIMEOUT=60000
KIMI_API_KEY=95c87328-e0d0-4127-83f9-d1fc421bdcc7
KIMI_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
KIMI_MODEL=kimi-k2-250905
KIMI_TIMEOUT=60000
SILICON_FLOW_API_KEY=sk-xtpeftvmkdnxzvvfktuxdqsujopexuzqnripoxcwqlrdcshg
SILICON_FLOW_BASE_URL=https://api.siliconflow.cn
SILICON_FLOW_MODEL=Qwen/Qwen3-30B-A3B-Instruct-2507
SILICON_FLOW_TIMEOUT=30000
MINIO_ENDPOINT=http://47.109.65.166:9002
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=12345678
MINIO_BUCKET_NAME=digital
QA_ADMIN_PASSWORD=bagudawang
EOF

# 3. 确保数据库目录存在
mkdir -p /root/project/shaneshark_backend/data

# 4. 设置正确的权限
chmod 755 /root/project/shaneshark_backend/data
chmod 644 /root/envFiles/.env

# 5. 重新加载 systemd 配置
systemctl daemon-reload

# 6. 重启服务
systemctl restart shaneshark-backend

# 7. 等待几秒后检查状态
sleep 3
systemctl status shaneshark-backend --no-pager -l

# 8. 查看数据库相关日志
echo "=== 数据库配置日志 ==="
journalctl -u shaneshark-backend -n 50 --no-pager | grep -i "sqlite\|database\|初始化"
```

## 验证修复是否成功

执行以下命令验证：

```bash
# 1. 检查服务状态
systemctl status shaneshark-backend

# 2. 查看数据库初始化日志
journalctl -u shaneshark-backend --since "5 minutes ago" | grep -i "数据库\|初始化\|sqlite"

# 3. 检查数据库文件是否存在
ls -lh /root/project/shaneshark_backend/data/qa.db

# 4. 检查表是否存在（如果 sqlite3 已安装）
sqlite3 /root/project/shaneshark_backend/data/qa.db "SELECT name FROM sqlite_master WHERE type='table';"
```

应该看到 `qa_info`、`user`、`verification_code` 三个表。

