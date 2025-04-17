export enum PageType {
  MD = "md",
  TAG = "tag",
  ARCHIVE = "archive",
  INDEX = "index",
  PAGINATION = "pagination",
}

export interface BasePage {
  title: string;
}

export interface MarkdownPage extends BasePage {
  path: string;
  excerpt: string;
  top: number;
  wordCount: number;
  hash: string;
  key: number;
  date: number;
  updated: number;
  tags: Array<string>;
  categories: Array<string>;
  type: PageType.MD;
}

export interface CustomPage extends BasePage {
  type: Omit<PageType, PageType.MD>;
}

export type Page = MarkdownPage | CustomPage;

export interface GithubUser {
  login: string;
  id: number;
  avatarUrl: string;
}

export interface GithubIssue {
  id: string;
  number: number;
  commentCount: number;
}

export interface GithubIssueComment {
  id: string;
  body: string;
  body_html: string;
  user: {
    login: string;
    avatar_url: string;
    url: string;
  };
  createdAt: string;
}
