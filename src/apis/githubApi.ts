import type { Arrayable } from "@vueuse/core";
import { Octokit } from "octokit";

import type { GithubIssue, GithubIssueComment, GithubUser } from "@/types";

let octokit = new Octokit();

export const getAccessTokenApi = async (query: {
  code: string;
  clientId: string;
  clientSecret: string;
}) => {
  const response = await fetch(
    "https://strong-caramel-969805.netlify.app/github_access_token",
    {
      method: "POST",
      body: JSON.stringify({
        client_id: query.clientId,
        client_secret: query.clientSecret,
        code: query.code,
      }),
      headers: {
        accept: "application/json",
      },
    },
  );

  return response.json() as Promise<{
    access_token: string;
    scope: string;
    token_type: string;
  }>;
};

export const getUserInfoApi = async (accessToken: string) => {
  const res = await fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      authorization: `bearer ${accessToken}`,
    },
  });
  return res.json() as Promise<GithubUser>;
};

export const setOctokitAuth = (accessToken: string) => {
  octokit = new Octokit({
    auth: accessToken,
  });
};

export const getIssueByLabelApi = async (
  labels: Arrayable<number | string>,
): Promise<GithubIssue | null> => {
  const { data } = await octokit.rest.issues.listForRepo({
    owner: import.meta.env.GITHUB_OWNER,
    repo: import.meta.env.GITHUB_REPO,
    labels: (Array.isArray(labels) ? labels : [labels]).join(","),
    state: "all",
    per_page: 1,
  });
  if (data.length > 0) {
    return {
      number: data[0].number,
      commentCount: data[0].comments,
    };
  }
  return null;
};

export const getIssueCommentListApi = async (query: {
  issueNumber: number;
  page?: number;
  pageSize?: number;
}) => {
  const { issueNumber, page = 1, pageSize = 10 } = query;
  const { data } = await octokit.rest.issues.listComments({
    owner: import.meta.env.GITHUB_OWNER,
    repo: import.meta.env.GITHUB_REPO,
    issue_number: issueNumber,
    per_page: pageSize,
    page,
    sort: "updated",
    direction: "desc",
    headers: {
      // 返回 body_html
      accept: "application/vnd.github.html+json",
    },
  });
  return data.map((item) => {
    return {
      id: item.id,
      node_id: item.node_id,
      url: item.url,
      body: item.body,
      body_text: item.body_text,
      body_html: item.body_html,
      html_url: item.html_url,
      user: item.user
        ? {
            name: item.user.name,
            login: item.user.login,
            id: item.user.id,
            node_id: item.user.node_id,
            avatar_url: item.user.avatar_url,
            url: item.user.url,
            html_url: item.user.html_url,
          }
        : null,
      created_at: item.created_at,
      updated_at: item.updated_at,
      issue_url: item.issue_url,
    };
  });
};

export const loadIssueCommentListApi = async (query: {
  cursor?: string;
  issueNumber: number;
  pageSize?: number;
}) => {
  const res = await octokit.graphql({
    query: `
      query getIssueAndComments(
        $owner: String!,
        $repo: String!,
        $id: Int!,
        $cursor: String,
        $pageSize: Int!
      ) {
        repository(owner: $owner, name: $repo) {
          issue(number: $id) {
            title
            url
            bodyHTML
            createdAt
            comments(last: $pageSize, before: $cursor) {
              totalCount
              pageInfo {
                hasPreviousPage
                startCursor
              }
              nodes {
                id
                databaseId
                author {
                  avatarUrl
                  login
                  url
                }
                bodyHTML
                body
                createdAt
                reactions(first: 100, content: HEART) {
                  totalCount
                  viewerHasReacted
                  pageInfo{
                    hasNextPage
                  }
                  nodes {
                    id
                    databaseId
                    user {
                      login
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
    operationName: "getIssueAndComments",
    owner: import.meta.env.GITHUB_OWNER,
    repo: import.meta.env.GITHUB_REPO,
    id: query.issueNumber,
    pageSize: query.pageSize,
    cursor: query.cursor,
  });
  const { nodes, pageInfo } = (res as any).repository.issue.comments;
  const commentList = nodes as Array<{
    id: string;
    databaseId: number;
    author: {
      avatarUrl: string;
      login: string;
      url: string;
    };
    bodyHTML: string;
    body: string;
    createdAt: string;
    reactions: {
      totalCount: number;
      viewerHasReacted: boolean;
      pageInfo: {
        hasNextPage: boolean;
      };
      nodes: [
        {
          id: string;
          databaseId: number;
          user: {
            login: string;
          };
        },
      ];
    };
  }>;
  return {
    pageInfo: {
      cursor: pageInfo.startCursor,
      hasPreviousPage: pageInfo.hasPreviousPage,
    },
    list: commentList.reverse().map<GithubIssueComment>((item) => {
      return {
        id: item.id,
        body: item.body,
        body_html: item.bodyHTML,
        user: {
          login: item.author.login,
          avatar_url: item.author.avatarUrl,
          url: item.author.url,
        },
        created_at: item.createdAt,
      };
    }),
  };
};
