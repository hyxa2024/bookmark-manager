import { ParsedBookmark } from '@/lib/types';

type DomainRule = { domain: string; category: string };
type KeywordRule = { category: string; keywords: string[] };

// 二级域名匹配规则：域名直接映射到分类
const DOMAIN_RULES: DomainRule[] = [
  // 技术
  { domain: 'github.com', category: '技术' },
  { domain: 'stackoverflow.com', category: '技术' },
  { domain: 'mozilla.org', category: '技术' },
  { domain: 'npmjs.com', category: '技术' },
  { domain: 'pypi.org', category: '技术' },
  { domain: 'docs.python.org', category: '技术' },
  { domain: 'react.dev', category: '技术' },
  { domain: 'vuejs.org', category: '技术' },
  { domain: 'angular.io', category: '技术' },
  { domain: 'nextjs.org', category: '技术' },
  { domain: 'tailwindcss.com', category: '技术' },
  { domain: 'typescriptlang.org', category: '技术' },
  { domain: 'rust-lang.org', category: '技术' },
  { domain: 'go.dev', category: '技术' },
  { domain: 'jetbrains.com', category: '技术' },
  { domain: 'visualstudio.com', category: '技术' },
  { domain: 'code.visualstudio.com', category: '技术' },
  { domain: 'leetcode.com', category: '技术' },
  { domain: 'hackerrank.com', category: '技术' },
  { domain: 'segmentfault.com', category: '技术' },
  { domain: 'juejin.cn', category: '技术' },
  { domain: 'cnblogs.com', category: '技术' },
  { domain: 'csdn.net', category: '技术' },
  { domain: 'zhihu.com', category: '技术' },
  { domain: 'infoq.cn', category: '技术' }
];

// 关键词匹配规则：标题中包含关键字映射到分类
const KEYWORD_RULES: KeywordRule[] = [
  {
    category: '技术',
    keywords: ['react','vue','angular','javascript','typescript','python','rust','golang','api','sdk','github','npm','webpack','docker','kubernetes','devops','css','html','node','编程','开发','前端','后端','算法','数据库','服务器','框架']
  },
  {
    category: '设计',
    keywords: ['design','ui','ux','figma','sketch','设计','配色','字体','logo','icon','插画']
  },
  {
    category: '工具',
    keywords: ['tool','chrome','extension','plugin','工具','效率','插件','扩展','自动化','笔记','日历']
  },
  {
    category: '阅读',
    keywords: ['blog','article','book','reading','文章','博客','书籍','阅读','读书']
  }
];

/**
 * 解析域名，返回主域名（不带子域名的部分）
 * 简单实现，适用于浏览器 URL 的 host 提取
 */
function extractHostDomain(url: string): string {
  try {
    const host = new URL(url).host;
    // 移除前缀 www.
    return host.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * 基于规则的单个书签分类
 * @param title 书签标题
 * @param url 书签 URL
 * @returns 分类名称，默认 "其他"
 */
export function classifyBookmark(title: string, url: string): string {
  if (!url) return '其他';
  const domain = extractHostDomain(url);
  if (domain) {
    for (const r of DOMAIN_RULES) {
      if (domain === r.domain || domain.endsWith('.' + r.domain) || domain.includes(r.domain)) {
        return r.category;
      }
    }
  }

  const lowerTitle = (title ?? '').toLowerCase();
  for (const r of KEYWORD_RULES) {
    for (const kw of r.keywords) {
      if (lowerTitle.includes(kw)) {
        return r.category;
      }
    }
  }

  return '其他';
}

/**
 * 批量分类书签
 * @param bookmarks 待分类的书签数组
 * @returns 已更新 category 字段的书签数组
 */
export function classifyBookmarks(bookmarks: ParsedBookmark[]): ParsedBookmark[] {
  return bookmarks.map(b => ({
    ...b,
    category: classifyBookmark(b.title, b.url)
  }));
}
