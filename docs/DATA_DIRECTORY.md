# Data 目录说明

## 📁 关于 data 目录

### 为什么 data 目录没有被打包进 JAR？

**这是正常且正确的行为**，原因如下：

1. **数据库文件是运行时数据**：`data/qa.db` 是 SQLite 数据库文件，包含运行时的数据，不应该打包进 JAR
2. **数据会变化**：每次运行应用，数据库内容都会变化，打包静态数据没有意义
3. **部署灵活性**：不同环境（开发/测试/生产）应该使用不同的数据库文件
4. **最佳实践**：数据库文件应该独立于应用代码管理

### 数据库文件位置

根据 `application.yml` 配置：

```yaml
spring:
  sqlite:
    db:
      path: ${SQLITE_DB_PATH:./data/qa.db}  # 默认相对路径
```

- **默认路径**：`./data/qa.db`（相对于应用运行的工作目录）
- **部署路径**：`/root/project/shaneshark_backend/data/qa.db`
- **环境变量**：可以通过 `SQLITE_DB_PATH` 环境变量自定义路径

### 自动创建机制

`SqliteConfig.java` 会在应用启动时自动创建 data 目录（如果不存在）：

```java
File dbFile = new File(sqliteDbPath);
File parentDir = dbFile.getParentFile();
if (parentDir != null && !parentDir.exists()) {
    parentDir.mkdirs();  // 自动创建目录
}
```

## 🔧 部署时确保 data 目录存在

### 自动部署（GitHub Actions）

部署脚本已更新，会自动创建 data 目录：

```yaml
# 确保 data 目录存在（SQLite 数据库目录）
mkdir -p "$DEPLOY_PATH/data"
```

### 手动部署

如果手动部署，需要确保 data 目录存在：

```bash
# 在服务器上执行
cd /root/project/shaneshark_backend
mkdir -p data

# 设置权限（如果需要）
chmod 755 data
```

## ✅ 验证 data 目录

### 检查目录是否存在

```bash
# 在服务器上执行
ls -la /root/project/shaneshark_backend/data/

# 检查数据库文件
ls -lh /root/project/shaneshark_backend/data/qa.db
```

### 检查应用日志

应用启动时，如果 data 目录不存在，`SqliteConfig` 会自动创建。查看日志确认：

```bash
sudo journalctl -u shaneshark-backend -n 50 | grep -i "data\|sqlite"
```

## 🗄️ 数据库初始化

### 首次运行

1. **应用启动时**：`SqliteConfig` 会自动创建 data 目录
2. **数据库文件**：SQLite 会在首次连接时自动创建 `qa.db` 文件
3. **表结构**：需要执行 SQL 脚本创建表结构

### 创建表结构

```bash
# 在服务器上执行
cd /root/project/shaneshark_backend

# 使用 sqlite3 命令行工具创建表
sqlite3 data/qa.db < sql/create_qa_table.sql

# 或者通过应用接口初始化（如果实现了初始化接口）
```

### SQL 脚本位置

- 开发环境：`backend/sql/create_qa_table.sql`
- 部署后：需要手动复制到服务器或通过其他方式执行

## 🔄 数据迁移和备份

### 备份数据库

```bash
# 备份 SQLite 数据库
cp /root/project/shaneshark_backend/data/qa.db /root/backup/qa.db.$(date +%Y%m%d_%H%M%S)
```

### 恢复数据库

```bash
# 恢复数据库
cp /root/backup/qa.db.20241202_120000 /root/project/shaneshark_backend/data/qa.db
```

### 数据迁移

如果需要迁移到其他服务器：

```bash
# 1. 停止服务
sudo systemctl stop shaneshark-backend

# 2. 备份数据库
cp data/qa.db /tmp/qa.db.backup

# 3. 传输到新服务器
scp /tmp/qa.db.backup user@new-server:/root/project/shaneshark_backend/data/qa.db

# 4. 在新服务器上启动服务
sudo systemctl start shaneshark-backend
```

## ⚙️ 自定义数据库路径

### 通过环境变量

在 `/root/envFiles/.env` 中配置：

```bash
SQLITE_DB_PATH=/var/lib/shaneshark/data/qa.db
```

### 通过 application.yml

修改 `backend/src/main/resources/application.yml`：

```yaml
spring:
  sqlite:
    db:
      path: /var/lib/shaneshark/data/qa.db  # 绝对路径
```

**注意**：使用绝对路径时，确保目录存在且有写权限。

## 🐛 常见问题

### 1. 数据库文件权限问题

```bash
# 检查权限
ls -la /root/project/shaneshark_backend/data/qa.db

# 修复权限
chmod 644 /root/project/shaneshark_backend/data/qa.db
chown root:root /root/project/shaneshark_backend/data/qa.db
```

### 2. 磁盘空间不足

```bash
# 检查磁盘空间
df -h /root/project/shaneshark_backend

# 检查数据库文件大小
du -sh /root/project/shaneshark_backend/data/qa.db
```

### 3. 数据库文件损坏

```bash
# 使用 sqlite3 检查数据库
sqlite3 /root/project/shaneshark_backend/data/qa.db "PRAGMA integrity_check;"

# 如果损坏，从备份恢复
```

## 📝 总结

- ✅ **data 目录不应该打包进 JAR**（这是正确的）
- ✅ **应用会自动创建 data 目录**（如果不存在）
- ✅ **部署脚本已更新**，确保目录存在
- ✅ **数据库文件独立管理**，便于备份和迁移

如果遇到数据库相关问题，首先检查：
1. data 目录是否存在
2. 数据库文件权限是否正确
3. 磁盘空间是否充足
4. 应用日志中的错误信息

