import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { type EditableTreeNode } from "unplugin-vue-router";
import { getUnixTime } from "date-fns";
import { basename, extname } from "node:path";
import grayMatter from "gray-matter";
import { MarkdownPage, PageType } from "../src/types";
import { type MarkdownItAsync } from "markdown-it-async";

const pageMetaMap: Record<string, { title: string }> = {
  index: {
    title: "",
  },
  about: {
    title: "关于",
  },
  category: {
    title: "分类",
  },
  tag: {
    title: "标签",
  },
  archive: {
    title: "归档",
  },
};

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
      file,
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
        ...pageMetaMap[filename],
        type: route.name.slice(1),
      },
    });
  }
};

const normalizeMarkdownPageMeta = async (
  path: string,
  content: string,
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
    top: frontmatter.top ?? 0,
    wordCount: getWordCount(content),
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

const getWordCount = (content: string) => {
  const linkRegex = /\]\((.*?)\)/g;
  let wordCount = 0;
  // 按行处理
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const processedLine = line.replaceAll(linkRegex, "]");
    const words = processedLine.match(/(\p{Script=Han}|[a-zA-Z]+)/gu) ?? [];
    wordCount += words.length;
  }
  return wordCount;
};
