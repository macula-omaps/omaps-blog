---
title: MCP 工具总线：我的疑问、方案取舍与落地边界
date: 2026-11-21T21:00:00+08:00
description: 一份第一视角的 MCP 思考记录：我最初的疑问（REST 加胶水够不够）、被说服的关键论据、stdio 与自定义 URI 的两处认知修正、多用户架构下身份与权限的选型，以及我对 elicitation「协议给了能力但我决定不用」的判断。
categories:
  - AI 原生研发
tags:
  - MCP
  - Agent
  - 工具调用
  - 协议设计
  - REST
  - 鉴权设计
toc: true
---

> 这是一份思考记录，不是科普。背景：我正在给自己的业务系统接 Agent 通道，绕不开 MCP（Model Context Protocol，模型上下文协议）的选型。整晚我真正在意的不是「MCP 是什么」，而是三个问题——它凭什么值得多出一条协议？多用户落地要付出什么？它给的能力哪些我该用、哪些该退回去？

**先给我自己现在的四个判断**：

1. **我接受 MCP，但不是因为功能清单**。说服我的只有一条分界线：调用方是开发者还是模型。OpenAPI 有两块结构性补不上——按登录用户动态过滤的资源视图、标准化的双向交互；
2. **真正的选型分水岭在传输层**：多用户架构必须 Streamable HTTP，stdio 的身份模型撑不住并发，这个结论比我预想的更早到来；
3. **最让我踏实的反而是「MCP 协议本身不做权限隔离」**——我原有的安全闸一个不用改，协议没有偷偷替我做任何安全决定；
4. **elicitation 我划在边界外**：协议给了这个能力，我的架构决定不用它，人工确认上移到编排层。

## 一、我的疑问：REST 加层胶水就能用，为什么要多出一条协议

### 1、我最初的判断是「不用 MCP」

我本来就是这么想的：LLM 拿到 OpenAPI 文档，框架把接口转成 tool 定义，模型输出函数名和参数，我的代码转发 HTTP——这条路我熟。多一条协议就多一层抽象、多一批概念、多一份排障成本，凭什么。

### 2、逐条对下来的结果

把痛点清单对着自己的场景逐条验，结论分了三档：

**对我成立的**：1）返回格式统一。MCP 把工具返回收口为 `content` 数组（text / image / resource）+ `isError` 布尔，<u>成败不依赖 HTTP 状态码</u><sup>[1]</sup>——我自己的接口返回体就是 `{code, data, message}` 风格，每接一个新 Agent 框架就要写一层返回值适配，这条痛点我亲身付过成本。2）权限域收敛：REST 接口的鉴权各自为政（token、cookie、ak/sk、签名），MCP 一个 Server 一个独立权限域，例如官方 filesystem server 启动参数限定目录，它天生跳不出去<sup>[1][2]</sup>。

**对我部分成立的**：能力发现。REST 没有约定怎么让 LLM 自动查询有哪些工具与 schema，<u>OpenAPI 是给开发者看的，不是给 Agent 自动发现用的</u><sup>[1]</sup>；MCP 在协议层内置 `tools/list`。但说实话这条我半信半疑——openapi.json 喂给模型，多数场景也能转出工具定义。

**对我不成立的**：本地场景。stdio 让桌面 Agent 读本地文件、本地 git 确实轻（spawn 子进程，<u>零端口、零防火墙问题</u><sup>[2]</sup>），但我的 MCP Client 在服务端，根本不需要本地传输。这是 MCP 的生态价值，不是我的选型理由。

**真正让我改判的是 OpenAPI 两块结构性补不上的**：1）动态权限视图——OpenAPI 是一份全局静态文档，A 用户和 B 用户拿到的是同一份；MCP 的 `resources/list` 设计目标就是按当前登录用户返回他有权限的资源清单。要自己造「按用户过滤的 openapi.json」这种非标方案，我不愿意。2）标准化双向交互——高危操作确认、中途登录这类「服务端反向找用户要输入」的场景，没有 MCP 我就得自造 ticketId + 二次确认接口 + 轮询，协议把这块收编了<sup>[1]</sup>。

### 3、我的评价：分界线在调用方，不在协议优劣

我把结论收敛成一句话：**调用方是开发者，就是确定性调用，REST 够；调用方是模型，它不知道系统有什么、需要先发现再自主选择，才谈 MCP。**

「网页 AJAX 全部改走 MCP、合并成一套协议」的想法我明确否掉。技术上可行——Streamable HTTP 底层就是 HTTP POST + SSE，但代价我一样样数过：前端从 `axios.get("/api/group/31")` 变成维护 sessionId、拼 JSON-RPC、解析 contents 数组，代码量翻倍；浏览器 GET 缓存、书签、直接复制链接打开、文件下载预览全废（MCP 全是 POST）；调试监控从看路径变成解析报文里的 method；SSE 长连接的会话重建要自己扛。换来的唯一好处是协议归一，这笔账不成立。

GraphQL 是前车之鉴：当年都喊它干掉 REST，结果是强动态查询用它、绝大多数业务继续 REST、大量项目两套并存。我的预期一样——**长期两套并存，业务 Service 收敛一份，REST 与 MCP 各做一层薄适配层**，重复的只是协议壳，不是业务逻辑。

## 二、两个让我修正认知的细节：stdio 与自定义 URI

### 1、stdio 不是网络协议变体，是进程管道

我原以为 stdio 是某种轻量 TCP 变体。实际上它是操作系统原生的进程间通信：Client 作为父进程拉起 Server 子进程，stdin ↔ stdout 互发 JSON-RPC，<u>一条消息一行、以换行符分隔</u><sup>[2]</sup>。这次讨论给我的实际收益是三个工程含义：

1. **日志必须走 stderr**。协议报文与调试输出共用 stdout 会直接打坏 JSON-RPC 解析——这是我没想到的第一坑，也解释了为什么不少开源 MCP Server 的日志配置看着别扭；
2. **身份是进程启动那一刻的 env 快照**。换 token、换用户 = 杀子进程重新拉起，进程内换不了身份。这条细节当时记下没觉得重要，到第三章直接决定了我的传输选型；
3. **零端口零网络**。不需要监听端口、不需要处理跨域，本地工具场景确实轻——只是我的场景用不上。

### 2、自定义 URI：协议给了我自由，也把风险留给了我

我的业务想用 `groups://31/detail` 这样的 URI 表示资源。讨论里最有价值的一条是按 RFC 3986 的组件规则拆开看：`scheme://authority/path?query#fragment`，这个写法会被解析成 scheme=`groups`、authority=`31`、path=`/detail`<sup>[6]</sup>。三个结论：

1. **authority 的解析规则是固定的（RFC 和 JDK 实现说了算），但「把 groupId 放在 authority」只是我自己的业务约定**——协议不知道 `groups` 是什么，解释权完全在我，锅也完全在我；
2. **少一个斜杠换一个世界**：`groups:31/detail`（没有 `//`）是 opaque URI，`getAuthority()` 返回 null；`groups:///31/detail` 的 authority 是空串、ID 落在 path 里——这是 `file:///` 的样式；
3. **authority 天然支持 `userinfo@host:port` 子组件**<sup>[6]</sup>：将来一旦有人写成 `groups://admin@31:8080/detail`，直接拿 `getAuthority()` 当 groupId 的代码会拿到整串。

我的决定：**让 path 承载 ID（`groups:///31/detail`），并且严格约定这个 scheme 永不使用 userinfo 与 port**。协议把解释权留给我，这种「协议不管、业务自担」的位置，值得在代码注释里钉死，而不是靠团队默契。

## 三、多用户落地才是真正的分水岭

### 1、身份模型逼我放弃 stdio

我最初的方案是「每个用户 fork 一个 stdio 子进程」，图个简单。算账之后放弃：C 层是多用户共享的，stdio 的身份绑在进程上（env 一次性注入），一千个并发用户就是一千个进程——内存、文件描述符、启停开销全部爆炸，而且子进程间身份串号的风险真实存在。

结论没有悬念：**多用户架构选 Streamable HTTP，身份放在每个请求的 `Authorization: Bearer` 头里**<sup>[3][7]</sup>。请求级隔离、无状态，token 过期走前端标准刷新流程，下一次 MCP 请求自动带上新 token——不存在「进程身份绑定」问题。三层的职责边界钉死：

| 组件 | 职责 | 不做什么 |
|---|---|---|
| IdP | 账号校验、签发 JWT、刷新与吊销 | 不感知业务资源权限 |
| C（业务后端 + MCP Client） | 业务编排，把当前用户 JWT 放进 MCP 请求的 Authorization 头 | 不解析资源权限，只透传 |
| S（MCP Server） | 校验 Bearer 解析 userId，按 userId 做资源级授权 | 不信任 C 传来的任何身份描述 |

安全边界落在 JWT 签名上：S 只信 IdP 签发的 token，C 篡改不了 userId。

### 2、MCP 没有 login 方法：这个认知纠正了我的直觉

我一开始下意识想「在 MCP 协议里定义一个登录方法」。讨论直接纠正了我：**MCP 协议报文本身没有认证字段，协议里没有 login**<sup>[3]</sup>。登录页面永远是自己的 IdP 网页，MCP Server 只消费 token，账号密码不能经过 LLM 链路、不能出现在 MCP 参数和日志里。三条路线对着我的场景选：

| 路线 | 适用场景 | 我的评价 |
|---|---|---|
| stdio + env token | 本地单用户、开发工具 | 身份是启动快照，只够单用户用 |
| elicitation 按需登录 | 会话内中途触发 | 链路要穿 S→C→U 三层，我不选（见第四章） |
| Streamable HTTP + OAuth 2.1 | 远程多用户 | 唯一正解：Authorization Code + PKCE，S 作为 resource server 只验签 |

校验方案我选了非对称 JWT（S 只持公钥、只验签），并在 `initialize` 阶段校验一次、把 userId 缓存进会话上下文，后续调用直接用缓存身份做业务鉴权，不逐次重复验签。三条反面清单也记下了：自定义 `login` method 不标准、stdio 里硬做 OAuth 没有浏览器回调环境、账号密码进 MCP 参数是红线<sup>[3]</sup>。

### 3、权限隔离：协议不做，全靠老规矩

这是整晚最让我踏实的一条结论：**MCP 协议本身不做任何资源权限隔离，URI 原样传给 handler，隔离是业务代码里写的鉴权逻辑**<sup>[4]</sup>。`groups:///31/detail` 用户 A 能读、用户 B 不能，靠的是两步拼接——HTTP / Security 层从 Bearer token 解析 userId 写入请求上下文，MCP handler 层解析 URI 拿 groupId、查权限表判 `canRead(userId, groupId)`。

也就是说，我原有的规矩在新协议下一个字不用改：身份只从认证态取、资源访问必过归属闸——只是落点从 Controller 换成 MCP handler。两个易漏点我单独记下了：

1. **`resources/list` 也要按 userId 过滤**。不过滤的话，B 用户的资源清单里看得到 `groups:///31/detail`，点进去才报无权限——安全与体验双输。正确姿势是在 list handler 里按 userId 动态查出可访问的群组、只生成他能读的 URI，这正是我选 MCP 而不是静态 OpenAPI 文档的理由，但不能只享受好处不做闸；
2. **身份永不进 URI**。`groups:///u1001-g31` 这种把 userId 编进 URI 的写法是反模式——身份放在参数里可被注入篡改，唯一载体是 Authorization 头。

HTTP 层与 SSE 的边界也一并定了：Spring Boot 做 MCP Server 时，所有 `/mcp` 请求（POST 建会话、POST 发消息、GET SSE 收推送）都是普通 HTTP 请求，照过 Filter 链与 Spring Security，现有 JWT 校验直接生效<sup>[8]</sup>；JWT 解析必须留在 Security 层，写进 handler 是分层错误（SSE 推送与反向请求路径很容易漏校验）；SSE 长连接只在建立那一刻过一次过滤器，设超时、客户端重连时带最新 token 重校验。另外坚持**每次请求都校验 Authorization**，不做「建会话时校验一次、之后靠 sessionId 鉴权」的映射表——token 过期了会话还能用、权限变更不生效、集群还要维护共享 session 存储，三条都是坑。

**我的感受**：安全感不是来自「协议帮我管了安全」，而是来自确认了「它没有替我做任何安全决定」。所有闸还在自己手里，位置和以前一样——这才是我敢把它接进生产的原因。

## 四、elicitation：协议给了能力，我决定不用

### 1、它吸引我的地方

elicitation 的准确语义：<u>不是服务端脱离上下文的随意推送，而是单次工具调用处理中途、服务端发现条件不足时，向客户端发起的交互式询问，等用户应答后本次调用再继续完成</u><sup>[1]</sup>。典型场景三类：高危操作强制人工确认（删群组、大额转账）、执行中途发现未登录、调用时参数不全向用户追问。

我承认它的价值：没有它，每家都要自造 ticketId、二次确认接口、轮询约定；有它，这块人机交互被协议收编了。我一度打算用它。

### 2、被「无栈重跑」劝退的过程

深入交互模型之后我退了回来。它的同步写法是语法糖，底层不是线程阻塞：框架保存最外层入参与应答状态、下发询问、**当前线程直接释放**还给容器线程池；应答回来后带着状态重新触发工具方法——而且**是整个方法从头重跑，不是断点续跑**。推下去四条，每条都扎在我的业务模型上：

1. 询问点之前的代码每次重试都重执行——写库、状态变更必须全放应答之后，之前只能放只读校验；
2. 不保存调用栈与中间变量——嵌套调用 A→B、B 里触发询问，重跑时 A 从头再来，跨方法的中间状态全部丢失；
3. 与数据库事务天然冲突——中断即释放线程与连接，重跑是全新请求、全新事务，上次跑到哪一步无影无踪；
4. 超时靠状态记录的 TTL 后台清理，不是业务线程计时。

这不是加注解能修的：是交互模型的底层假设（确认条件只依赖最外层入参，不依赖执行过程的中间计算结果）与复杂业务（确认点藏在循环第 5 个元素里才暴露）之间的根本冲突。协议层面无解。

### 3、我的决定与理由

三条纪律收尾：

1. 查询类业务不用 elicitation——读数据要么有权返回、要么无权报错，没有「中途停下来问用户」的需求，协议带着这个能力不代表每条链路都得接纳它的复杂度；
2. MCP Client 在服务端的架构里，**人工确认上移到编排层**：C 先判断高危、自己向用户确认，确认后再调 S，S 侧工具一次性执行完——没有暂停、没有重跑、事务语义完全正常；
3. elicitation 留给桌面宿主（Cline、Claude Desktop）的插件生态——它们原生自带 UI，主场在那。

一句话：**协议带了能力 ≠ 我应该用能力**。评估一项协议能力的标准是「它假设的交互模型和我的业务模型合不合」，不是「它有没有」。

## 收束

我的三个问题都有了答案。MCP 的存在理由是「模型的调用方身份」——分界线在调用方，不在协议优劣，REST 与 MCP 长期两套并存；落地的分水岭在传输层选型——多用户架构上 stdio 没有生存空间，Streamable HTTP + Bearer 是唯一解；能力的取舍标准是「交互模型是否与业务模型同构」——所以我用它的资源视图与返回收口，退回了它的 elicitation。真正让我放心的不是 MCP 带来了什么，而是确认了它没有偷偷替我做任何决定：身份走认证态、权限落在服务端闸、人工确认放在副作用之前——这些老规矩一条没变，变的只是落点从 Controller 换到了 MCP handler。

## 参考文献

1. Model Context Protocol 规范 2025-11-25 版总览（Host/Client/Server 三角色、JSON-RPC 2.0、resources/prompts/tools 与 sampling/roots/elicitation 能力划分）. https://modelcontextprotocol.io/specification/2025-11-25
2. MCP 规范 · Transports（stdio 子进程传输与 Streamable HTTP 传输的定义、消息分帧与会话模型）. https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
3. MCP 规范 · Authorization（远程 MCP Server 的 OAuth 2.1 授权框架、HTTP 传输层 Bearer 认证）. https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
4. MCP 规范 · Resources（URI 标识、`resources/read` 的 `contents` 数组、text/blob 与 mimeType 约定）. https://modelcontextprotocol.io/specification/2025-11-25/server/resources
5. JSON-RPC 2.0 规范（MCP 全部消息的消息格式与 id 匹配机制）. https://www.jsonrpc.org/specification
6. RFC 3986 · Uniform Resource Identifier (URI): Generic Syntax（`scheme://authority/path` 组件划分、authority 的 userinfo@host:port 子组件）. https://datatracker.ietf.org/doc/html/rfc3986
7. RFC 6750 · The OAuth 2.0 Authorization Framework: Bearer Token Usage（Authorization: Bearer 头的标准用法）. https://datatracker.ietf.org/doc/html/rfc6750
8. Spring AI MCP Server Boot Starter 文档（Spring Boot 体系下 Streamable HTTP MCP Server 的接入方式）. https://docs.spring.io/spring-ai/reference/api/mcp/mcp-server-boot-starter-docs.html
