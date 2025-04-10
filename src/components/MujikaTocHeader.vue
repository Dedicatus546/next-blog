<script setup lang="ts">
import { usePostTocList } from "@/composables/usePostTocList";

const { tocList } = usePostTocList();
const showToc = ref(false);
</script>

<template>
  <MujikaCard top-2 sticky overflow-initial>
    <div relative>
      <div cursor-pointer @click="showToc = !showToc">文章目录</div>
      <Transition name="flyout">
        <div absolute z-9999 top="100%" v-show="showToc">
          <MujikaCard mt-2>
            <MujikaTocList :list="tocList" />
          </MujikaCard>
        </div>
      </Transition>
    </div>
  </MujikaCard>
</template>
