export interface Frontmatter {
  title: string;
  key: number;
  date: string;
  updated: string;
  tags: Array<string>;
  categories: Array<string>;
}

export interface PostListItem extends Frontmatter {
  id: number;
  excerpt?: string;
  url: string;
}

export interface PostDetail extends PostListItem {
  prev?: {
    url: string;
    text: string;
  };
  next?: {
    url: string;
    text: string;
  };
}
