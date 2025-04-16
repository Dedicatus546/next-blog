<script setup lang="ts">
const route = useRoute();
const randomSignList = ref([
  {
    content:
      "如果我和狗一样有尾巴的话，一定会藏不住这份喜悦，而尾巴一直摇个不停吧。",
    from: "《秒速五厘米》",
  },
  {
    content: "見えない感情が押し寄せるたびに 幸せになっていいのだろうかと",
    from: "《Wave》（我的妻子没有感情）",
  },
  {
    content: "あたしが隣にいるうちに 愛をもっとあたしにください",
    from: "《あたしが隣にいるうちに》（盾之勇者成名录）",
  },
  {
    content:
      "我们总这样重复分离 却要重新开始 相互送别对方 说着来世再见 再次失忆着相聚",
    from: "《我记得》",
  },
]);
const randomSignIndex = ref(0);
watch(
  () => route.name,
  () => {
    randomSignIndex.value = Math.floor(
      Math.random() * randomSignList.value.length,
    );
  },
);
</script>

<template>
  <footer
    class="mujika-footer"
    px-4
    py-6
    bg="[var(--mygo-c-bg)]"
    flex="~ col shrink-0"
    gap-2
    items-center
  >
    <div flex items-center>
      <span>由&nbsp;</span>
      <i class="i-logos:vue"></i>
      <span>&nbsp;+&nbsp;</span>
      <i class="i-logos:vitejs"></i>
      <span>&nbsp;驱动</span>
    </div>
    <div text-center>
      <a
        target="_blank"
        href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
      >
        CC BY-NC-SA 4.0
      </a>
      2021 - PRESENT © Dedicatus545
    </div>
    <div text="[var(--mygo-c-text-2)]" text-center>
      {{ randomSignList[randomSignIndex].content }}
      -
      {{ randomSignList[randomSignIndex].from }}
    </div>
  </footer>
</template>

<style scoped lang="scss">
.mujika-footer {
  border-top: 1px solid var(--mygo-c-border);
}
</style>
