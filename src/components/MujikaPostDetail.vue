<script setup lang="ts">
import { usePost } from "@/composables/usePost";
import { usePostPrevAndNextPost } from "@/composables/usePostPrevAndNextPost";
import { navigate } from "@/utils/headerAnchor";

import MujikaCard from "./MujikaCard.vue";

const router = useRouter();

const post = usePost();
const { prev, next } = usePostPrevAndNextPost(() => post.value.hash);

const mujikaDocContentRef = useTemplateRef("mujikaDocContentRef");

onMounted(() => {
  useEventListener(window, "hashchange", navigate);
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
          <h1 text="34px center">{{ post.title }}</h1>
        </div>
        <MujikaPostMeta :page="post"></MujikaPostMeta>
        <div class="mujika-doc-content" ref="mujikaDocContentRef">
          <slot />
        </div>
        <div
          flex="~ wrap"
          text="[var(--mygo-c-text-2)]"
          mt-8
          gap-4
          justify-center
        >
          <div v-for="item of post.tags" :key="item">#{{ item }}</div>
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
      <MujikaGitTalk :key="post.hash" />
    </div>
    <MujikaTocAside un-hidden lg:block />
    <Teleport to="body">
      <MujikaFab />
    </Teleport>
  </div>
</template>

<style scoped lang="scss"></style>
