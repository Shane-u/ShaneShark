package com.shaneShark.model.dto.chat;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 聊天消息 DTO
 * 支持多模态输入：文本、图片、视频
 *
 * @author Shane
 */
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Message implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 消息角色
     * system: 系统消息
     * user: 用户消息
     * assistant: AI助手消息
     */
    private String role;

    /**
     * 消息内容（文本内容，内部字段，不直接序列化）
     */
    @JsonIgnore
    private String content;

    /**
     * 多模态内容列表（内部字段，不直接序列化）
     */
    @JsonIgnore
    private List<ContentItem> contentList;

    /**
     * 图片URL列表（简化方式，用于前端传参）
     */
    private List<String> imageUrls;

    /**
     * 视频URL列表（简化方式，用于前端传参）
     */
    private List<String> videoUrls;

    /**
     * 推理内容
     */
    @JsonProperty("reasoning_content")
    private String reasoningContent;

    /**
     * JSON序列化：content字段
     * 使用 @JsonGetter 明确指定属性名为 "content"
     * 根据是否有imageUrls/videoUrls来决定返回字符串还是数组
     */
    @JsonGetter("content")
    public Object getContentForJson() {
        // 如果有imageUrls或videoUrls，构建contentList格式
        if ((imageUrls != null && !imageUrls.isEmpty()) || 
            (videoUrls != null && !videoUrls.isEmpty()) ||
            (contentList != null && !contentList.isEmpty())) {
            
            List<ContentItem> items = new ArrayList<>();
            
            // 添加文本内容
            if (content != null && !content.trim().isEmpty()) {
                ContentItem textItem = new ContentItem();
                textItem.setType("text");
                textItem.setText(content);
                items.add(textItem);
            }
            
            // 添加图片
            if (imageUrls != null) {
                for (String imageUrl : imageUrls) {
                    ContentItem imageItem = new ContentItem();
                    imageItem.setType("image_url");
                    ImageUrl imgUrl = new ImageUrl();
                    imgUrl.setUrl(imageUrl);
                    imageItem.setImageUrl(imgUrl);
                    items.add(imageItem);
                }
            }
            
            // 添加视频
            if (videoUrls != null) {
                for (String videoUrl : videoUrls) {
                    ContentItem videoItem = new ContentItem();
                    videoItem.setType("video_url");
                    VideoUrl vidUrl = new VideoUrl();
                    vidUrl.setUrl(videoUrl);
                    videoItem.setVideoUrl(vidUrl);
                    items.add(videoItem);
                }
            }
            
            // 如果有contentList，合并进去
            if (contentList != null && !contentList.isEmpty()) {
                items.addAll(contentList);
            }
            
            return items.isEmpty() ? content : items;
        }
        
        // 如果有contentList，直接返回
        if (contentList != null && !contentList.isEmpty()) {
            return contentList;
        }
        
        // 否则返回普通文本content
        return content;
    }

    /**
     * JSON反序列化：content字段
     * 使用 @JsonSetter 明确指定属性名为 "content"
     */
    @JsonSetter("content")
    public void setContentFromJson(Object contentValue) {
        if (contentValue == null) {
            this.content = null;
            this.contentList = null;
            return;
        }
        
        // 如果是字符串，设置到content
        if (contentValue instanceof String) {
            this.content = (String) contentValue;
            this.contentList = null;
        }
        // 如果是List，设置到contentList
        else if (contentValue instanceof List) {
            @SuppressWarnings("unchecked")
            List<Object> list = (List<Object>) contentValue;
            // 检查是否是ContentItem列表
            if (!list.isEmpty() && list.get(0) instanceof Map) {
                this.contentList = new ArrayList<>();
                for (Object item : list) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> itemMap = (Map<String, Object>) item;
                    ContentItem contentItem = new ContentItem();
                    contentItem.setType((String) itemMap.get("type"));
                    if ("text".equals(contentItem.getType())) {
                        contentItem.setText((String) itemMap.get("text"));
                        // 同时设置到content字段
                        if (this.content == null) {
                            this.content = contentItem.getText();
                        }
                    } else if ("image_url".equals(contentItem.getType())) {
                        @SuppressWarnings("unchecked")
                        Map<String, String> imageUrlMap = (Map<String, String>) itemMap.get("image_url");
                        if (imageUrlMap != null) {
                            ImageUrl imgUrl = new ImageUrl();
                            imgUrl.setUrl(imageUrlMap.get("url"));
                            contentItem.setImageUrl(imgUrl);
                        }
                    } else if ("video_url".equals(contentItem.getType())) {
                        @SuppressWarnings("unchecked")
                        Map<String, String> videoUrlMap = (Map<String, String>) itemMap.get("video_url");
                        if (videoUrlMap != null) {
                            VideoUrl vidUrl = new VideoUrl();
                            vidUrl.setUrl(videoUrlMap.get("url"));
                            contentItem.setVideoUrl(vidUrl);
                        }
                    }
                    this.contentList.add(contentItem);
                }
            } else {
                // 如果不是预期的格式，尝试转换为字符串
                this.content = contentValue.toString();
                this.contentList = null;
            }
        }
        else {
            // 其他类型，转换为字符串
            this.content = contentValue.toString();
            this.contentList = null;
        }
    }

    // ========== Getter和Setter方法 ==========
    
    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    /**
     * 获取content字段（内部使用，不参与JSON序列化）
     * 使用 @JsonIgnore 排除，避免与 @JsonGetter("content") 冲突
     */
    @JsonIgnore
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    /**
     * 设置contentList（内部使用，不参与JSON序列化）
     * 注意：不提供getContentList() getter，避免Jackson检测到与getContent()的冲突
     */
    public void setContentList(List<ContentItem> contentList) {
        this.contentList = contentList;
    }
    
    /**
     * 内部访问方法，用于业务逻辑，Jackson不会将其识别为属性
     * 方法名不是标准的getter格式（不以get开头），避免Jackson识别
     */
    @JsonIgnore
    public List<ContentItem> retrieveContentList() {
        return contentList;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public List<String> getVideoUrls() {
        return videoUrls;
    }

    public void setVideoUrls(List<String> videoUrls) {
        this.videoUrls = videoUrls;
    }

    public String getReasoningContent() {
        return reasoningContent;
    }

    public void setReasoningContent(String reasoningContent) {
        this.reasoningContent = reasoningContent;
    }

    /**
     * 构造函数
     *
     * @param role 消息角色
     * @param content 消息内容
     */
    public Message(String role, String content) {
        this.role = role;
        this.content = content;
    }

    /**
     * 创建系统消息
     *
     * @param content 消息内容
     * @return Message 实例
     */
    public static Message system(String content) {
        return new Message("system", content);
    }

    /**
     * 创建用户消息
     *
     * @param content 消息内容
     * @return Message 实例
     */
    public static Message user(String content) {
        return new Message("user", content);
    }

    /**
     * 创建助手消息
     *
     * @param content 消息内容
     * @return Message 实例
     */
    public static Message assistant(String content) {
        return new Message("assistant", content);
    }

    /**
     * 检查是否包含多模态内容
     *
     * @return true表示包含多模态内容
     */
    public boolean hasMultimodalContent() {
        return (imageUrls != null && !imageUrls.isEmpty()) ||
               (videoUrls != null && !videoUrls.isEmpty()) ||
               (contentList != null && !contentList.isEmpty());
    }

    /**
     * 内容项（用于多模态）
     */
    @lombok.Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ContentItem implements Serializable {
        private static final long serialVersionUID = 1L;

        /**
         * 内容类型：text/image_url/video_url
         */
        private String type;

        /**
         * 文本内容（当type为text时）
         */
        private String text;

        /**
         * 图片URL对象（当type为image_url时）
         */
        @JsonProperty("image_url")
        private ImageUrl imageUrl;

        /**
         * 视频URL对象（当type为video_url时）
         */
        @JsonProperty("video_url")
        private VideoUrl videoUrl;
    }

    /**
     * 图片URL对象
     */
    @lombok.Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ImageUrl implements Serializable {
        private static final long serialVersionUID = 1L;
        private String url;
    }

    /**
     * 视频URL对象
     */
    @lombok.Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class VideoUrl implements Serializable {
        private static final long serialVersionUID = 1L;
        private String url;
    }
}
