---
title: "What AI Cannot Replace: Customer-Facing Core Business Processes and the Engine That Runs Them"
date: 2026-11-15T09:00:00+08:00
description: "A lesson we worked out while building our process engine: enterprise processes come in three kinds, and in customer-facing core business processes, the hard-won, refined designs are something AI cannot replace; the meta-design that structures customer requirements is constrained by engine semantics and must be led by IT. This post explains why, and how we designed a customer-centric, fully configurable engine."
categories:
  - AI-Native Engineering
tags:
  - Process Engine
  - BPM
  - Configuration-Driven
  - Enterprise AI
toc: true
---

> This post lays out a question I have been chewing on for a while: with AI this capable, what work can it not take over? My answer keeps converging on one place: **customer-facing core business processes, and the process engine that carries them**. This answer is not derived from first principles — it grew out of our work rebuilding our operations system, grinding through node after node of configuration. So I present it as "what we believe," not "what must be" — if anything is off, push back.

## 1. Three Kinds of Business Processes and the Boundary of AI Substitution

### 1.1. Scoping the Discussion: Three Kinds of Processes

"Is a business process every company's unique martial art?" — I'd pour half a bucket of cold water on that claim right away: it depends on which kind of process, because enterprise processes come in at least three kinds with completely different natures:

| Type | Examples | Nature | Where it comes from |
|---|---|---|---|
| Authorization flows | Leave, expense reimbursement, procurement approvals | Manages authorization: who initiates, who signs, who can grant exceptions | Ships with the platform, free |
| Internal management flows | Onboarding, budgeting, asset checkout | Manages internal collaboration efficiency | SaaS or platform configuration |
| Customer-facing core business processes | Order/project delivery step chains | Manages production: steps, owners, deadlines, billable items, and work-based commissions all live here | Self-defined, owned by the engine |

The first two kinds are roughly the same at every company — no competitive advantage there, and the platform's free defaults are enough. The third kind is different: customers never buy a software feature; they buy whether this delivery process can run reliably. A factory doesn't define its production line with generic software, and it's the same for these companies' core business processes.

We are in professional services, so the lesson hits even harder: **the process is part of the customer contract.** Every deliverable promised in a contract maps to a standard operating process behind it — and for the same product, some customers require an extra proofreading step while others don't. These differences are not internal management preferences; they are service commitments negotiated into the contract in black and white. At this layer, the process is the delivery, so the engine is not just an efficiency tool — it is an external-facing service capability.

I suspect this isn't unique to our industry. This post focuses on **service enterprises** — companies whose core business is "delivering on customer promises," including knowledge services, engineering, and professional agencies. For them, the third kind of process is the lifeline.

### 1.2. Why AI Cannot Replace This Layer

AI can write code, execute steps, even plan its own order of work — why can't it take over this one layer? I count four reasons; the first one took me longest to see, and it's the most fundamental.

**(1) This layer is full of hard-won lessons, and AI has none of that history.** A few examples from our own shop. "Completion records commission; termination doesn't" — why not on termination? Because termination means abnormal closure, and this rule was hammered out through countless disputes over "does this case count as workload or not." "On return, the entire intermediate path goes back to waiting," not just reopening the returned node — because reopening only that node forks the process instance's state and the books stop balancing; that one came from getting burned. "A commission node can differ from the node where the workload sits" — because the moment work gets done and the moment it gets measured genuinely misalign in reality. What these rules share: they cannot be derived from first principles, some are even counterintuitive, yet the process should be designed exactly this way. AI can learn generic BPM best practices from corpora, but not the history of bruises behind "why we designed it this way" — it can read "what is," not "why it can't be anything else."

One more point: hard-won designs must also be solidified into engine semantics before they turn from an old hand's personal craft into a company asset — if it lives only in people's heads, it walks out the door when they do. So our understanding is: core competitiveness = hard-won design × semantic solidification. Missing either half, it doesn't hold.

**(2) This layer's source is the contract, not requirements.** For customer-facing core business processes, every point of differentiation is negotiated into the contract: what to deliver, by when, to what quality standard. The contract is signed by the enterprise, so the responsibility lands on the enterprise. AI can generate a process diagram, but it cannot make promises on the enterprise's behalf — a promise means owning the delay and paying for the breach. The person defining the process holds the responsibility; AI holds the tool. Those two things cannot swap places.

**(3) This layer is the track AI runs on.** However fast AI completes each step, how steps hand off, how deadlines attach, how billable items get confirmed, how commissions get computed — all of that still lands on the process engine. AI execution without a track doesn't produce service; it produces luck. And customers want every case delivered this way, not just this one that happened to go well.

**(4) This layer accumulates operating data.** Deadline hit rates, production capacity, gross margin per billable item — all of it comes from process instances, and it's the basis for internal accounting and external pricing. AI's output only has business meaning once it enters this settlement system, and entering the settlement system presupposes the process engine exists in the first place.

So my conclusion: the cheaper execution gets, the scarcer the thing that organizes execution into a promise-able service becomes — the stronger AI gets, the more valuable this layer becomes.

## 2. How We Designed the Engine

### 2.1. The Pivot: From Project/Order-Centric to Customer-Centric

Our previous-generation business system was built around projects/orders: each case had a number, a status, a handler — the system tracked "where is this case in its flow." That was enough in the growth years, when rapid expansion made internal standardization the main theme and keeping cases under control counted as passing.

Switch to a market of competing over existing customers, and the logic changes: the contest is no longer internal standardization efficiency but the ability to serve customer differences — the same product needs different delivery processes for different customers; a customer's request must flow across multiple roles, not finish an approval inside one department. The system pivots with it, and the direction fits in one sentence: **shift from a project/order-centric "management" system to a customer-centric "collaboration" system.** For engine design, the first principle is configuration-driven:

- Configure processes by customer (contract) × product; each product gets one standard operating process.
- One product maps to N processes: the same product may have different delivery steps due to customer requirements or internal management differences, so multiple configurable processes are supported.
- Contracts link to processes: products under a contract specify their delivery process up front, and case creation auto-associates it; unspecified ones follow the standard process.
- Project initiation is a separate process, and payment requests stay out of the delivery process — delivery is delivery; money and cases are managed separately.

The data model boils down to one line: **a process definition hangs on both the process code and the customer ID** — the same process code, with a per-customer variant. Every configuration design that follows grows out of this.

### 2.2. Four Things a Generic Engine Can't Hold

Someone will ask: open-source process engines are everywhere, commercial platforms even more so — why not build on one of them? We went through the key actions in our processes against the primitives of generic engines — approvals, countersigning, conditional routing, form permissions, timeout reminders — and four categories did not map.

**Dispatching.** The handler isn't configured; it's chosen on the spot in an upstream node: at the dispatch node's work screen, the supervisor sees all steps pending dispatch under that branch, selects people within their own span of control according to the handler role configured on each step, and the assignable range is the intersection of the dispatcher's span and the node's configured range. Behind this sits a whole body of person-to-case matching logic — tag systems, load balancing, customer tier deciding automatic vs. manual — and a generic engine's "assign handler" is an entire industry away from it.

**Compliance deadlines.** This is the lifeline of our industry. Deadlines come in three classes — external statutory, customer, internal; calculation anchors to a base date (a contract-stipulated starting point, the date on an external document), counts business days, and rolls past holidays. Generation timing varies: process start, node activation, or condition-triggered — for example, a customer opted into an optional service, so an external document must be answered within a prescribed window. Each deadline carries multiple alerts — which channel, how many days ahead, who gets reminded — all configured. A generic engine's timeout reminder isn't in the same weight class.

**Billable items.** Pass-through fees are billed by elements like page count and item count, with reduction logic on top; billable items hang under process nodes and are recognized by amount-recognition principle — standard fees sit on the initial node, surcharges are recognized only when delivery is initiated. Billable-item status is partly controlled by business objects like payment requests and payments, and partly by the process engine.

**Work commissions.** Nodes carry workload points, and commission data is generated when the node completes; points split into doer points and support-staff points; there are both standard and customized point schemes, plus conditional bonus/penalty adjustments. A commission node can differ from the node where the workload sits — as noted earlier, reality hammered that one out.

These four share one trait: **they are not "approvals"; they are "production."** A generic BPM engine's object of management is the approval journey of a document — once approved, it's archived. Our object of management is the step-by-step journey of an order/project — when steps complete, billing, commissions, and capacity still have to be computed. Forcing an approval engine to stretch into these four areas means extending around its primitives at every point, and the finished product no longer resembles the original — at which point you might as well write your own.

### 2.3. Two Design Layers: Process Definitions and Node Configuration

The engine has two layers. Process definitions govern "what a process looks like"; node configuration governs "how each step is done."

**Process definition layer:**

| Config item | Design | What it solves |
|---|---|---|
| Process ID and code | ID unique; code classified by business type, direction, product category | Code handles classification, ID handles references; rename without touching the ID |
| Entry paths | Document handling, email handling, manual, triggered by another process completing | Where a process can be entered from |
| Standard process flag | Exactly one standard process per product | Falls back to the default SOP when there is no customer customization |
| Customer ID and linked contract | Contract + product linked to the process; case creation auto-associates | Customer-level process variants |
| Single-active-process flag per order/project | The same process cannot run in progress twice under one order/project | Prevents duplicate delivery |
| Enablement status | In configuration, enabled, disabled | Editing locked once enabled; revisions open a new configuration |

**Node configuration layer:**

| Config block | Contents |
|---|---|
| Structure | Single start node; one-person-one-task principle — a first-round proofreading review is one node, never merged; the critical path advances into child nodes, while non-essential and parallelizable steps become sibling branches |
| Activation | Activate on creation, activate on upstream completion (supports countersign-all or any-one completion), manual, code extension |
| Completion and checks | Manual completion or automated-program completion; completion check conditions use enumerated options plus logic code |
| Return and skip | Review nodes can be returned, and the return target must be configured first; skip nodes carry skip conditions, and a match skips automatically |
| Ad-hoc addition | Time + condition triggers automatically: an external document returns into the process and matches a designated type — add the relay branch; a customer opts into a service — add the corresponding branch |
| Handler configuration | Three modes: designated handler, dispatching, manual; scope from the org structure or custom teams; dispatching extensible to automatic load balancing and intelligent dispatch |
| Fields and work environment | Dynamic forms: fields of the node's business form set to visible, writable, required; work screens configured per node |
| Deadline configuration | Three deadline classes — external statutory, customer, internal; base date + increment + business-day rollover; generation timing and conditions; multiple alerts (channel + lead time + audience); deadline status linked to node status |
| Billable items and work commissions | Billing and recognition nodes for pass-through fees and service fees; customized points, per-role point accounting, stacking logic |

The node state machine is the skeleton of this design — seven states in all: **waiting, active, completed, terminated, suspended, error, skipped**. Completion records commission and termination doesn't — a one-word difference that maps to money. A node in the active state is the handler's to-do item; on return, the returned node and its entire upstream intermediate path go back to waiting. Suspension requires naming a suspension handler and stating the reason — somebody always has to watch the suspended cases. Error is the state where an automated node stops after failing, owned by IT. As for human intervention, it splits into two designs — one that breaks the rules with no linked actions at all, and one that runs like a normal flow.

### 2.4. The Cost of Building It Yourself, Stated Plainly

After all of the above, building your own can sound self-evident. The cost deserves equal billing — this is exactly where we hesitated too.

The hard part isn't drawing process diagrams; it's runtime semantics: return must unwind the entire intermediate path; ad-hoc addition dynamically grafts a branch onto the node tree and must evaluate activation conditions while grafting; suspension and resumption each have their own state linkages; and human intervention must distinguish linked from unlinked. None of this appears in a requirements document; in code it is all detail. We built a dozen-plus tables for it: process definitions, nodes, node relations, three layers of form configuration, deadlines, node instances, handlers, full operation traceability — the traceability table has separate time and reason fields for skip, return, suspend, and resume, because when accountability comes afterward, each one gets asked about separately.

So the precondition for building your own: **you can afford to keep the people who understand it.** A first version takes months; keeping it incident-free for three years takes a team. A process engine is not a business system — when it breaks, every order/project in the company and every compliance deadline is affected. Weigh that pressure in advance.

## 3. Where AI and IT Sit in Development

### 3.1. AI Comes In — Plugged Where?

Saying AI can't take over this layer's definition doesn't mean AI can't get in. Quite the opposite: the extension slots left in the engine's design are exactly AI's seats.

(1) Dispatching. The handler-mode configuration explicitly reserves extensions: automatic load balancing and intelligent dispatch. The scheme is tag matching plus load balancing plus hybrid dispatch — match staff expertise tags against business-domain tags, cap load by seniority thresholds, and let customer tier decide automatic vs. manual dispatch. Every assignment decision records its matching rationale, and that "explainability" is the floor: when a case is dispatched wrong, you must be able to trace why.

(2) Deadlines. AI parses external documents, computes deadlines automatically, and monitors company-wide deadline health — today all three are manual entry plus rule calculation; AI removes the entry step, and health monitoring can go from sampling to full coverage.

(3) Ad-hoc addition and completion checks — the "enumerated options + logic code" slots. Trigger conditions are business rules at heart; with a rules engine plus a language model, condition configuration can move from clicking through enumerations to natural-language descriptions with human confirmation.

The division of labor restates the earlier judgment: **AI takes over execution; it cannot take over definition.** Who a case goes to, how a deadline is computed — AI keeps getting better. But how many deadlines to set, which node to return to, how many points a step earns — those live in configuration, and people answer for the results.

### 3.2. Why Development Must Be IT-Led

This section answers the obvious follow-up: if AI can even write code, why must engine development still be IT-led?

First, give AI its due. Customer requests in raw form are usually unstructured — contract clauses, emails, fragments in chat logs. Language models collect these into a structured list, and they do it well, better than manually combing records; writing local code, generating test cases, drafting configuration — AI is good at all of it. Claiming "AI can't do this" doesn't hold up.

But structuring has to be taken apart layer by layer:

| Layer | What it is | Who does it |
|---|---|---|
| Designing the structure | How many classes of customer requests, and which engine config item each maps to | IT-led, AI drafts, business confirms |
| Applying the structure | Filling a specific customer's requests into the structure | AI drafts, business signs off |
| Evolving the structure | When requests no longer fit: add a configuration dimension, or add a code extension point | IT-led |

Layer 1 is the crux, because **the shape of the structure is constrained by what the engine can express**: if the engine has three handler modes and you structure customer requests into five, they won't map — the structuring is wasted. Someone who doesn't understand the engine's semantics cannot design a structure that lands — this is the real reason IT must own the meta-design, harder-edged than "AI isn't good at it."

Layer 3 matters most as customer requirements keep getting more complex: "doesn't fit" will recur, and every "change the structure or change the engine" decision touches semantics promised to customers. That steering wheel cannot be handed over.

So our position: **AI participates in development but doesn't lead; IT sits in the lead seat and answers for it.** And honestly, IT's way of leading is no longer what it was five years ago — not hand-writing every line, but defining semantics, briefing AI on the work, verifying, and owning the outcome. In an age of generation surplus, the bottleneck has moved from "producing it" to "verifying it." Who can verify engine code AI wrote? Only people who understand its semantics. Writing code got cheaper; defining and verifying didn't.

Why not business-led? Business understands the requests but not the semantic boundaries, and the usual result is fragmented configuration — one version per person, the process asset dissolving. Why not vendor-led? Your customer differentiation doesn't fit a standard product, as covered in the "four things a generic engine can't hold" section. Count them up: among internal roles, only IT both understands the system's semantics and carries long-term responsibility to the enterprise.

## 4. Applicability and Open Questions

### 4.1. Who Should NOT Build Their Own

The decision criteria, compressed into one table:

| Company situation | Where the engine comes from |
|---|---|
| Processes manage authorization: leave, reimbursement, procurement — generic approval flows | Use what the platform provides; don't build |
| Processes manage production: delivery steps, compliance deadlines, billing, and performance all grow on the process | Build or deeply customize; own the process model together with the engine |
| Processes manage production, but scale can't sustain a team | Use an industry-specific system and accept its standard practices; don't force-modify a generic engine |

The worst move is a variant of the last row: the process is clearly production-type, but you force it onto an approval engine — the retrofit cost is barely lower than building, and the result fits nothing on either side.

### 4.2. What We Haven't Figured Out Yet

- **Whether processes should nest.** Current answer: no nesting; copy nodes reduce duplicate configuration. Whether copying holds up as configuration volume grows remains to be seen.
- **How extension-type processes should work.** A deadline extension is not a delivery step — it's a meta-process, a process about processes. Hang it in the engine or build it as a separate module? Undecided.
- **The boundary of completion check conditions.** "Enumerated options + logic code" leaves an opening, but too much code and configuration-driven becomes nominal. Where that boundary sits — only running it for a while will tell.
- **Where accountability lands for AI dispatching.** Automatic assignments record their rationale, but the rationale is computed from tags and load — if a tag itself is wrong, whose responsibility is it? Not settled.
- **Can the history of hard-won lessons be made explicit?** The earlier section said AI can't read "why it can't be anything else." So if we write down each design decision one by one, can AI learn it indirectly? We'll only know by writing — and "why" records are far harder to write than "what is" records.

### 4.3. Closing

Back to the opening question: in the AI era, what work can't it take over?

My answer: customer-facing core business processes, and the process engine that carries them. This layer of process is full of practice-hammered, non-derivable designs, and AI has none of that history. This layer's differentiated promises are written into contracts, and AI cannot carry that responsibility. The structuring of customer requirements is constrained by engine semantics, and AI cannot set that structure.

So for this layer's engine, AI participates but doesn't lead; IT leads and answers for it. At least that's the road we chose: not building a better approval tool, but building a customer-centric, fully configurable production system — one where every differentiated promise made to a customer has a place in this engine.

With the division of labor settled, one last word on AI itself: it will not make this engine obsolete — it will make the engine more indispensable. The more steps AI can take over, the more you need this engine underneath to define the steps, anchor the responsibility, and meter the results. So for us, the move is not to wait and see when AI replaces the engine, but to keep the extension slots ready and the semantics clearly written, so that when AI arrives, it has somewhere to plug in.

This is where the post ends. Most of these judgments come from our own experience on a single project — a sample size of one, and whether they generalize needs more practice to verify. If you are building a process engine, or hesitating between buy and build, we'd welcome a comparison of approaches — especially contrary cases; those are far more useful than agreement.
