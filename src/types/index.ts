export enum PageType {
  MD = "md",
  TAG = "tag",
  ARCHIVE = "archive",
  INDEX = "index",
}

export interface MarkdownPage {
  path: string;
  title: string;
  excerpt: string;
  hash: string;
  key: number;
  date: number;
  updated: number;
  tags: Array<string>;
  categories: Array<string>;
  type: PageType.MD;
}

export interface IndexPage {
  type: PageType.INDEX;
  todo: unknown;
}

// TODO
export interface OtherPage {
  type: PageType;
}

export type Page = IndexPage | MarkdownPage | OtherPage;
