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
     *
     * @return
     */
    @GetMapping("/sse")
    public SseEmitter streamHotQa() {
        SseEmitter emitter = new SseEmitter(3600000L); // 1小时超时

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

                // 随机选择1-3条
                Random random = new Random();
                int count = Math.min(random.nextInt(3) + 1, hotQaList.size());
                List<QaInfo> selectedQa = new java.util.ArrayList<>(hotQaList);
                // 打乱顺序并取前count条
                java.util.Collections.shuffle(selectedQa);
                selectedQa = selectedQa.subList(0, count);

                // 转换为VO并发送（默认每 3 秒推送一条，避免刷得太快）
                for (QaInfo qaInfo : selectedQa) {
                    QaVO qaVO = qaInfoService.getQaVO(qaInfo);
                    if (qaVO != null) {
                        String jsonData = JSONUtil.toJsonStr(qaVO);
                        emitter.send(SseEmitter.event()
                                .name("message")
                                .data(jsonData));
                        // 如果你想调节频率，可以改这里的毫秒数：
                        // 1000 = 1秒一条，3000 = 3秒一条，5000 = 5秒一条
                        Thread.sleep(5000); // 间隔 5000ms 发送
                    }
                }

                emitter.complete();
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

