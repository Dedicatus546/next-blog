---
title: 一个快 10 倍的 TypeScript
tags:
  - TypeScript
categories:
  - 编程
date: 2025-03-13 10:52:54
updated: 2025-03-21 23:36:57
key: 1741834375
---




# 前言

原文地址：[A 10x Faster TypeScript](https://devblogs.microsoft.com/typescript/typescript-native-port/?ocid=typescript_eml_tnp_autoid25_title)

<!-- more -->

没想到 TypeScript 最终放弃了使用 JavaScript 来实现，转而采用了对手 Google 的 Golang ，而不是自家的 C# ，属实是没想到。

不过只要有性能提升我还是很高兴的，用什么语言写和我关系不大。

# 正文

今天我们激动地宣布下一步我们将从根本上提升 TypeScript 的性能。

<iframe width="481" height="270" src="https://www.youtube.com/embed/pNlq-EVld70" title="A 10x faster TypeScript" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

TypeScript 的核心价值主张是为开发者提供一个出色的开发体验。随着代码库的增长， TypeScript 自身的价值也随之增长。但在很多情况下 TypeScript 无法适应那些非常巨大的代码库。大项目的开发者会经历长时间的加载和检查，不得不在合理的编辑器启动时间和获得源代码的完整视图的情况之间做出选择。我们明白开发者喜欢 0 延迟地自信地重命名变量，查找一个特定函数的所有引用，以及能够简便地在代码库中进行导航等等。 AI 赋能的全新体验得益于大量的语义信息，而这些信息需要在更严格的延迟限制下才可用。我们也想加快命令行的构建速度，以此验证整个代码库处于良好的状态。

为了实现这些目标，我们已开始致力于 TypeScript 编译器和工具的 native 迁移。 native 实现将会极大提升编辑器的启动速度，缩短大约 10 倍构建时间，并且大幅减少内存占用。通过迁移当前的代码库，我们预计在 2025 中旬能够提供一个 native 实现的，带有命令行检查的 `tsc` 的预览版本。并且在年底前推出项目构建和语言服务的功能完整的解决方案。

你可以在新的[项目仓库](https://github.com/microsoft/typescript-go)中构建和执行 Go 代码，它与现有的 TypeScript 代码库采用相通的许可。阅读 README 文件来了解如何构建和执行 `tsc` 和相应的语言服务，并且可以知道当前已实现部分的目录。我们会在新功能通过测试可用后发布定期的升级。

## 有多快

native 实现已经能够加载许多受欢迎的项目了，包括 [TypeScript 编译器](https://github.com/microsoft/TypeScript/tree/main/src/compiler)自身。下面是 Github 上一些不同大小的受欢迎的代码库执行 `tsc` 所花费的时间。

| 代码库     | 大小（代码行数） | 当前版本 | native 版本 | 速度提升 |
| ---------- | ---------------- | -------- | ----------- | -------- |
| [VS Code](https://github.com/microsoft/vscode)    | 1505000          | 77.8s    | 7.5s        | 10.4x    |
| [Playwright](https://github.com/microsoft/playwright) | 356000           | 11.1s    | 1.1s        | 10.1x    |
| [TypeORM](https://github.com/typeorm/typeorm)    | 270000           | 17.5s    | 1.3s        | 13.5x    |
| [date-fns](https://github.com/date-fns/date-fns)    | 104000          | 6.5s    | 70.7s        | 9.5x    |
| [tRPC](https://github.com/trpc/trpc)    | 18000          | 5.5s    | 0.6s        | 9.1x    |
| [rxjs](https://github.com/ReactiveX/rxjs)    | 2100          | 1.1s    | 0.1s        | 11.0x    |

虽然还未完整实现，但这些数字代表了检查大多数代码库时所能看到的性能的数量级提升。

我们对这一大幅度的速度提升所创造的机会感到非常兴奋。曾经遥不可及的功能变得触手可及。这个 native 迁移的版本将能够为整个项目中提供立即，全面的错误列表，支持更先进的重构，并且让先前因昂贵的计算成本而无法实现的深入洞察成为可能。这一基础超越了现今的开发体验，而且使得下一代 AI 工具能够增强开发，并为学习，适应和改善编码体验的新工具的开发提供动力。

## 编辑器速度

许多开发者把时间花在了编辑器上，所以编辑器的性能是非常重要的。我们想要编辑器在任何情况下加载大项目时能够快速编辑，快速响应。现代的编辑器，比如 VS 和 VSCode ，只要底层的语言服务够快的话，他们就能有出色的性能表现。在 native 实现下，将能够极大地加快编辑体验。

再一次使用 VSCode 的代码库作为基准，在一台高性能的电脑上，当前编辑器加载整个项目大约花费了 9.6 秒，如果使用 native 的语言服务，则这个时间会下降到大约 1.2 秒，在编辑器场景下，加载项目的时间有着 8 倍的提升。这意味着在任何的 TypeScript 代码库中，打开编辑器到开始键入第一个字母的间隔变得更短了。我们预计所有的项目都可以观测到加载时的性能提升。

总的内存占用也大约为目前版本的一半，即使我们还没有积极地探讨优化内存的部分以及期望实现更深远的改进。编辑器对所有语言服务的操作（包括完成列表，快速提示，转到定义，查找所有引用等）的响应能力的速度也会显著提升。我们还将转向语言服务协议（LSP），一项长期的基础设施，以便我们的实现能更好地与其他语言对齐。

## 版本路线

最近的 TypeScript 的 release 版本为 5.8 ，5.9 也即将发布。基于 JS 的代码库将会继续开发到 6.x 系列， TypeScript 6.0 将会引入一些弃用项和破坏性变更来和即将到来的 native 代码库对齐。

当 native 代码库的可用程度达到和当前的 TypeScript 一致时，我们就会发布 TypeScript 7.0 。目前该项目仍在开发中，我们将会及时宣布稳定性和功能里程碑。

为了清晰起见，我们简单地称呼为 TypeScript6(JS) 和 TypeScript7(native) ，这是可预见未来的专门术语。你可能也注意到在内部的讨论或者代码评论中我们参考了 Strada （原始的 TypeScript 代号）和 Corsa （这项工作的代号）。

虽然一些项目能够在 TypeScript7 发布后就切换，但是某些项目可能依赖了某些 API 功能，旧的配置方式，或者其他需要使用 TypeScript6 的限制。考虑到 TypeScript 在 JS 开发生态系统的重要角色，我们仍然会维护 6.x 的 JS 的代码库直到 TypeScript 7+ 足够的成熟并且广泛被使用。

我们的长期目标是让这些版本尽可能地保持一致，这样一旦它满足你的要求，你就可以立刻升级到 TypeScript 7 ，或者有必要的情况下也可以回退为 TypeScript 6 。

## 下一步

在接下来的几个月里，我们会分享更多这项令人激动的工作的信息，包括更深入地了解性能，新的编译器 API ，LSP 等等。我们在 Github 仓库中编写了一些 [FAQ](https://github.com/microsoft/typescript-go/discussions/categories/faqs) 来解答一些我们预测你可能会遇到的问题。我们也邀请参加在 TypeScript 社区 Discord 的 AMA ，时间为 3 月 13 日的 10 AM PDT（5 PM UTC）。

10 倍的性能提升代表着 TypeScript 和 JavaScript 开发体验的极大飞跃，因此我们希望你和我们一样对这项工作充满热情！