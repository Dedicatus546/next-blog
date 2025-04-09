<script setup lang="ts">
import { usePostPrevAndNextPost } from "@/composables/usePostPrevAndNextPost";
import type { MarkdownPage } from "@/types";
import { navigate } from "@/utils/headerAnchor";

import MujikaCard from "./MujikaCard.vue";

const router = useRouter();
const { meta } = useRoute();
const page = computed(() => meta.page as MarkdownPage);
const { prev, next } = usePostPrevAndNextPost(() => page.value.hash);

useEventListener(window, "hashchange", navigate);
const mujikaDocContentRef = useTemplateRef("mujikaDocContentRef");
useEventListener(mujikaDocContentRef, "click", (e) => {
  const target = e.target as HTMLElement;
  const link = target.closest("a");
  if (
    !e.defaultPrevented &&
    link &&
    e.button === 0 &&
    link.target !== "_blank" &&
    link.rel !== "external" &&
    !link.download &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.shiftKey &&
    !e.altKey
  ) {
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    e.preventDefault();
    const { pathname, hash } = url;
    if (hash && (!pathname || pathname === location.pathname)) {
      window.history.replaceState({}, "", hash);
      navigate();
    } else {
      router.push({ path: pathname, hash });
    }
  }
});

onMounted(() => {
  const doNavigate = () => {
    if (!navigate()) {
      setTimeout(doNavigate, 100);
    }
  };
  setTimeout(doNavigate, 1);
});
</script>

<template>
  <div flex gap-2 items-start>
    <div flex="~ col grow" gap-2 min-w-0>
      <MujikaCard :padding-level="2">
        <div flex="~ col" mb-4 gap-4>
          <h1 text="34px center">{{ page.title }}</h1>
        </div>
        <MujikaPostMeta :page="page"></MujikaPostMeta>
        <div class="mujika-doc-content" ref="mujikaDocContentRef">
          <slot />
        </div>
        <div flex="~ wrap" mt-8 gap-4 justify-center>
          <div v-for="item of page.tags" :key="item">#{{ item }}</div>
        </div>
      </MujikaCard>
      <MujikaCard :padding-level="2" v-if="prev || next">
        <div flex>
          <RouterLink :to="prev.path" v-if="prev">
            <i class="i-mi:chevron-left" mr-1></i>
            <span>{{ prev.title }}</span>
          </RouterLink>
          <RouterLink :to="next.path" ml-auto v-if="next">
            <span>{{ next.title }}</span>
            <i class="i-mi:chevron-right" ml-1></i>
          </RouterLink>
        </div>
      </MujikaCard>
      <MujikaGitTalk />
    </div>
    <MujikaTocAside />
  </div>
</template>

<style scoped lang="scss"></style>
