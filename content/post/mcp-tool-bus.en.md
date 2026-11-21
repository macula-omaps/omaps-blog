---
title: "The MCP Tool Bus: My Questions, Trade-offs, and Boundaries"
date: 2026-11-21T21:00:00+08:00
description: "A first-person thinking record on MCP: my original question (isn't REST plus glue code enough?), the arguments that actually convinced me, two details that corrected my understanding (stdio and custom URIs), the identity and permission decisions under a multi-user architecture, and why I decided against elicitation even though the protocol offers it."
categories:
  - AI-Native Engineering
tags:
  - MCP
  - Agent
  - Tool Calling
  - Protocol Design
  - REST
  - AuthN/AuthZ
toc: true
---

> This is a thinking record, not a survey. Background: I am wiring an Agent channel into my own business system, and MCP (Model Context Protocol) is unavoidable in that decision. What I actually cared about all evening was not "what is MCP", but three questions — why is one more protocol worth it? What does a multi-user rollout really cost? And which of the capabilities it offers should I adopt, and which should I hand back?

**My current four judgments, up front**:

1. **I accept MCP, but not because of the feature list.** What convinced me is a single dividing line: whether the caller is a developer or a model. OpenAPI has two structural gaps it cannot close — a per-user dynamically filtered resource view, and standardized bidirectional interaction;
2. **The real fork in the road is the transport layer**: a multi-user architecture must use Streamable HTTP; stdio's identity model cannot survive concurrency. This conclusion arrived earlier than I expected;
3. **What reassured me most was that "MCP itself does no permission isolation"** — none of my existing server-side gates need to change; the protocol silently makes no security decisions on my behalf;
4. **I put elicitation outside my boundary**: the protocol offers the capability, my architecture declines it, and human confirmation moves up into the orchestration layer.

## 1. My Question: REST Plus Glue Code Works — Why One More Protocol?

### 1. My initial position was "no MCP"

That is honestly what I thought: hand the LLM an OpenAPI document, have the framework convert endpoints into tool definitions, the model emits a function name and arguments, and my code forwards HTTP — I know this road well. One more protocol means one more layer of abstraction, one more batch of concepts, one more debugging surface. Why?

### 2. Checking the pain-point list against my own scenario

I went through the pain points one by one against my own situation, and the verdict split into three tiers.

**Holds for me**: 1) Unified return format. MCP collects all tool returns into a `content` array (text / image / resource) plus an `isError` flag — <u>success or failure does not ride on HTTP status codes</u><sup>[1]</sup>. My own APIs use a `{code, data, message}` envelope, and every new Agent framework I onboard has required another return-value adapter. I have personally paid this cost. 2) Permission domains: REST endpoints each do auth their own way (token, cookie, ak/sk, signatures), while MCP gives each Server its own permission domain — the official filesystem server, for example, is pinned to a directory by its launch arguments and cannot escape it<sup>[1][2]</sup>.

**Partially holds for me**: capability discovery. REST has no convention for how an LLM discovers what tools and schemas exist; <u>OpenAPI is written for developers, not for agent-driven discovery</u><sup>[1]</sup>, while MCP bakes `tools/list` into the protocol. Honestly I remain half-convinced here — feeding openapi.json to the model and converting it into tool definitions also works in most cases.

**Does not hold for me**: the local scenario. stdio makes desktop Agents reading local files and git genuinely lightweight (spawn a child process, <u>no ports, no firewall concerns</u><sup>[2]</sup>), but my MCP Client lives server-side and needs no local transport. That is MCP's ecosystem value, not my reason for adopting it.

**What actually changed my mind were two things OpenAPI structurally cannot add**: 1) the dynamic permission view — OpenAPI is one global static document; user A and user B receive the same one, while `resources/list` in MCP is designed to return the resources the current logged-in user may access. Building a "per-user filtered openapi.json" non-standard scheme is something I refuse to maintain. 2) standardized bidirectional interaction — for "the server needs input from the user mid-flight" cases like high-risk operation confirmation or mid-task login, without MCP I would be hand-rolling ticketId plus a second-confirmation endpoint plus polling; the protocol absorbs this<sup>[1]</sup>.

### 3. My verdict: the dividing line is the caller, not protocol quality

I condensed it into one sentence: **if the caller is a developer, it is deterministic invocation and REST suffices; if the caller is a model — which does not know what the system offers and must discover before choosing — then MCP enters the conversation.**

The idea of "moving all web AJAX onto MCP, merging into one protocol" I rejected outright. Technically feasible — Streamable HTTP is HTTP POST + SSE underneath — but I counted the costs one by one: the frontend goes from `axios.get("/api/group/31")` to maintaining sessionId, assembling JSON-RPC, and unwrapping contents arrays — double the code; browser GET caching, bookmarks, opening a copied link directly, file download and preview — all dead, because MCP is all POST; debugging and monitoring shift from reading paths to parsing the method inside payloads; and SSE session reconnection has to be handled by hand. The only gain is protocol uniformity; the ledger does not balance.

GraphQL is the cautionary tale: everyone once said it would kill REST, and the outcome is that strongly dynamic queries use it, the overwhelming majority of business continues on REST, and plenty of projects run both. My expectation is the same — **the two coexist long term; business services converge into one copy, with REST and MCP each getting a thin adapter shell**. What is duplicated is the protocol shell, never the business logic.

## 2. Two Details That Corrected My Understanding: stdio and Custom URIs

### 1. stdio is not a lightweight network protocol — it is a process pipe

I had assumed stdio was some minimal TCP variant. In fact it is the operating system's native inter-process communication: the Client, as the parent process, spawns the Server as a child, and the two exchange JSON-RPC over stdin ↔ stdout, <u>one message per line, delimited by newlines</u><sup>[2]</sup>. Three engineering implications made this detour worth it:

1. **Logs must go to stderr**. Protocol frames and debug output sharing stdout will directly corrupt JSON-RPC parsing — the pit I had least expected, and an explanation for why quite a few open-source MCP Servers have awkward logging configurations;
2. **Identity is an env snapshot from process start**. Rotating a token or switching users means killing and respawning the child — identity cannot change inside a running process. This detail seemed unimportant when I first noted it; it decides my transport choice in section 3;
3. **No ports, no network**. No listening socket, no CORS handling — genuinely light for local tooling. It is just that my scenario cannot use it.

### 2. Custom URIs: the protocol grants me freedom and hands me the risk

My business wants URIs like `groups://31/detail` to represent resources. The most valuable part of the discussion was decomposing it against RFC 3986: given `scheme://authority/path?query#fragment`, this string parses as scheme=`groups`, authority=`31`, path=`/detail`<sup>[6]</sup>. Three conclusions:

1. **The parsing rules for authority are fixed (the RFC and the JDK implementation decide), but "putting the groupId in the authority" is purely my own business convention** — the protocol has no idea what `groups` means; the interpretive authority is entirely mine, and so is the blame;
2. **One missing slash is another world**: `groups:31/detail` (no `//`) is an opaque URI and `getAuthority()` returns null; in `groups:///31/detail` the authority is empty and the ID lives in the path — that is the `file:///` style;
3. **The authority natively supports the `userinfo@host:port` subcomponents**<sup>[6]</sup>: if someone someday writes `groups://admin@31:8080/detail`, code that uses `getAuthority()` directly as the groupId will receive the whole string.

My decision: **let the path carry the ID (`groups:///31/detail`), and strictly commit this scheme to never using userinfo or port**. The protocol leaves interpretation to me; in a "the protocol doesn't care, the business owns it" spot like this, the convention belongs in code comments, not in team folklore.

## 3. Multi-User Rollout Is the Real Fork in the Road

### 1. The identity model forces me off stdio

My first plan was "fork one stdio child process per user" for simplicity. The arithmetic killed it: layer C is shared by all users, and stdio binds identity to the process (env injected once at spawn) — a thousand concurrent users means a thousand processes; memory, file descriptors, and startup churn all explode, and cross-process identity bleed is a real risk.

The conclusion is not suspenseful: **choose Streamable HTTP for multi-user, and carry identity in every request's `Authorization: Bearer` header**<sup>[3][7]</sup> — request-scoped isolation, stateless; token expiry follows the standard frontend refresh flow and the next MCP request automatically carries the fresh token. There is no "process-bound identity" problem. The three-layer responsibility boundary gets nailed down:

| Component | Responsibility | Must not do |
|---|---|---|
| IdP | Account verification, issuing JWT, refresh and revocation | No awareness of business resource permissions |
| C (business backend + MCP Client) | Business orchestration; puts the current user's JWT into the MCP request's Authorization header | Does not resolve resource permissions; passes through only |
| S (MCP Server) | Verifies the Bearer, resolves userId, does resource-level authorization per userId | Trusts no identity description sent by C |

The security boundary rests on the JWT signature: S trusts only tokens the IdP signed, and C cannot tamper with the userId.

### 2. MCP has no login method: this corrected an instinct

My first instinct was "define a login method inside the MCP protocol". The discussion corrected it directly: **the MCP message format carries no authentication field; the protocol has no login**<sup>[3]</sup>. The login page is always my own IdP web page; the MCP Server consumes tokens only, and passwords must never pass through the LLM chain or appear in MCP arguments and logs. Three routes, judged against my scenario:

| Route | Fits | My verdict |
|---|---|---|
| stdio + env token | Local single-user, dev tooling | Identity is a startup snapshot; single-user only |
| Elicitation-driven login | Mid-session triggers | The chain crosses S→C→U; I decline (see section 4) |
| Streamable HTTP + OAuth 2.1 | Remote multi-user | The only correct answer: Authorization Code + PKCE, with S verifying as a resource server |

For verification I chose asymmetric JWT (S holds only the public key and only verifies), and I validate once at the `initialize` stage, caching userId into the session context; subsequent calls authorize against the cached identity instead of re-verifying per call. Three anti-patterns also went into my notes: a custom `login` method is non-standard; forcing OAuth inside stdio has no browser-callback environment; credentials inside MCP arguments are a red line<sup>[3]</sup>.

### 3. Permission isolation: the protocol does none of it; the old rules do all of it

This was the most reassuring conclusion of the evening: **MCP itself does zero resource-permission isolation; the URI is handed to the handler verbatim, and isolation is authorization logic written in business code**<sup>[4]</sup>. That `groups:///31/detail` is readable by user A and denied to user B comes from two stitched steps — the HTTP/Security layer resolves userId from the Bearer token into request context, and the MCP handler parses the URI for groupId and consults the permission table for `canRead(userId, groupId)`.

In other words, my existing rules carry over word for word: identity only from the authentication state, every resource access through the ownership gate — only the landing point moves from Controller to MCP handler. Two easily missed points went into my notes separately:

1. **`resources/list` must also filter by userId**. Unfiltered, user B sees `groups:///31/detail` in the listing and hits the permission error on click — losing on both security and experience. The right shape is a list handler that queries the groups user X may access and generates only the URIs they can read. This is exactly why I chose MCP over a static OpenAPI document; enjoying the benefit without building the gate is not an option;
2. **Identity never goes into the URI**. Encoding userId as `groups:///u1001-g31` is an anti-pattern — identity inside arguments can be injected and tampered; its only carrier is the Authorization header.

The HTTP layer and the SSE boundary got settled in the same pass: with Spring Boot as the MCP Server, every `/mcp` request (POST to establish the session, POST to send messages, GET for SSE pushes) is an ordinary HTTP request that traverses the filter chain and Spring Security, so the existing JWT validation applies as-is<sup>[8]</sup>; JWT parsing must stay in the Security layer — putting it inside the handler is a layering error (SSE pushes and reverse-request paths are exactly where validation gets missed); an SSE long connection passes the filter only once at establishment, so set a timeout and have clients reconnect with the freshest token for re-validation. And I hold the line on **validating Authorization on every request** — no "validate at session creation, then trust the sessionId" mapping table: expired tokens keep working, permission changes never take effect, and a cluster now needs shared session storage — three pits in one design.

**How it felt**: the reassurance did not come from "the protocol handles security for me" but from confirming that "it makes no security decisions on my behalf". Every gate is still in my hands, in the same place as before — that is why I dare take it to production.

## 4. Elicitation: The Protocol Offers It; I Decline It

### 1. What attracted me

Elicitation's precise semantics: <u>not a context-free push from the server, but an interactive prompt the server raises mid-execution of a single tool call when it finds a condition missing; after the user answers, the same call continues to completion</u><sup>[1]</sup>. Three typical scenarios: forced human confirmation of high-risk operations (deleting a group, a large transfer), discovering mid-execution that the user is not logged in, and asking the user for missing arguments.

I grant its value: without it, everyone hand-rolls ticketId, second-confirmation endpoints, and polling conventions; with it, this slice of human-machine interaction is absorbed into the protocol. For a moment I planned to use it.

### 2. How "stateless re-entry" talked me out of it

Digging into the interaction model, I backed off. The synchronous style is syntactic sugar, not a blocked thread: the framework saves the outermost arguments and the answer state, dispatches the prompt, and **releases the current thread** back to the container pool; when the answer returns, the framework re-triggers the tool method — and **it re-runs the entire method from the top, not as a resumed breakpoint**. Four consequences, each of which lands on my business model:

1. Code before the elicitation point re-executes on every retry — writes and state changes must all sit after the answer; only read-only checks may sit before it;
2. No call stack and no intermediate variables are saved — with A calling B and B raising the prompt, a re-run starts A over from the top; all cross-method intermediate state evaporates;
3. It conflicts with database transactions by construction — interruption releases the thread and its connection; the re-run is a fresh request in a fresh transaction, with no trace of where the last one stopped;
4. Timeouts ride on the TTL of the saved state record, swept by a background job — not on a business thread timer.

No annotation fixes this: the conflict is between the interaction model's base assumption (the confirmation condition depends only on the outermost arguments, never on intermediate computation) and complex business (the confirmation point only surfaces inside the fifth iteration of a loop). Unsolvable at the protocol level.

### 3. My decision and its reasoning

Three disciplines close it out:

1. Query-style business never uses elicitation — reading data either returns with permission or errors without it; there is no "pause mid-stream to ask the user". A protocol carrying a capability does not mean every path must absorb its complexity;
2. Where the MCP Client lives server-side, **human confirmation moves up into the orchestration layer**: C judges the operation high-risk, confirms with the user itself, then calls S; the S-side tool executes in one pass — no pause, no re-run, normal transaction semantics;
3. Elicitation stays with the desktop hosts' (Cline, Claude Desktop) plugin ecosystems — they have native UI; that is its home turf.

One line: **the protocol offering a capability does not mean I should use it**. The standard for evaluating a protocol capability is "does its assumed interaction model match my business model", never "does it exist".

## Closing

My three questions all have answers. MCP's reason to exist is "the model as caller" — the dividing line is the caller, not protocol quality, and REST and MCP will coexist long term; the fork in the road for rollout is the transport choice — under a multi-user architecture stdio has no room to live, and Streamable HTTP + Bearer is the only answer; the standard for adopting capabilities is "does the interaction model match my business model" — so I take its resource view and unified returns, and hand back its elicitation. What reassures me is not what MCP adds, but the confirmation that it silently decides nothing on my behalf: identity from the authentication state, permissions on server-side gates, human confirmation before side effects — the old rules survive unchanged; only the landing point moves from Controller to MCP handler.

## References

1. Model Context Protocol Specification, version 2025-11-25 (Host/Client/Server roles, JSON-RPC 2.0, and the resources/prompts/tools plus sampling/roots/elicitation capability split). https://modelcontextprotocol.io/specification/2025-11-25
2. MCP Specification · Transports (stdio child-process transport and Streamable HTTP transport: framing and session model). https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
3. MCP Specification · Authorization (OAuth 2.1 authorization framework for remote MCP Servers, HTTP transport Bearer authentication). https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
4. MCP Specification · Resources (URI identification, the `contents` array of `resources/read`, text/blob and mimeType conventions). https://modelcontextprotocol.io/specification/2025-11-25/server/resources
5. JSON-RPC 2.0 Specification (the message format and id-matching mechanism behind every MCP message). https://www.jsonrpc.org/specification
6. RFC 3986 · Uniform Resource Identifier (URI): Generic Syntax (`scheme://authority/path` component split; the userinfo@host:port subcomponents of authority). https://datatracker.ietf.org/doc/html/rfc3986
7. RFC 6750 · The OAuth 2.0 Authorization Framework: Bearer Token Usage (standard usage of the Authorization: Bearer header). https://datatracker.ietf.org/doc/html/rfc6750
8. Spring AI MCP Server Boot Starter documentation (wiring a Streamable HTTP MCP Server in the Spring Boot ecosystem). https://docs.spring.io/spring-ai/reference/api/mcp/mcp-server-boot-starter-docs.html
