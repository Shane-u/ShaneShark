package com.shaneShark.controller;

import com.shaneShark.common.BaseResponse;
import com.shaneShark.common.ResultUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

/**
 * 基于 MCP 的 text2cypher 端点
 * 通过 MCP 工具链驱动硅基流动大模型生成 Cypher 查询
 */
@RestController
@RequestMapping("/mcp")
@Slf4j
public class McpText2CypherController {

    private final ChatClient text2CypherClient;
    private final SyncMcpToolCallbackProvider mcpProvider;

    public McpText2CypherController(ChatClient.Builder builder,
                                    SyncMcpToolCallbackProvider provider) {
        this.text2CypherClient = builder
                .defaultToolCallbacks(provider.getToolCallbacks())
                .build();
        this.mcpProvider = provider;
    }

    /**
     * 查看已注册的 MCP 工具，方便排查
     */
    @GetMapping("/debug/tools")
    public BaseResponse<List<String>> debugTools() {
        List<String> toolNames = new ArrayList<>();
        for (var callback : mcpProvider.getToolCallbacks()) {
            toolNames.add(callback.getToolDefinition().name());
        }
        return ResultUtils.success(toolNames);
    }

    /**
     * 自然语言转 Cypher 的入口
     *
     * @param question 自然语言问题
     * @return MCP 工具链生成的 Cypher 及其执行结果
     */
    @GetMapping("/text2cypher")
    public BaseResponse<String> text2cypher(@RequestParam String question) {
        String cypherPrompt = """
                你是 Neo4j Cypher 专家，请严格遵循以下数据库结构生成答案：
                - 节点标签：
                  • Competition(compId STRING, category STRING, competitionScope STRING, awardSetting STRING, description STRING, duration STRING, expiredate DATE)
                  • CompetitionDetail(detailId STRING, detail STRING, dname STRING, deptno STRING)
                  • CompetitionSource(channelId STRING, channelName STRING, channelUrl STRING, contact STRING)
                  • RegistrationChannel(channelId STRING, channelName STRING, channelUrl STRING, data DATETIME, from STRING)
                  • Skill(name STRING, level STRING, age INT, dob DATE)
                - 关系类型：
                  • (Competition)-[:BELONGS_TO]->(CompetitionSource)
                  • (Competition)-[:REQUIRES]->(Skill)
                - 常用插入示例：
                  CREATE (c:Competition {compId:'C001', category:'数学', awardSetting:'国家级', expiredate:date('2025-12-31')});
                  MATCH (c:Competition {compId:'C001'}), (s:CompetitionSource {channelId:'SRC01'})
                  CREATE (c)-[:BELONGS_TO]->(s);

                Question: %s

                严格按照下面步骤执行：
                1. 必须调用 get_neo4j_schema 工具核对最新节点、关系和属性。
                2. 根据问题产出合法的 Cypher 查询，注意数据类型（日期请用 date('YYYY-MM-DD')，数字不要加引号）。
                3. 通过 read_neo4j_cypher 工具执行查询。
                4. 返回 Cypher 与执行结果，使用中文解释。
                如果工具调用失败，请总结失败原因，不要凭空编造答案。
                """.formatted(question);

        var options = OpenAiChatOptions.builder()
                .toolChoice("required")
                .build();

        String cypherAnswer = text2CypherClient.prompt()
                .user(cypherPrompt)
                .options(options)
                .call()
                .content();

        return ResultUtils.success(cypherAnswer);
    }
}

