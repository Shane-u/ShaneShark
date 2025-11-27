package com.shaneShark.repository;

import com.shaneShark.model.entity.ChatSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 聊天会话Repository
 *
 * @author Shane
 */
@Repository
public interface ChatSessionRepository extends MongoRepository<ChatSession, String> {

    /**
     * 根据用户ID查询所有未删除的会话，按更新时间倒序
     *
     * @param userId 用户ID
     * @param isDelete 是否删除
     * @return 会话列表
     */
    List<ChatSession> findByUserIdAndIsDeleteOrderByUpdateTimeDesc(Long userId, Boolean isDelete);

    /**
     * 根据会话ID查询会话
     *
     * @param id 会话ID
     * @return 会话
     */
    Optional<ChatSession> findById(String id);

    /**
     * 根据会话ID和用户ID查询会话
     * 使用MongoDB查询注解确保正确查询，同时验证未删除
     *
     * @param id 会话ID
     * @param userId 用户ID
     * @return 会话
     */
    @Query("{ '_id': ?0, 'userId': ?1, 'isDelete': false }")
    ChatSession findByIdAndUserId(String id, Long userId);
}

