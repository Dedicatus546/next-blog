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
      id: data[0].id,
      nodeId: data[0].node_id,
      number: data[0].number,
      commentCount: data[0].comments,
    };
  }
  return null;
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

export const createIssueCommentApi = async (query: {
  content: string;
  issueNodeId: GithubIssue["nodeId"];
}): Promise<GithubIssueComment> => {
  const res = await octokit.graphql({
    query: `
      mutation AddCommentToIssue($issueNodeId: ID!, $content: String!) {
        addComment(input: {
          subjectId: $issueNodeId,
          body: $content
        }) {
          commentEdge {
            node {
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
    `,
    operationName: "AddCommentToIssue",
    owner: import.meta.env.GITHUB_OWNER,
    repo: import.meta.env.GITHUB_REPO,
    issueNodeId: query.issueNodeId,
    content: query.content,
  });
  const node = (res as any).addComment.commentEdge.node;
  return {
    id: node.id,
    body: node.body,
    body_html: node.bodyHTML,
    user: {
      login: node.author.login,
      avatar_url: node.author.avatarUrl,
      url: node.author.url,
    },
    created_at: node.createdAt,
  };
};
