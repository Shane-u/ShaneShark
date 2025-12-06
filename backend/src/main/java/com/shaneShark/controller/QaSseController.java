package com.shaneShark.controller;

import com.shaneShark.model.entity.QaInfo;
import com.shaneShark.model.vo.QaVO;
import com.shaneShark.service.QaInfoService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import cn.hutool.json.JSONUtil;
import java.util.List;
import java.util.Random;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * QA SSE推送接口（每日推荐）
 */
@RestController
@RequestMapping("/qa/hot")
@Slf4j
public class QaSseController {

    @Resource
    private QaInfoService qaInfoService;

    /**
     * SSE推送每日推荐QA
     * 每24小时推送一条消息
     *
     * @return
     */
    @GetMapping("/sse")
    public SseEmitter streamHotQa() {
        // 设置超时时间为 2 天（确保能覆盖至少一次完整的 24 小时周期）
        SseEmitter emitter = new SseEmitter(172800000L); // 2天超时

        CompletableFuture.runAsync(() -> {
            try {
                // 查询所有精选QA
                com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<QaInfo> queryWrapper = 
                        new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
                queryWrapper.eq("is_hot", 1);
                List<QaInfo> hotQaList = qaInfoService.list(queryWrapper);

                if (hotQaList == null || hotQaList.isEmpty()) {
                    emitter.send(SseEmitter.event()
                            .name("message")
                            .data("{\"type\":\"empty\",\"message\":\"暂无推荐内容\"}"));
                    emitter.complete();
                    return;
                }

                Random random = new Random();
                
                // 循环发送：先发一条，然后休眠一天
                boolean isFirstSend = true;
                while (!Thread.currentThread().isInterrupted()) {
                    try {
                        // 随机选择 1 条精选 QA 推送
                        QaInfo randomQa = hotQaList.get(random.nextInt(hotQaList.size()));
                        QaVO qaVO = qaInfoService.getQaVO(randomQa);
                        
                        if (qaVO != null) {
                            String jsonData = JSONUtil.toJsonStr(qaVO);
                            emitter.send(SseEmitter.event()
                                    .name("message")
                                    .data(jsonData));
                            log.info("SSE推送成功，QA ID: {}, 是否首次发送: {}", qaVO.getId(), isFirstSend);
                            isFirstSend = false;
                        }

                        // 休眠 24 小时（86400000 毫秒）
                        log.info("SSE推送完成，开始休眠 24 小时（86400000毫秒）...");
                        
                        // 分段休眠，每10分钟检查一次连接状态，避免长时间阻塞无法响应连接关闭
                        long totalSleepTime = 86400000L; // 24小时
                        long checkInterval = 600000L; // 10分钟检查一次
                        long remainingTime = totalSleepTime;
                        
                        while (remainingTime > 0 && !Thread.currentThread().isInterrupted()) {
                            long sleepTime = Math.min(remainingTime, checkInterval);
                            TimeUnit.MILLISECONDS.sleep(sleepTime);
                            remainingTime -= sleepTime;
                        }
                        
                        if (Thread.currentThread().isInterrupted()) {
                            log.info("SSE休眠被中断");
                            break;
                        }
                        
                        log.info("SSE休眠结束（24小时），准备发送下一条消息");
                        
                    } catch (InterruptedException e) {
                        log.info("SSE推送线程被中断");
                        Thread.currentThread().interrupt();
                        break;
                    } catch (IllegalStateException e) {
                        // SSE连接已关闭
                        log.info("SSE连接已关闭，停止推送");
                        break;
                    } catch (Exception e) {
                        log.error("SSE推送过程中发生错误", e);
                        // 检查是否是连接关闭导致的异常
                        if (e.getMessage() != null && 
                            (e.getMessage().contains("closed") || 
                             e.getMessage().contains("Connection") ||
                             e instanceof IllegalStateException)) {
                            log.info("检测到SSE连接已关闭，停止推送");
                            break;
                        }
                        // 发生其他错误时也休眠，避免快速重试导致资源浪费
                        try {
                            TimeUnit.MILLISECONDS.sleep(86400000L);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                }
                
                log.info("SSE推送循环结束");
                
            } catch (org.springframework.jdbc.BadSqlGrammarException e) {
                // 数据库表不存在
                log.error("SSE推送失败：数据库表可能不存在", e);
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("{\"type\":\"error\",\"message\":\"数据库表不存在，请先执行SQL脚本创建qa_info表\"}"));
                } catch (Exception ex) {
                    log.error("发送错误消息失败", ex);
                }
                emitter.complete();
            } catch (Exception e) {
                log.error("SSE推送失败", e);
                try {
                    String errorMsg = e.getMessage();
                    if (errorMsg != null && errorMsg.contains("doesn't exist")) {
                        errorMsg = "数据库表不存在，请先执行SQL脚本创建qa_info表";
                    } else {
                        errorMsg = "服务器错误：" + (errorMsg != null ? errorMsg : "未知错误");
                    }
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("{\"type\":\"error\",\"message\":\"" + errorMsg + "\"}"));
                } catch (Exception ex) {
                    log.error("发送错误消息失败", ex);
                }
                emitter.complete();
            }
        });

        // 处理客户端断开连接
        emitter.onCompletion(() -> log.info("SSE连接已关闭"));
        emitter.onTimeout(() -> {
            log.info("SSE连接超时");
            emitter.complete();
        });
        emitter.onError((ex) -> {
            log.error("SSE连接错误", ex);
            emitter.completeWithError(ex);
        });

        return emitter;
    }
}

