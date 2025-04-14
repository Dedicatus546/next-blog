import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type EditableTreeNode } from "unplugin-vue-router";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const insertPageRoutes = (
  root: EditableTreeNode,
  pageSize: number,
  dir: string,
) => {
  const pathList = readdirSync(resolve(__dirname, "..", dir));
  const total = pathList.length;
  const pageCount = Math.ceil(total / pageSize);
  for (let i = 1; i <= pageCount; i++) {
    const node = root.insert(`/pages/${i}`, "/src/pages/index.vue");
    node.addToMeta({
      page: {
        type: "",
      },
    });
  }
};
