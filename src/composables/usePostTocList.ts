const ignoreRE = /\b(?:header-anchor|ignore-header)\b/;

export interface TocItem {
  id: number;
  level: number;
  title: string;
  element: HTMLElement;
  link: string;
  children: TocItem[];
}

export function usePostTocList() {
  const tocList = ref<TocItem[]>([]);
  const route = useRoute();

  const buildTocList = () => {
    const headingList = Array.from(
      document.querySelectorAll(
        ".kan-doc :where(h1, h2, h3, h4, h5, h6)",
      ) as NodeListOf<HTMLAnchorElement>,
    )
      .filter((el) => el.id && el.hasChildNodes())
      .map((el) => {
        const level = Number.parseInt(el.tagName[1]);
        return {
          element: el as HTMLHeadElement,
          title: serializeHeader(el),
          link: "#" + el.id,
          level,
        };
      });

    // reset
    const _tocList: TocItem[] = [];
    const stack: TocItem[] = [];

    headingList.forEach((heading, index) => {
      let parent = stack[stack.length - 1];

      while (parent && parent.level >= heading.level) {
        stack.pop();
        parent = stack[stack.length - 1];
      }

      const node: TocItem = {
        id: index,
        ...heading,
        children: [],
      };

      if (parent) {
        parent.children.push(node);
      } else {
        _tocList.push(node);
      }

      stack.push(node);
    });

    tocList.value = _tocList;
  };

  onMounted(() => {
    watch(
      () => route.path,
      () => {
        buildTocList();
      },
      {
        immediate: true,
      },
    );
  });

  return {
    tocList,
  };
}

const serializeHeader = (h: Element) => {
  let ret = "";
  for (const node of h.childNodes) {
    if (node.nodeType === 1) {
      if (ignoreRE.test((node as Element).className)) {
        continue;
      }
      ret += node.textContent;
    } else if (node.nodeType === 3) {
      ret += node.textContent;
    }
  }
  return ret.trim();
};
