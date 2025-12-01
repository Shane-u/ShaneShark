/**
 * QA知识库类型定义
 */

export interface QaInfo {
  id: string
  question: string
  answer: string
  tag: string
  isHot: number
  viewCount: number
  createTime: string
  updateTime: string
}

export interface QaListResponse {
  records: QaInfo[]
  total: number
  current: number
  size: number
}

export interface QaQueryParams {
  current?: number
  pageSize?: number
  tag?: string
  keyword?: string
  isHot?: number
}

export interface QaAddRequest {
  question: string
  answer: string
  tag: string
  isHot?: number
}

export interface QaUpdateRequest {
  id: string
  question?: string
  answer?: string
  tag?: string
  isHot?: number
}

export interface AdminCheckRequest {
  password: string
}

// 预设标签列表
export const QA_TAGS = [
  // 简历优化
  '简历项目经验撰写',
  '简历技能排版',
  '简历关键词匹配',
  '面试简历避坑',
  // 技术题目
  '算法题解',
  '编程语法题',
  '框架使用题',
  '数据库题目',
  // 日常问题
  '工具使用技巧',
  '系统配置踩坑',
  '效率提升方法',
  '软件安装教程',
  // 面试问答
  '技术面试题',
  '行为面试题',
  '薪资谈判技巧',
  '面试流程攻略',
  // 其他
  '学习规划',
  '资源推荐',
  '职场技巧',
] as const

export type QaTag = typeof QA_TAGS[number]

