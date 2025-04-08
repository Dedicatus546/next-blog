import type { RaidoModelValue } from "@/types/radio";

export const RadioInjectKey = Symbol() as InjectionKey<{
  getModelValue: () => RaidoModelValue;
  onChange: (modelValue: RaidoModelValue) => void;
}>;
