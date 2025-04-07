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

export interface IndexPage {
  type: PageType.INDEX;
  todo: unknown;
}

// TODO
export interface OtherPage {
  type: PageType;
}

export type Page = IndexPage | MarkdownPage | OtherPage;

export interface GithubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: false;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  hireable: null;
  bio: string;
  twitter_username: null;
  notification_email: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GithubIssue {
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
  created_at: string;
}
