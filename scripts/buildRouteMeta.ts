import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { type EditableTreeNode } from "unplugin-vue-router";
import { getUnixTime } from "date-fns";
import { basename, extname } from "node:path";
import grayMatter from "gray-matter";
import { MarkdownPage, PageType } from "../src/types";
import { type MarkdownItAsync } from "markdown-it-async";

// TODO SHA1 hash of filename (same as :title) and date (12-hexadecimal)
export const buildRouteMeta = async (
  route: EditableTreeNode,
  markdownItAsyncInstance: MarkdownItAsync,
) => {
  const path = route.components.get("default");
  if (!path) {
    return;
  }
  const filename = basename(path, extname(path));
  if (path.endsWith(".md")) {
    const file = readFileSync(path, "utf-8");
    const { data, excerpt } = grayMatter(file, {
      excerpt: true,
      excerpt_separator: "<!-- more -->",
    });
    const markdownPage = await normalizeMarkdownPageMeta(
      path,
      data,
      excerpt,
      markdownItAsyncInstance,
    );
    const { date } = markdownPage;
    const hash = createHash("sha1")
      .update(filename + date)
      .digest("hex")
      .slice(0, 12);
    // TODO
    // 目前 path 不支持相对路径，等待以下 PR 合并
    // 预期的写法
    // route.path = route.path.replace(/\/[^\/]+$/, "/" + hash)
    // 这样只会改变文件的最后一段
    // https://github.com/posva/unplugin-vue-router/pull/519
    // 不要在 src/pages 下使用嵌套路径编写 md ，vue 文件除外。
    route.path = `/${hash}`;
    markdownPage.path = route.path;
    route.addToMeta({
      page: markdownPage,
    });
  } else {
    route.addToMeta({
      page: {
        type: route.name.slice(1),
      },
    });
  }
};

const normalizeMarkdownPageMeta = async (
  path: string,
  frontmatter: Record<string, any>,
  excerpt: string | undefined,
  markdownItAsyncInstance: MarkdownItAsync,
): Promise<MarkdownPage> => {
  const date = getUnixTime(frontmatter.date);
  const updated = getUnixTime(frontmatter.updated);
  const filename = basename(path, extname(path));
  const hash = createHash("sha1")
    .update(filename + date)
    .digest("hex")
    .slice(0, 12);
  return {
    path: "",
    title: frontmatter.title,
    excerpt: markdownItAsyncInstance.render(excerpt ?? ""),
    hash,
    key: frontmatter.key,
    date,
    updated,
    tags: frontmatter.tags ?? [],
    categories: frontmatter.categories ?? [],
    type: PageType.MD,
  };
};
