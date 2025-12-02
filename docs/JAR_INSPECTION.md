# 查看 JAR 包内容指南

## 📦 查看线上 JAR 包内容

### 方法 1：查看 JAR 包文件列表（推荐，最快）

```bash
# 在服务器上执行
cd /root/project/shaneshark_backend

# 查看 JAR 包内所有文件列表
jar tf app.jar

# 查看 JAR 包内所有文件列表（带详细信息）
jar tfv app.jar

# 只查看特定目录（如配置文件）
jar tf app.jar | grep application.yml
jar tf app.jar | grep application.properties

# 查看 META-INF 信息
jar tf app.jar | grep META-INF
```

**参数说明**：
- `t`：列出归档文件内容
- `f`：指定归档文件名
- `v`：显示详细信息（大小、日期等）

### 方法 2：解压 JAR 包查看内容

```bash
# 创建临时目录
mkdir -p /tmp/jar-inspect
cd /tmp/jar-inspect

# 解压 JAR 包
unzip -q /root/project/shaneshark_backend/app.jar -d ./extracted

# 查看解压后的内容
ls -la extracted/

# 查看配置文件
cat extracted/BOOT-INF/classes/application.yml
cat extracted/BOOT-INF/classes/application.properties

# 查看 META-INF 信息
cat extracted/META-INF/MANIFEST.MF

# 查看依赖库
ls extracted/BOOT-INF/lib/ | head -20

# 清理临时文件
rm -rf /tmp/jar-inspect
```

### 方法 3：使用 jar 命令解压

```bash
# 创建临时目录
mkdir -p /tmp/jar-inspect
cd /tmp/jar-inspect

# 解压 JAR 包
jar xf /root/project/shaneshark_backend/app.jar

# 查看内容
ls -la

# 查看配置文件
cat BOOT-INF/classes/application.yml

# 清理
cd /
rm -rf /tmp/jar-inspect
```

### 方法 4：查看特定文件内容（不解压）

```bash
# 使用 unzip 直接查看文件内容（不解压）
unzip -p /root/project/shaneshark_backend/app.jar BOOT-INF/classes/application.yml

# 查看 MANIFEST.MF
unzip -p /root/project/shaneshark_backend/app.jar META-INF/MANIFEST.MF

# 查看特定类文件（需要反编译工具）
unzip -p /root/project/shaneshark_backend/app.jar BOOT-INF/classes/com/shaneShark/Application.class | strings
```

### 方法 5：查看 JAR 包基本信息

```bash
# 查看 JAR 包大小
ls -lh /root/project/shaneshark_backend/app.jar

# 查看 JAR 包创建时间
stat /root/project/shaneshark_backend/app.jar

# 查看 JAR 包内的类文件数量
jar tf /root/project/shaneshark_backend/app.jar | grep "\.class$" | wc -l

# 查看依赖 JAR 包数量
jar tf /root/project/shaneshark_backend/app.jar | grep "BOOT-INF/lib/.*\.jar$" | wc -l
```

## 🔍 常用查看场景

### 场景 1：检查配置文件内容

```bash
# 查看 application.yml
jar tf app.jar | grep application.yml
unzip -p app.jar BOOT-INF/classes/application.yml

# 查看所有配置文件
jar tf app.jar | grep -E "\.(yml|properties|xml)$"
```

### 场景 2：检查依赖版本

```bash
# 查看所有依赖 JAR 包
jar tf app.jar | grep "BOOT-INF/lib/.*\.jar$"

# 查看特定依赖（如 Spring Boot）
jar tf app.jar | grep "BOOT-INF/lib/spring-boot"

# 查看依赖版本信息
jar tf app.jar | grep "BOOT-INF/lib/spring-boot" | head -1
```

### 场景 3：检查代码版本/构建信息

```bash
# 查看 MANIFEST.MF（包含构建信息）
unzip -p app.jar META-INF/MANIFEST.MF

# 查看 git.properties（如果包含）
unzip -p app.jar BOOT-INF/classes/git.properties 2>/dev/null || echo "未找到 git.properties"
```

### 场景 4：检查资源文件

```bash
# 查看所有资源文件
jar tf app.jar | grep "BOOT-INF/classes/" | grep -v "\.class$"

# 查看 SQL 文件
jar tf app.jar | grep "\.sql$"

# 查看静态资源
jar tf app.jar | grep "static/"
```

## 🛠️ 实用脚本

### 快速查看脚本

创建脚本 `~/inspect-jar.sh`：

```bash
#!/bin/bash

JAR_PATH="/root/project/shaneshark_backend/app.jar"

if [ ! -f "$JAR_PATH" ]; then
    echo "错误: JAR 文件不存在: $JAR_PATH"
    exit 1
fi

echo "=== JAR 包基本信息 ==="
ls -lh "$JAR_PATH"
echo ""

echo "=== 文件总数 ==="
jar tf "$JAR_PATH" | wc -l
echo ""

echo "=== 类文件数量 ==="
jar tf "$JAR_PATH" | grep "\.class$" | wc -l
echo ""

echo "=== 依赖 JAR 包数量 ==="
jar tf "$JAR_PATH" | grep "BOOT-INF/lib/.*\.jar$" | wc -l
echo ""

echo "=== 配置文件 ==="
jar tf "$JAR_PATH" | grep -E "\.(yml|properties|xml)$"
echo ""

echo "=== MANIFEST.MF ==="
unzip -p "$JAR_PATH" META-INF/MANIFEST.MF
echo ""

echo "=== application.yml ==="
unzip -p "$JAR_PATH" BOOT-INF/classes/application.yml 2>/dev/null || echo "未找到 application.yml"
```

使用方式：
```bash
chmod +x ~/inspect-jar.sh
~/inspect-jar.sh
```

## 📝 注意事项

1. **不要在生产环境解压 JAR 包**：解压会占用磁盘空间，建议使用临时目录
2. **查看后清理**：使用临时目录查看后记得清理
3. **JAR 包是只读的**：查看不会影响运行中的服务
4. **Spring Boot JAR 结构**：
   - `BOOT-INF/classes/`：应用代码和资源
   - `BOOT-INF/lib/`：依赖 JAR 包
   - `META-INF/`：元数据信息
   - `org/springframework/boot/loader/`：Spring Boot 启动器

## 🔗 相关命令参考

- `jar`：Java 归档工具
- `unzip`：解压 ZIP/JAR 文件
- `strings`：查看二进制文件中的可读字符串
- `javap`：Java 类文件反汇编器（需要类文件）

