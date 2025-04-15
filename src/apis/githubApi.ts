import gqlmin from "gqlmin";
import { Octokit } from "octokit";

import type { GithubIssue, GithubIssueComment, GithubUser } from "@/types";

const {
  GITHUB_REPO: repo,
  GITHUB_REPO_ID: repoId,
  GITHUB_OWNER: owner,
} = import.meta.env;

let octokit = new Octokit();

export const setOctokitAuth = (accessToken: string) => {
  octokit = new Octokit({
    auth: accessToken,
  });
};

// 一个模板字符串辅助函数，让 octokit.graphql 支持模板字符语法
const graphql = (
  strings: TemplateStringsArray,
  variables?: Record<string, any>,
) => {
  return {
    query: import.meta.env.DEV ? strings[0] : gqlmin(strings[0]),
    // query: gqlmin(strings[0]),
    ...variables,
  };
};

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

export const getUserInfoApi = async () => {
  const res = await octokit.graphql<{
    viewer: GithubUser;
  }>(graphql`
    query {
      viewer {
        id
        login
        avatarUrl
      }
    }
  `);
  return res.viewer;
};

export const getIssueByLabelApi = async (
  labelName: string,
): Promise<GithubIssue | null> => {
  const res = await octokit.graphql<{
    repository: {
      issues: {
        nodes: Array<{
          id: string;
          number: number;
          comments: {
            totalCount: number;
          };
        }>;
      };
    };
  }>(graphql`
    query getIssueByLabel(
      $repo: String!
      $owner: String!
      $labelName: String!
    ) {
      repository(owner: $owner, name: $repo) {
        issues(filterBy: { labels: [$labelName] }, first: 1) {
          nodes {
            id
            number
            comments {
              totalCount
            }
          }
        }
      }
    }
    ${{
      owner,
      repo,
      labelName,
    }}
  `);
  const { nodes } = res.repository.issues;
  if (nodes.length > 0) {
    return {
      id: nodes[0].id,
      number: nodes[0].number,
      commentCount: nodes[0].comments.totalCount,
    };
  }
  return null;
};

export const loadIssueCommentListApi = async (query: {
  cursor?: string;
  issueNumber: number;
  pageSize?: number;
}) => {
  const res = await octokit.graphql<{
    repository: {
      issue: {
        comments: {
          pageInfo: {
            hasPreviousPage: boolean;
            startCursor: string;
          };
          nodes: Array<{
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
        };
      };
    };
  }>(graphql`
    query getIssueAndComments(
      $owner: String!
      $repo: String!
      $id: Int!
      $cursor: String
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
                pageInfo {
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
    ${{
      owner,
      repo,
      id: query.issueNumber,
      pageSize: query.pageSize,
      cursor: query.cursor,
    }}
  `);
  const { nodes: commentList, pageInfo } = res.repository.issue.comments;
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
        createdAt: item.createdAt,
      };
    }),
  };
};

export const createIssueCommentApi = async (query: {
  content: string;
  issueNodeId: GithubIssue["id"];
}): Promise<GithubIssueComment> => {
  const res = await octokit.graphql<{
    addComment: {
      commentEdge: {
        node: {
          id: string;
          author: {
            avatarUrl: string;
            login: string;
            url: string;
          };
          bodyHTML: string;
          body: string;
          createdAt: string;
        };
      };
    };
  }>(graphql`
    mutation AddCommentToIssue($issueNodeId: ID!, $content: String!) {
      addComment(input: { subjectId: $issueNodeId, body: $content }) {
        commentEdge {
          node {
            id
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
              pageInfo {
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
    ${{
      owner,
      repo,
      issueNodeId: query.issueNodeId,
      content: query.content,
    }}
  `);
  const { node } = res.addComment.commentEdge;
  return {
    id: node.id,
    body: node.body,
    body_html: node.bodyHTML,
    user: {
      login: node.author.login,
      avatar_url: node.author.avatarUrl,
      url: node.author.url,
    },
    createdAt: node.createdAt,
  };
};

export const createIssueLabelApi = async (labelName: string) => {
  const res = await octokit.graphql<{
    createLabel: {
      label: {
        id: number;
        name: string;
      };
    };
  }>(graphql`
    mutation CreateLabel($repoId: ID!, $labelName: String!, $color: String!) {
      createLabel(
        input: { repositoryId: $repoId, name: $labelName, color: $color }
      ) {
        label {
          id
          name
        }
      }
    }
    ${{
      repoId,
      labelName,
      color: "ededed",
    }}
  `);
  return res.createLabel.label;
};

export const getIssueLabelApi = async (labelName: string) => {
  const res = await octokit.graphql<{
    repository: {
      label?: {
        id: number;
        name: string;
      };
    };
  }>(graphql`
    query getIssueLabel($owner: String!, $repo: String!, $labelName: String!) {
      repository(owner: $owner, name: $repo) {
        label(name: $labelName) {
          id
          name
        }
      }
    }
    ${{
      owner,
      repo,
      labelName,
    }}
  `);
  return res.repository.label;
};

// TODO 添加另一个 gittalk 标签
export const createIssueApi = async (query: {
  title: string;
  body: string;
  labelName: string;
}) => {
  let label = await getIssueLabelApi(query.labelName);
  if (!label) {
    label = await createIssueLabelApi(query.labelName);
  }
  /* eslint-disable prettier/prettier */
  // 这里 prettier 会把 input 的逗号去掉，导致压缩会将参数不正确的拼在一起
  await octokit.graphql(graphql`
    mutation CreateIssue(
      $repoId: ID!
      $title: String!
      $body: String
      $labelIds: [ID!]
    ) {
      createIssue(
        input: {
          repositoryId: $repoId,
          title: $title,
          body: $body,
          labelIds: $labelIds,
        }
      ) {
        issue {
          id
        }
      }
    }
    ${{
      repoId,
      title: query.title,
      body: query.body,
      labelIds: [label.id],
    }}
  `);
  /* eslint-enable prettier/prettier */
  return await getIssueByLabelApi(label.name);
};
