package com.shaneShark.exception;

import com.shaneShark.common.BaseResponse;
import com.shaneShark.common.ErrorCode;
import com.shaneShark.common.ResultUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器
 *
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public BaseResponse<?> businessExceptionHandler(BusinessException e) {
        log.error("BusinessException", e);
        return ResultUtils.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(BadSqlGrammarException.class)
    public BaseResponse<?> badSqlGrammarExceptionHandler(BadSqlGrammarException e) {
        log.error("数据库SQL错误", e);
        String message = e.getMessage();
        if (message != null && (message.contains("doesn't exist") || message.contains("Table") || message.contains("表"))) {
            return ResultUtils.error(ErrorCode.SYSTEM_ERROR, "数据库表不存在，请先执行SQL脚本创建qa_info表。SQL文件位置：backend/sql/create_qa_table_mysql.sql");
        }
        return ResultUtils.error(ErrorCode.SYSTEM_ERROR, "数据库查询错误：" + message);
    }

    @ExceptionHandler(DataAccessException.class)
    public BaseResponse<?> dataAccessExceptionHandler(DataAccessException e) {
        log.error("数据库访问错误", e);
        String message = e.getMessage();
        if (message != null && (message.contains("doesn't exist") || message.contains("Table") || message.contains("表"))) {
            return ResultUtils.error(ErrorCode.SYSTEM_ERROR, "数据库表不存在，请先执行SQL脚本创建qa_info表。SQL文件位置：backend/sql/create_qa_table_mysql.sql");
        }
        return ResultUtils.error(ErrorCode.SYSTEM_ERROR, "数据库访问错误：" + message);
    }

    @ExceptionHandler(RuntimeException.class)
    public BaseResponse<?> runtimeExceptionHandler(RuntimeException e) {
        log.error("RuntimeException", e);
        String message = e.getMessage();
        if (message != null && (message.contains("doesn't exist") || message.contains("Table") || message.contains("表"))) {
            return ResultUtils.error(ErrorCode.SYSTEM_ERROR, "数据库表不存在，请先执行SQL脚本创建qa_info表。SQL文件位置：backend/sql/create_qa_table_mysql.sql");
        }
        return ResultUtils.error(ErrorCode.SYSTEM_ERROR, "系统错误：" + (message != null ? message : "未知错误"));
    }
}
