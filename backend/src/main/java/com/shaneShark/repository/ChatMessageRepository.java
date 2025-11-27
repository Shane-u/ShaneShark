package com.shaneShark.repository;

import com.shaneShark.model.entity.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 聊天消息Repository
 *
 * @author Shane
 */
@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    /**
     * 根据会话ID查询所有未删除的消息，按创建时间正序
     *
     * @param sessionId 会话ID
     * @param isDelete 是否删除
     * @return 消息列表
     */
    List<ChatMessage> findBySessionIdAndIsDeleteOrderByCreateTimeAsc(String sessionId, Boolean isDelete);

    /**
     * 根据会话ID和用户ID查询所有未删除的消息，按创建时间正序
     * 使用@Query注解确保查询条件正确
     *
     * @param sessionId 会话ID
     * @param userId 用户ID
     * @param isDelete 是否删除
     * @return 消息列表
     */
    @Query("{ 'sessionId': ?0, 'userId': ?1, 'isDelete': ?2 }")
    List<ChatMessage> findBySessionIdAndUserIdAndIsDeleteOrderByCreateTimeAsc(String sessionId, Long userId, Boolean isDelete);
    
    /**
     * 根据会话ID和用户ID查询所有未删除的消息（使用显式查询和排序）
     * 用于调试：如果上面的方法查不到数据，可以尝试这个方法
     *
     * @param sessionId 会话ID
     * @param userId 用户ID
     * @return 消息列表
     */
    @Query(value = "{ 'sessionId': ?0, 'userId': ?1, 'isDelete': { $ne: true } }", sort = "{ 'createTime': 1 }")
    List<ChatMessage> findBySessionIdAndUserIdDebug(String sessionId, Long userId);

    /**
     * 根据会话ID删除所有消息（软删除）
     *
     * @param sessionId 会话ID
     */
    void deleteBySessionId(String sessionId);
}

