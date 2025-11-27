package com.shaneShark.manager;

import com.shaneShark.config.MinioConfig;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.SetBucketPolicyArgs;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.annotation.Resource;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Minio 对象存储操作
 *
 * @author Shane
 */
@Component
@Slf4j
public class MinioManager {

    @Resource
    private MinioClient minioClient;

    @Resource
    private MinioConfig minioConfig;

    @Resource(name = "fileProcessExecutor")
    private ExecutorService fileProcessExecutor;

    /**
     * 应用启动时初始化：确保 bucket 存在并设置为公开访问
     */
    @PostConstruct
    public void initBucket() {
        try {
            String bucketName = minioConfig.getBucketName();
            
            // 检查 bucket 是否存在
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder()
                    .bucket(bucketName)
                    .build());
            
            if (!exists) {
                // 创建 bucket
                minioClient.makeBucket(MakeBucketArgs.builder()
                        .bucket(bucketName)
                        .build());
                log.info("Bucket {} 创建成功", bucketName);
            }
            
            // 设置 bucket 为公开读取
            setBucketPublicRead();
        } catch (Exception e) {
            log.error("初始化 Minio bucket 失败", e);
        }
    }

    /**
     * 设置 bucket 为公开读取
     * 允许所有人读取 bucket 中的文件
     */
    public void setBucketPublicRead() {
        try {
            String bucketName = minioConfig.getBucketName();
            
            // 设置 bucket 策略为公开读取
            String policy = "{\n" +
                    "  \"Version\": \"2012-10-17\",\n" +
                    "  \"Statement\": [\n" +
                    "    {\n" +
                    "      \"Effect\": \"Allow\",\n" +
                    "      \"Principal\": {\"AWS\": [\"*\"]},\n" +
                    "      \"Action\": [\"s3:GetObject\"],\n" +
                    "      \"Resource\": [\"arn:aws:s3:::" + bucketName + "/*\"]\n" +
                    "    }\n" +
                    "  ]\n" +
                    "}";
            
            minioClient.setBucketPolicy(SetBucketPolicyArgs.builder()
                    .bucket(bucketName)
                    .config(policy)
                    .build());
            
            log.info("Bucket {} 已设置为公开读取", bucketName);
        } catch (Exception e) {
            log.error("设置 bucket 公开访问失败", e);
            // 不抛出异常，避免影响应用启动
        }
    }

    /**
     * 计算文件的默克尔树 MD5 值
     * 使用默克尔树的方式计算 MD5，支持秒传功能
     * 使用多线程并行计算每个分块的 MD5，提高大文件处理速度
     *
     * @param inputStream 文件输入流
     * @param chunkSize   分块大小（字节），默认 2MB
     * @return MD5 值
     */
    public String calculateMerkleTreeMd5(InputStream inputStream, int chunkSize) {
        try {
            // 读取所有分块数据到内存
            List<byte[]> chunks = new ArrayList<>();
            byte[] buffer = new byte[chunkSize];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer, 0, chunkSize)) > 0) {
                byte[] chunk = new byte[bytesRead];
                System.arraycopy(buffer, 0, chunk, 0, bytesRead);
                chunks.add(chunk);
            }

            if (chunks.isEmpty()) {
                // 空文件
                MessageDigest md5 = MessageDigest.getInstance("MD5");
                md5.reset();
                return bytesToHex(md5.digest());
            }

            // 第一步：并行计算每个分块的 MD5
            List<CompletableFuture<String>> futures = IntStream.range(0, chunks.size())
                    .mapToObj(i -> CompletableFuture.supplyAsync(() -> {
                        try {
                            MessageDigest md5 = MessageDigest.getInstance("MD5");
                            md5.update(chunks.get(i));
                            return bytesToHex(md5.digest());
                        } catch (Exception e) {
                            log.error("计算分块 MD5 失败: chunk {}", i, e);
                            throw new RuntimeException("计算分块 MD5 失败", e);
                        }
                    }, fileProcessExecutor))
                    .collect(Collectors.toList());

            // 等待所有分块 MD5 计算完成
            List<String> chunkMd5List = futures.stream()
                    .map(CompletableFuture::join)
                    .collect(Collectors.toList());

            // 第二步：构建默克尔树，合并相邻的 MD5 值
            List<String> currentLevel = chunkMd5List;
            while (currentLevel.size() > 1) {
                final List<String> current = currentLevel; // 使用 final 变量
                List<CompletableFuture<String>> mergeFutures = new ArrayList<>();
                for (int i = 0; i < current.size(); i += 2) {
                    final int index = i;
                    if (i + 1 < current.size()) {
                        // 合并两个相邻的 MD5 值（并行处理）
                        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
                            try {
                                String combined = current.get(index) + current.get(index + 1);
                                MessageDigest md5 = MessageDigest.getInstance("MD5");
                                md5.update(combined.getBytes());
                                return bytesToHex(md5.digest());
                            } catch (Exception e) {
                                log.error("合并 MD5 失败", e);
                                throw new RuntimeException("合并 MD5 失败", e);
                            }
                        }, fileProcessExecutor);
                        mergeFutures.add(future);
                    } else {
                        // 奇数个时，最后一个单独处理
                        CompletableFuture<String> future = CompletableFuture.completedFuture(current.get(index));
                        mergeFutures.add(future);
                    }
                }
                // 等待所有合并操作完成
                currentLevel = mergeFutures.stream()
                        .map(CompletableFuture::join)
                        .collect(Collectors.toList());
            }

            return currentLevel.get(0);
        } catch (Exception e) {
            log.error("计算默克尔树 MD5 失败", e);
            throw new RuntimeException("计算 MD5 失败", e);
        }
    }

    /**
     * 计算文件的普通 MD5 值（用于兼容）
     *
     * @param inputStream 文件输入流
     * @return MD5 值
     */
    public String calculateMd5(InputStream inputStream) {
        try {
            MessageDigest md5 = MessageDigest.getInstance("MD5");
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                md5.update(buffer, 0, bytesRead);
            }
            return bytesToHex(md5.digest());
        } catch (Exception e) {
            log.error("计算 MD5 失败", e);
            throw new RuntimeException("计算 MD5 失败", e);
        }
    }

    /**
     * 字节数组转十六进制字符串
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    /**
     * 上传文件到 Minio
     *
     * @param objectName  对象名称（文件路径）
     * @param inputStream 文件输入流
     * @param contentType 文件类型
     * @param fileSize    文件大小
     * @return 文件访问地址
     */
    public String putObject(String objectName, InputStream inputStream, String contentType, long fileSize) {
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(minioConfig.getBucketName())
                            .object(objectName)
                            .stream(inputStream, fileSize, -1)
                            .contentType(contentType)
                            .build()
            );
            // 返回文件访问地址（使用 Minio API 格式，9003 端口）
            String endpoint = minioConfig.getEndpoint();
            // 如果 endpoint 包含 9002，替换为 9003
            if (endpoint.contains(":9002")) {
                endpoint = endpoint.replace(":9002", ":9003");
            }
            // 移除 endpoint 末尾的斜杠
            endpoint = endpoint.replaceAll("/+$", "");
            
            // 使用 Minio API 格式：/api/v1/buckets/{bucket}/objects/download?preview=true&prefix={objectName}
            try {
                String encodedObjectName = java.net.URLEncoder.encode(objectName, "UTF-8");
                return endpoint + "/api/v1/buckets/" + minioConfig.getBucketName() 
                        + "/objects/download?preview=true&prefix=" + encodedObjectName;
            } catch (Exception e) {
                log.error("URL 编码失败: {}", objectName, e);
                // 如果编码失败，使用未编码的版本
                return endpoint + "/api/v1/buckets/" + minioConfig.getBucketName() 
                        + "/objects/download?preview=true&prefix=" + objectName;
            }
        } catch (Exception e) {
            log.error("上传文件到 Minio 失败: {}", objectName, e);
            throw new RuntimeException("上传文件失败", e);
        }
    }

    /**
     * 删除文件
     *
     * @param objectName 对象名称（文件路径）
     */
    public void removeObject(String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(minioConfig.getBucketName())
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            log.error("删除文件失败: {}", objectName, e);
            throw new RuntimeException("删除文件失败", e);
        }
    }

    /**
     * 获取文件访问地址（使用 Minio API 格式）
     *
     * @param objectName 对象名称（文件路径）
     * @return 文件访问地址（使用 Minio API 格式，9003 端口）
     */
    public String getFileUrl(String objectName) {
        String endpoint = minioConfig.getEndpoint();
        // 如果 endpoint 包含 9002，替换为 9003
        if (endpoint.contains(":9002")) {
            endpoint = endpoint.replace(":9002", ":9003");
        }
        // 移除 endpoint 末尾的斜杠
        endpoint = endpoint.replaceAll("/+$", "");
        
        // 使用 Minio API 格式：/api/v1/buckets/{bucket}/objects/download?preview=true&prefix={objectName}
        try {
            String encodedObjectName = java.net.URLEncoder.encode(objectName, "UTF-8");
            return endpoint + "/api/v1/buckets/" + minioConfig.getBucketName() 
                    + "/objects/download?preview=true&prefix=" + encodedObjectName;
        } catch (Exception e) {
            log.error("URL 编码失败: {}", objectName, e);
            // 如果编码失败，使用未编码的版本
            return endpoint + "/api/v1/buckets/" + minioConfig.getBucketName() 
                    + "/objects/download?preview=true&prefix=" + objectName;
        }
    }

    /**
     * 从文件 URL 中提取 objectName
     * 支持两种 URL 格式：
     * 1. Minio API 格式：http://host:port/api/v1/buckets/bucketName/objects/download?preview=true&prefix=objectName
     * 2. 直接访问格式：http://host:port/bucketName/objectName
     *
     * @param fileUrl 文件访问地址
     * @return objectName（文件路径）
     */
    public String extractObjectNameFromUrl(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return null;
        }
        try {
            String bucketName = minioConfig.getBucketName();
            
            // 优先处理 Minio API 格式
            String apiPattern = "/api/v1/buckets/" + bucketName + "/objects/download";
            int apiIndex = fileUrl.indexOf(apiPattern);
            if (apiIndex >= 0) {
                // 提取 prefix 参数
                int prefixIndex = fileUrl.indexOf("prefix=");
                if (prefixIndex >= 0) {
                    String prefixPart = fileUrl.substring(prefixIndex + 7); // "prefix=" 长度是 7
                    // 移除可能的其他参数
                    int andIndex = prefixPart.indexOf("&");
                    if (andIndex >= 0) {
                        prefixPart = prefixPart.substring(0, andIndex);
                    }
                    // URL 解码
                    try {
                        return java.net.URLDecoder.decode(prefixPart, "UTF-8");
                    } catch (Exception e) {
                        log.warn("URL 解码失败: {}", prefixPart, e);
                        return prefixPart;
                    }
                }
            }
            
            // 处理直接访问格式：http://host:port/bucketName/objectName
            String searchPattern = "/" + bucketName + "/";
            int bucketIndex = fileUrl.indexOf(searchPattern);
            if (bucketIndex >= 0) {
                // 提取 bucketName 后面的所有内容
                String objectName = fileUrl.substring(bucketIndex + searchPattern.length());
                // 移除可能的查询参数
                int queryIndex = objectName.indexOf("?");
                if (queryIndex >= 0) {
                    objectName = objectName.substring(0, queryIndex);
                }
                return objectName;
            }
            
            log.warn("无法从 URL 中提取 objectName，未找到 bucketName '{}': {}", bucketName, fileUrl);
            return null;
        } catch (Exception e) {
            log.error("从 URL 提取 objectName 失败: {}", fileUrl, e);
            return null;
        }
    }

    /**
     * 根据文件 URL 删除 Minio 中的文件
     *
     * @param fileUrl 文件访问地址
     */
    public void removeObjectByUrl(String fileUrl) {
        String objectName = extractObjectNameFromUrl(fileUrl);
        if (objectName != null && !objectName.isEmpty()) {
            removeObject(objectName);
        } else {
            log.warn("无法从 URL 提取 objectName，跳过删除: {}", fileUrl);
        }
    }
}

