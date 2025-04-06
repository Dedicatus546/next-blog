import { MarkdownItAsync } from "markdown-it-async";
import grayMatter from "gray-matter";

export const markdownFrontmatterPlugin = (md: MarkdownItAsync) => {
  const render = md.render.bind(md);
  md.render = (src, env = {}) => {
    const {
      data,
      content,
      excerpt = "",
    } = grayMatter(src, {
      excerpt: true,
      excerpt_separator: "<!-- more -->",
    });
    env.content = content;
    env.frontmatter = {
      // allow providing default value
      ...env.frontmatter,
      ...data,
      wordCount: content.length,
    };
    env.excerpt = render(excerpt, { ...env });
    return render(content, env);
  };
};
