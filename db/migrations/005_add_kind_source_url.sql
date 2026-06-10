-- Migration: add content kind (post vs clipping) and source URL for clippings.
-- kind='post' 是你亲手写的，进首页主线；kind='clipping' 是收藏的外部内容，进剪报区。
-- source_url 存收藏内容的原文出处，供详情页与剪报列表跳回源头。

ALTER TABLE posts ADD COLUMN kind TEXT DEFAULT 'post';
ALTER TABLE posts ADD COLUMN source_url TEXT;
