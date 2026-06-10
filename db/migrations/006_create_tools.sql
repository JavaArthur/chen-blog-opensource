-- Migration: 工具墙（收藏的小工具/仓库/Mac 软件/任意好东西）
-- type 字段做拓展性：url（网页工具）/ repo（代码仓库）/ mac-app（Mac 软件）/ other（不局限于 URL）
-- url 可空，因为 type='other' 的东西未必有链接（如某个本地脚本、某本书）

CREATE TABLE IF NOT EXISTS tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT,                          -- 可空：other 类型未必有链接
  type TEXT NOT NULL DEFAULT 'url',  -- url / repo / mac-app / other
  description TEXT,                  -- 一句话：我为什么收它
  tags TEXT,                         -- JSON 数组字符串
  icon TEXT,                         -- favicon / 截图 URL，可空
  is_pinned INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_tools_type ON tools(type);
CREATE INDEX IF NOT EXISTS idx_tools_pinned ON tools(is_pinned DESC, sort_order ASC, created_at DESC);
