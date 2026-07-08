---
title: "4.19 - The Opening Bank: Fifty 90-Second RESHADED Openings"
description: A recognition-speed drill for the design round, fifty unseen prompts spanning platform infra, data systems, real-time, geo, commerce, media, trust, and AI infrastructure, each with a collapsed 90-second opening (scope cut, headline numbers, the core tension, the shape, the deep-dive call) so the first five minutes of any round become reflex.
sidebar:
  order: 19
---

> The walkthrough lessons taught you full designs; this drills the five minutes that decide how the rest of the round goes. Fifty prompts you have not seen in this course, each answered only to the opening: the scope cut, two or three headline numbers, the one tension the design turns on, the component shape, and where you would spend your depth. Interviewers calibrate their opinion of you in those first minutes, and the skill is recognition speed, not memorized architectures. Work each prompt out loud before opening the model.

### Learning objectives
- Take an unseen prompt to a committed opening in **90 seconds**: scope cut, headline numbers, the core tension, a 4-6 component shape, and a named deep dive with a delegation line.
- Recognize the **recurring tension families** (freshness vs cost, hot-key skew, read vs write amplification, exactly-once vs at-least-once, latency floor vs throughput) fast enough to name the turn before drawing a box.
- Extend the RESHADED reflex to prompt families the walkthroughs do not cover, platform infrastructure, trust and safety, IoT (Internet of Things) fleets, and the 2025-26 AI-infrastructure wave.
- Run the drill protocol so gaps become targeted re-reads of the concept lessons, not another pass of passive reading.

### Intuition first
Sight-reading, not repertoire. A pianist who has rehearsed fifteen pieces to performance standard can still freeze when handed an unseen score, because performing repertoire and reading at tempo are different skills. The walkthrough lessons are your repertoire, deep, polished, complete. A real round hands you a score you have never seen and starts the metronome. Sight-readers survive because they read structure, not notes: key signature, time signature, where the phrase turns. That is what this bank drills, the key signature of an unseen system (its read:write asymmetry), the time signature (its scale numbers), and where the phrase turns (the one tension the design pivots on). Fifty scores, five beats each, always at tempo.

---

## How to run the bank

Per prompt, ~7 minutes:

```mermaid
flowchart LR
    P["Read the prompt"] --> S["90 seconds, out loud:<br/>the five-beat opening"]
    S --> M["Open the model<br/>compare beats, not words"]
    M --> T["Name the tension family<br/>it belongs to"]
    T --> G["Gap? Re-read the matching<br/>concept lesson, not more prompts"]
```

The five beats every opening hits, in order:

| Beat | What it is | The tell of a strong one |
|---|---|---|
| **1. Scope cut** | The 2-3 functional requirements that matter, what you deliberately cut, read:write asymmetry, the dominating non-functional requirement | One breath, and the cut is stated, not silently assumed |
| **2. Headline numbers** | 2-3 rounded figures: QPS or events/day, storage growth, fan-out math | Assumptions said aloud ("assume 10M DAU (daily active users)..."), aggressive rounding |
| **3. The turn** | The single tension the design pivots on | Named as a trade-off, not a topic ("freshness vs read cost", not "caching") |
| **4. The shape** | 4-6 components in words, no diagram yet | Components exist *because of* beats 1-3, each earns its place |
| **5. Depth + delegation** | Where the next 15 minutes go, and what you delegate with a stated prior | The deep dive sits where the turn lives; the delegation names a prior and a reason |

Three rules. **At tempo**: 90 seconds, timed, out loud; slowing down defeats the purpose, this is a metronome drill (sight-readers never stop the clock). **Beats, not words**: your numbers and component names will differ from the model, what must match is that all five beats landed and the tension is the right one. **Gaps route to concepts**: if a prompt exposes a family you cannot name (you have never thought about write amplification), the fix is the matching concept lesson, not grinding more prompts.

---
## Platform and developer infrastructure

These six drill the primitives every other system leans on, where the tension is rarely user QPS but the platform contract: propagation speed, request-path latency budgets, blast radius, and the availability floor an entire company sits on. The recurring move is to name what sits on the hot path and defend the milliseconds and the failure domain.

#### D1. "Design a feature-flag and experimentation delivery system."

**Family:** platform infra · **Reps:** rising 2025-26 platform staple · **The turn:** flag reads sit on every request and must be local, but a kill switch must propagate worldwide in seconds

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: two different users, engineers toggling flags and PMs running experiments; I'd build flag delivery first and layer experiment assignment on it, cutting stats analysis to an offline pipeline. Read:write is extreme: assume 10M DAU, flag checks on every request, call it 5B evaluations a day, roughly 60k per second average, against maybe 200 flag writes a day. That number decides the architecture: evaluations can never cross the network, so rules evaluate in-process from a local snapshot in microseconds. The turn: that local snapshot fights the kill switch, which has to land globally in seconds when a flag is breaking production. Shape: a config store, versioned snapshots published to edge/CDN, SDKs holding a streaming connection for invalidation pushes with polling fallback, an in-process rule engine, and an exposure-event stream into the experiment pipeline. I'd go deep on the propagation path, versioned so clients never regress. I'd delegate the stats engine to the data science team; my prior is sequential testing with variance reduction, because peeking at fixed-horizon tests is how experiment programs quietly rot."

**Why it scores:** the read:write asymmetry is stated as the reason for the shape, and the kill-switch tension is named before any component is. **Red flag avoided:** starting with "so we'll need a database and a service" before any number exists.

</details>

#### D2. "Design a webhook delivery platform."

**Family:** platform infra · **Reps:** classic, still high-frequency · **The turn:** at-least-once delivery hammers a dead receiver, so retries must isolate per destination and receivers must dedupe

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: reliable delivery of our events to customer endpoints, one webhook at a time; I'd cut the subscription UI and analytics to a side path and build the delivery core first. It is write-heavy in a strange way, since we generate the load: assume 10k events per second sustained, receivers answering in maybe 200ms at the median, and at any moment call it 2% of endpoints simply down. That 2% is the whole problem. At-least-once with retries means a dead receiver gets hammered, so receivers must dedupe on an idempotency key we send. The turn: aggressive retries protect delivery but turn one slow receiver into a fleet-wide backlog. Shape: a durable queue per destination, exponential backoff with a per-endpoint circuit breaker, signed payloads, and a dead-letter store with a replay UI. I'd go deep on per-destination isolation, so one slow endpoint can't starve the fleet. I'd delegate the payload-signing scheme to the security team; my prior is HMAC (hash-based message authentication code) over the raw body with a rotating secret, because asymmetric signing buys nothing receivers will actually verify."

**Why it scores:** the 2% down figure is turned into the architectural driver, and per-destination isolation is named as the failure domain. **Red flag avoided:** a single shared retry queue that one dead endpoint backs up for everyone.

</details>

#### D3. "Design an API gateway / edge layer."

**Family:** platform infra · **Reps:** FAANG staple, high-frequency · **The turn:** every capability on the request path buys features with p99, and the gateway is a single point of failure by design

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: the gateway terminates every external request and does auth, rate limiting, transforms, and routing before anything hits a service; I'd defer the developer-portal and key self-service to a control-plane side project. The asymmetry is request-path versus config-change: assume 500k requests per second through the data plane against maybe a few hundred config edits a day, and a hard budget of under 5ms added at p99. That budget is the constraint that shapes everything, because every feature I add to the path spends latency, and the gateway is a single point of failure by design. The turn: capability on the request path versus p99 and blast radius. Shape: a control plane owning routes and config, a fleet of stateless data-plane proxies, local rate-limit counters synced asynchronously, a plugin chain, and versioned config with canary rollout. I'd go deep on control-and-data-plane separation, so config pushes never restart the proxies. I'd delegate WAF (web application firewall) rules to the security team; my prior is a managed rule set in detection mode first, because hand-written blocking rules page you at 3am for false positives."

**Why it scores:** the sub-5ms budget is stated before any component, framing the whole design as latency defense. **Red flag avoided:** piling auth, transforms, and routing into one monolithic proxy with no control/data split.

</details>

#### D4. "Design a CI/CD deployment system."

**Family:** developer infra · **Reps:** rising with platform-eng interviews · **The turn:** deploy velocity versus blast radius, resolved by metric-gated progressive delivery

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: take a merged commit to production safely and fast; I'd build the deploy and rollout path first and treat build/test as an upstream I consume. The load is human but the blast radius is not: assume 2,000 engineers, so call it 5k deploys a day, onto a fleet of maybe 50k containers. The numbers say the average deploy touches a huge surface, so the turn is deploy velocity versus blast radius, and progressive delivery with automatic rollback is how you get both. Shape: an artifact store, a pipeline orchestrator, a progressive rollout engine stepping 1% to 10% to 50% to 100% gated on service-level-objective metrics, an auto-rollback trigger, and an immutable audit trail. I'd go deep on the metric-gated evaluator: which signals to watch and how long to bake each stage before promoting. I'd delegate build-cache design to the developer-productivity team; my prior is content-addressed remote caching, because most of the 5k daily builds are near-identical and recomputing them burns the fleet."

**Why it scores:** it names the metric-gated rollout as the mechanism that reconciles velocity and safety, not just "we do canaries." **Red flag avoided:** manual gates and a big-bang deploy with rollback-by-redeploy.

</details>

#### D5. "Design an authentication platform for 100M users."

**Family:** platform infra · **Reps:** classic, still high-frequency · **The turn:** authN is the availability floor of every surface, yet stateless tokens fight instant revocation

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: log users in, issue and validate tokens, and revoke them; I'd defer social-login federation and account recovery and build the token path first. The asymmetry is login versus validation: assume 100M users but only about 2M logins a day, roughly 25 per second, against token validation at 200k per second on every downstream call. So authN is a hard dependency of every surface, its availability is the company's floor, and it fights credential security and instant revocation. The turn: stateless tokens validate fast and offline but cannot be revoked, and revocation is non-negotiable. Shape: an identity store with hashed credentials (Argon2), a token service issuing short-lived JWTs (JSON Web Tokens) plus refresh tokens, a revocation denylist in Redis, MFA (multi-factor authentication) flows, and login anomaly detection. I'd go deep on the revocation-versus-stateless tension, resolved as short TTL (time to live) plus a small denylist on the hot path. I'd delegate password-hashing parameters to the security team; my prior is Argon2id tuned to roughly 100ms per hash, because that knob trades login latency against offline-crack cost."

**Why it scores:** the login/validation split justifies stateless tokens, then the revocation tension is confronted rather than hand-waved. **Red flag avoided:** long-lived opaque sessions with a database hit on every request, or JWTs with no revocation story.

</details>

#### D6. "Design a distributed lock service."

**Family:** coordination primitive · **Reps:** classic distributed-systems screen · **The turn:** safety (never two holders) versus liveness when the holder dies, made real by fencing tokens

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: hand out mutually exclusive locks that survive process and network failure; I'd cut general coordination like config storage and build the lock primitive cleanly. Low volume, high stakes: assume only about 10k lock operations per second with a default lease near 10 seconds, so throughput is not the problem, correctness is. The turn: safety, never two holders at once, versus liveness when the holder dies or partitions away, and you cannot fully have both. Shape: a consensus core (Raft over 5 nodes) as the source of truth, leases that auto-expire, a monotonic fencing-token counter handed to each holder, and a watch/notify path for waiters. I'd go deep on why a lease alone is not enough: a client stalled in a garbage-collection pause past its lease still thinks it holds the lock, so the guarded resource must reject any write carrying a stale fencing token. I'd delegate the client library's retry semantics to the platform team; my prior is bounded retries with jitter and explicit lock-loss callbacks, because silent auto-reacquire is how split-brain bugs hide."

**Why it scores:** it tells the GC-pause failure story and lands fencing tokens as the fix, which is the whole point of the question. **Red flag avoided:** claiming a lease alone gives mutual exclusion, ignoring the stalled-holder case.

</details>

## Storage and data-plane primitives

These six drill storage and data-plane building blocks, where the tension lives in physics: read amplification versus write amplification, durability math, hot key-ranges, and metadata that scales nothing like the bytes it describes. The move is to let the access pattern and one dominant number pick the structure, not the vendor.

#### D7. "Design an S3-style object store."

**Family:** storage primitive · **Reps:** classic, still high-frequency · **The turn:** metadata scales nothing like the bytes, so the two planes split

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: durable PUT and GET of opaque blobs with strongly consistent listing; I'd defer lifecycle policies and cross-region replication and nail the single-region data path. Two numbers pull apart: assume 100 billion objects but 1 EB (exabyte) of bytes, at a durability target of 11 nines. That split is the turn, because metadata is billions of tiny strongly-consistent records while data is exabytes of throughput, and one system serves neither well. Shape: a sharded metadata service on consensus, a placement service, storage nodes holding erasure-coded shards, a background repair-and-scrub pipeline, and a front end for auth and request signing. I'd go deep on the durability math: erasure coding at 8+4 buys 11 nines at about 1.5x overhead versus 3x for triple replication, so on an exabyte that trade is worth tens of millions a year. I'd delegate disk-failure prediction to the storage team; my prior is drive-health telemetry (SMART) models feeding proactive drains, because reacting after a failure is how you lose the second shard mid-repair."

**Why it scores:** it splits metadata from data as the opening move and defends erasure coding with real cost math. **Red flag avoided:** one database for both, or claiming 11 nines with plain 3x replication and no scrub.

</details>

#### D8. "Design a CDN."

**Family:** edge/data-plane · **Reps:** classic, still high-frequency · **The turn:** long cache lifetimes for hit ratio versus fast invalidation, with origin protection on every miss

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: cache and serve static and streaming assets close to users while shielding the origin; I'd defer the config/rules layer and build the cache hierarchy first. Assume 200 points of presence (PoPs), roughly 80% of bytes being video, and a target above 95% edge hit ratio. Those numbers set the turn: I want long cache lifetimes to hit that ratio, but content changes and must invalidate fast, and every miss is a shot at the origin. Shape: edge caches at each PoP, a second tier of regional shield caches, anycast routing to the nearest edge, an invalidation bus, and request coalescing. I'd prefer versioned URLs over active purges, so a change is a new key rather than a global invalidation storm. I'd go deep on request coalescing, so a hot miss collapses thousands of concurrent requests into one origin fetch instead of a thundering herd. I'd delegate PoP capacity planning to the infrastructure team; my prior is provisioning for regional peak plus one PoP failure, because a full PoP outage dumps its load on neighbors."

**Why it scores:** it prefers versioned URLs over purges and names coalescing as origin protection, both senior instincts. **Red flag avoided:** relying on global purge for every change and having no thundering-herd answer on a hot miss.

</details>

#### D9. "Design a wide-column store (Bigtable-style)."

**Family:** storage primitive · **Reps:** classic distributed-storage screen · **The turn:** cheap sequential LSM (log-structured merge tree) writes versus read amplification, plus hot key-ranges under sequential keys

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: a sorted, sparse, wide-column store with fast writes and range scans; I'd cut secondary indexes and transactions and build the single-table read/write path. Assume 1M writes per second, rows keyed by user and timestamp. That key choice is the trap: monotonic timestamps push every recent write into one key-range, so one tablet server takes the firehose while the rest idle. The turn: the LSM write path makes writes cheap sequential appends, but reads pay amplification across levels, and sequential keys create hot ranges. Shape: tablet servers over a shared write-ahead log and SSTables (sorted string tables) on a distributed file system, a master assigning tablet ranges, bloom filters and a block cache against read amplification, and a compaction scheduler. I'd go deep on compaction backpressure: when writes outrun compaction, levels pile up and the store throttles writes to protect read latency, and that stall is what pages you. I'd delegate block-cache eviction tuning to the storage team; my prior is scan-resistant LRU (least recently used), because one big range scan otherwise evicts the hot working set."

**Why it scores:** it flags the sequential-key hot range immediately and names compaction backpressure as the real operational risk. **Red flag avoided:** presenting the LSM tree as pure upside with no mention of read amplification or write stalls.

</details>

#### D10. "Design a unique ID generator."

**Family:** data-plane primitive · **Reps:** classic warm-up, still common · **The turn:** coordination-free throughput versus honest time-ordering under clock skew

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: generate unique, roughly time-ordered 64-bit IDs at high volume without a central bottleneck; I'd make strict total ordering a non-goal and commit to roughly-sortable. Assume 1M IDs per second across the fleet inside a 64-bit budget. That sets the turn: I want coordination-free generation for throughput and availability, but any time-ordering guarantee leans on wall clocks, and clock skew makes that ordering a quiet lie. Shape: a Snowflake-style layout splitting the 64 bits into timestamp, worker ID, and a per-millisecond sequence, a coordination service handing out worker IDs at boot only, and a clock-skew guard that refuses to emit if time moves backward. I'd go deep on the skew policy and sequence exhaustion: what a node does when NTP (network time protocol) yanks the clock back, and what happens when one millisecond's sequence bits run out under a burst. I'd delegate worker-ID lifecycle under Kubernetes to the platform team; my prior is leasing IDs from a small coordination service rather than pod ordinals, because recycled ordinals collide after a rolling restart."

**Why it scores:** it names strict ordering as a non-goal and confronts clock skew and sequence exhaustion, the two things this question actually tests. **Red flag avoided:** promising monotonic global ordering while depending on synchronized wall clocks.

</details>

#### D11. "Design a like/view counter at scale."

**Family:** data-plane primitive · **Reps:** classic, still high-frequency · **The turn:** a single viral hot key versus read-your-writes, with exactness reserved for billing-class counts

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: count likes and views and show the total, fast; I'd push per-user like history to a side store and build the counter path. The load is not the average, it is one key: assume a viral post taking 1M likes a minute, about 17k per second, all on the same counter. That single hot key is the turn, against a read-your-writes expectation, plus the realization that exactness only matters for billing-class counts, not a display number. Shape: sharded counters spreading one logical count across N sub-keys, client-side batching before the write, Redis holding the live shards with a periodic flush to a durable store, and an approximate display like 1.2M backed by an exact ledger only where money depends on it. I'd go deep on hot-key sharding and the display-versus-ledger split, since fanning one counter into shards is what turns 17k writes per second on one key into something a cluster absorbs. I'd delegate count fraud filtering to the integrity team; my prior is async scrubbing after display, not inline, because a bot-inflated view count is a cleanup problem, not a request-path one."

**Why it scores:** it isolates the single-hot-key problem and splits approximate display from an exact ledger, sizing exactness to where it matters. **Red flag avoided:** one row incremented per like, and treating a display count as billing-grade.

</details>

#### D12. "Design an email service (Gmail-scale)."

**Family:** storage primitive · **Reps:** classic, still high-frequency · **The turn:** mail is write-once-read-many-search-forever, so search-index cost and tiering dominate, not send throughput

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: receive, store, search, and serve mail; I'd defer calendar and contacts and build the store-and-search core. The numbers reframe it: assume 1B accounts, 100 billion messages a day including spam, and about 15 GB per user, so we hold hundreds of petabytes written once, read a few times, and searched forever. That is the turn: send throughput is easy, but search-index cost and storage tiering dominate, because every message is retained and must stay searchable. Shape: an SMTP (simple mail transfer protocol) ingress with spam and phishing scoring, a message store of immutable blobs plus a per-user metadata index, a per-user-partitioned search index, hot/cold tiering, and an IMAP (internet message access protocol) and API serving layer. I'd go deep on per-user search-index sharding: a single global inverted index over 100 billion daily messages is unqueryable, so the index is partitioned by user and each mailbox searches only its own shard. I'd delegate spam-model ownership to the anti-abuse team; my prior is a fast inline classifier gating delivery plus an async deep model, because holding every message for a slow model would blow the ingest budget."

**Why it scores:** it reframes the problem away from send throughput toward search and tiering, and defends per-user index sharding with the fan-out math. **Red flag avoided:** a single global inverted index and sizing the whole system on SMTP send rate.

</details>

## Real-time and communication

These six drill real-time delivery, where a latency floor or a fan-out shape, not a database, sets the architecture. The recurring turn is that reliability and richness cost latency or money, so the design chooses what to give up.

#### D13. "Design a Slack-style workspace chat system."

**Family:** real-time messaging · **Reps:** classic, still high-frequency · **The turn:** channel fan-out to a 50k-member #general fights an accurate per-member unread count

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: workspace chat, so the unit is a channel with an ordered event log and per-member read state, not a 1:1 inbox; I'd defer threads and search and treat send-plus-unread as the core. Reads beat writes maybe 20:1, since one send fans out to every member and every unread badge. Assume 10M concurrent connections, channels averaging 200 members with a #general at 50k, and an unread counter for every member of every channel. The turn: a 50k-member channel can't push to 50k sockets per message, yet a member who has been away still needs accurate unread and mention counts. Shape: a WebSocket gateway fleet, a per-channel event log preserving in-channel order, a fan-out service, an unread/mention counter store, and a permission service gating membership. I'd go deep on fan-out policy by size, push to online members of small channels, pull-on-open for large ones. I'd delegate reaction storms to the realtime team; my prior is coalescing reaction deltas per channel per second, because a celebrity emoji burst is write amplification, not a delivery problem."

**Why it scores:** names the channel-size fan-out split and treats unread state as a first-class store, not an afterthought. **Red flag avoided:** designing WhatsApp 1:1 delivery when the prompt is workspace fan-out.

</details>

#### D14. "Design a Zoom-style video conferencing system."

**Family:** real-time media · **Reps:** reported across infra loops · **The turn:** a sub-200ms latency floor forbids reliable delivery, so quality adapts, and that fights cost per meeting-minute

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: real-time multiparty video, so the media path is the system and signaling is a side channel; I'd branch recording and transcription offline and focus on live routing. This isn't read:write, it's fan-out per sender: in an 8-person call each sender's stream reaches 7 receivers. Assume 10M concurrent meetings at 8 participants average, so roughly 80M live media streams at once. The turn: mouth-to-ear must stay under about 200ms, which forbids TCP-style retransmission, so instead of guaranteeing delivery I adapt quality, and that fights infrastructure cost per meeting-minute. Shape: a signaling service, a geo-placed SFU (selective forwarding unit) fleet, simulcast where the client sends three quality layers and the SFU picks per receiver, TURN relays for NAT traversal, and a recording pipeline tapped off the SFU. I'd go deep on whether to route (SFU), mix (MCU, a multipoint control unit), or mesh, and on simulcast selection. I'd delegate codec choice to the media team; my prior is VP9 or AV1 for bandwidth, because paying compute to save egress usually wins at this fan-out."

**Why it scores:** derives "no reliable delivery" from the latency floor before naming a component, and separates media from signaling. **Red flag avoided:** proposing TCP or a recording-first pipeline in the live path.

</details>

#### D15. "Design a Twitch-style live streaming system."

**Family:** live streaming · **Reps:** high-frequency at media/CDN shops · **The turn:** seconds-level glass-to-glass latency vs the transcode and one-to-a-million CDN economics

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: live one-to-many streaming, so the design is a broadcast tree, not a conferencing mesh; I'd split the video plane from chat entirely and treat them as two systems sharing a page. The asymmetry is one ingest to a million egress: a single streamer's frame reaches every viewer. Assume 100k concurrent channels, most tiny, but one spiking to 3M concurrent viewers, each channel needing a transcode ladder. The turn: viewers want glass-to-glass latency in seconds, but the transcode ladder and the one-to-a-million CDN fan-out are where the money burns. Shape: RTMP (real-time messaging protocol) ingest, a per-channel transcode ladder, segmented delivery over low-latency HLS (HTTP live streaming) through the CDN, a viewer edge, and chat as its own pub/sub system with slow-mode. I'd go deep on the transcode-cost gate, only transcoding channels that actually have viewers and sizing the ladder by audience. I'd delegate chat moderation to the trust team; my prior is per-channel rate limits plus async classification, because moderation tolerates more latency than delivery."

**Why it scores:** leads with the one-to-a-million egress asymmetry and puts the cost gate on transcode, where the money is. **Red flag avoided:** transcoding every channel including the ones with zero viewers.

</details>

#### D16. "Design the backend for a 100-player battle-royale game."

**Family:** real-time gaming · **Reps:** rising with live-service games · **The turn:** an authoritative server tick vs the per-player bandwidth budget, resolved by interest management

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: an authoritative-server battle royale, so the server owns the simulation and clients predict; I'd cut social and progression and focus on the match runtime. It's write-heavy oddly: every player streams inputs and the server streams state back 20 times a second. Assume 100 players per match, a 60 Hz simulation collapsed to a 20 Hz network tick, and only about 30 of the 100 entities relevant to any one player. The turn: the server must stay authoritative for anti-cheat and consistency, but replicating full world state to 100 clients 20 times a second blows the bandwidth budget, so interest management decides what each client even hears about. Shape: a matchmaker, a game-server fleet with one process per match bin-packed onto hosts, delta replication with a spatial-grid interest filter, lag compensation, and a telemetry/anti-cheat pipeline. I'd go deep on interest management and the per-tick byte budget. I'd delegate anti-cheat modeling to the security team; my prior is server-side statistical detection over client attestation, because trusting the client is a losing game."

**Why it scores:** makes the server authoritative and then names interest management as the thing that makes the bandwidth budget close. **Red flag avoided:** trusting the client or replicating full world state to every player.

</details>

#### D17. "Design a matchmaking service for an online game."

**Family:** real-time gaming · **Reps:** common at games companies · **The turn:** tight rating bands (match quality) vs queue time, and the bands must widen with wait

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: matchmaking, so the job is forming balanced groups from a live queue, not running the matches; I'd defer the session handoff and focus on match formation. It's not read:write, it's pool liquidity: quality depends on how many players sit near your rating right now. Assume 1M concurrent players in queue at peak, a target median wait under 60 seconds, and rating bands that widen the longer you wait. The turn: tight bands give better matches but longer queues, so I trade quality against wait by widening the acceptable band over time, and that widening is exactly what smurfs and dodgers exploit. Shape: regional queues to respect latency, a rating service in the Elo or TrueSkill family, a band-widening scheduler, a backfill path for abandoned slots, and a handoff to the server allocator. I'd go deep on the widening function and its abuse surface. I'd delegate the rating model to data science; my prior is a TrueSkill-style model with uncertainty, because raw Elo converges too slowly for new accounts."

**Why it scores:** frames matchmaking as pool liquidity and ties band-widening to its own abuse surface. **Red flag avoided:** optimizing match quality with no account of queue time.

</details>

#### D18. "Design a presence service (online status) for 500M users."

**Family:** real-time infra · **Reps:** classic warm-up prompt · **The turn:** heartbeat write volume vs acceptable staleness, the textbook lossy-state problem

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: presence, so the deliverable is a fuzzy online/offline signal plus last-seen, not a durable record; I'd fold typing indicators into the same mechanism and treat this as deliberately lossy state. The read side is fan-out to watchers, the write side is a relentless heartbeat drumbeat. Assume 500M users but 100M concurrent and a heartbeat every 30 seconds, which is about 3.3M writes per second of pure liveness. The turn: that heartbeat volume against acceptable staleness is the whole design, because presence is the textbook case where a few seconds of wrongness is free and durability is wasted. Shape: connection gateways owning liveness locally, a sharded in-memory presence store with TTL (time to live) entries that expire on missed heartbeats, subscription fan-out only to a user's friends-online list, batched updates, and last-seen persisted lazily. I'd go deep on why you never do a durable write per heartbeat, the cost math is the punchline. I'd delegate push-wake behavior to the client team; my prior is coalescing presence into existing pushes, because waking a radio for presence alone drains battery for nothing."

**Why it scores:** refuses a durable write per heartbeat and justifies lossy state with the cost math. **Red flag avoided:** persisting every heartbeat and calling presence a database problem.

</details>

## Geo, mobility, and fleets

These seven drill the physical world, where GPS, cellular, and grid limits make availability and privacy the dominant constraints. The recurring turn is a real-world edge (a flaky radio, a stranger's phone, an electrical panel) that a clean cloud design has to bend around.

#### D19. "Design a Strava-style activity-tracking platform."

**Family:** geo / mobility · **Reps:** reported at fitness and mapping shops · **The turn:** bursty offline-uploaded GPS batches, with social freshness vs segment-matching compute vs privacy zones

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: an activity platform, so the core is ingesting a finished workout and matching it to segments and a feed, not live tracking; I'd cut live location sharing and focus on post-activity processing. It's write-then-read: an activity is written once as a batch, then read by the athlete, their followers, and segment leaderboards. Assume 100M users, 30M activities per day, each roughly 2,000 GPS (global positioning system) points, so around 60 billion points a day. The turn: GPS arrives as bursty offline-uploaded batches, not a live stream, and the real tension is social freshness against segment-matching compute against privacy zones that must hide a user's home before anything is public. Shape: an ingest path with dedupe for re-uploads, an activity store, a segment-matching pipeline that map-matches each track against a segment index, feed fan-out, and a privacy-zone filter that runs before any exposure. I'd go deep on segment matching, the geo-index and candidate pruning that stop it becoming a 30M-times-all-segments join. I'd delegate route simplification to the geo team; my prior is Douglas-Peucker with a tuned epsilon, because we store far more precision than a map needs."

**Why it scores:** catches that GPS is batch-uploaded, not live, and puts the privacy-zone filter before any public exposure. **Red flag avoided:** designing a live-tracking firehose for data that arrives after the workout.

</details>

#### D20. "Design a Tinder-style matching system."

**Family:** geo / social · **Reps:** high-frequency dating/social prompt · **The turn:** precomputed geo-sharded decks (feed latency) vs swipe-write volume and the instant mutual-match check

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: a swipe-matching product, so the two operations are serve-a-deck and record-a-swipe, and a match is just a mutual right-swipe; I'd push chat downstream and focus on deck serving and match detection. Reads and writes run close: every deck served is many profiles read, every swipe is a write. Assume 50M DAU (daily active users), 2 billion swipes a day, roughly 25k per second, and a match check that must feel instant when both people swiped right. The turn: decks want to be precomputed and geo-sharded for feed latency, but swipe volume is huge and the mutual-match check has to stay cheap on the write path. Shape: a geo-sharded profile index, deck generation that's mostly batch with fresh candidates injected, swipe ingestion, a match detector that checks the reverse edge in a Redis set, and a match/chat service. I'd go deep on the precompute-versus-live-query trade, since it decides both cost and freshness. I'd delegate the ranking model to data science; my prior is two-tower retrieval, because pairwise scoring every candidate won't hold 25k per second."

**Why it scores:** names the deck-precompute-vs-live-query trade and keeps the mutual-match check cheap on the write path. **Red flag avoided:** a live geo query per deck at 25k swipes per second.

</details>

#### D21. "Design an IoT device-management platform for 10M devices."

**Family:** IoT / edge · **Reps:** rising 2025-26 platform staple · **The turn:** millions of idle persistent connections vs command fan-out to offline devices

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: device management, so the core is a registry, a connection layer, and a desired-versus-reported state model, not device firmware; I'd keep the update orchestrator as a mention and focus on connectivity and state. The traffic is many tiny writes: millions of mostly-idle sockets each dribbling a small telemetry message. Assume 10M devices, one telemetry message per minute, about 170k messages per second, and commands that must survive a device offline for hours. The turn: holding millions of idle persistent connections with tiny payloads is a connection-count problem, while command delivery to offline devices forces a desired-versus-reported reconciliation. Shape: an MQTT (message queuing telemetry transport) gateway fleet holding the connections, a device registry with shadow state, a telemetry pipeline landing in time-series storage, a command service with per-device queues, and an OTA (over the air) update orchestrator I'll only name. I'd go deep on shadow-state reconciliation, how desired and reported converge when a device reconnects. I'd delegate certificate provisioning at manufacture to security; my prior is per-device certs burned in at the factory, because one shared fleet credential is a single breach from catastrophe."

**Why it scores:** frames the load as connection count plus tiny writes and centers desired-vs-reported reconciliation. **Red flag avoided:** treating 10M idle sockets as a throughput problem instead of a connection-count one.

</details>

#### D22. "Design a bike/scooter-share platform."

**Family:** IoT / mobility · **Reps:** reported at micromobility shops · **The turn:** a physical-world unlock over flaky cellular vs rebalancing's appetite for rich telemetry

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: a dockless vehicle-share platform, so the make-or-break flow is unlock-and-start against a physical vehicle on flaky cellular, not the analytics; I'd push rebalancing to a batch job and focus on the ride lifecycle. Writes are the ride state machine, reads are the map of nearby vehicles. Assume 500k vehicles, 2M rides a day, and an unlock that must complete at p99 under 3 seconds despite a flaky modem. The turn: the unlock is a physical-world availability requirement over unreliable cellular, while rebalancing wants rich telemetry, and those pull the connectivity design opposite ways. Shape: a vehicle Internet of Things (IoT) link with an offline unlock fallback via a short-lived BLE (Bluetooth Low Energy) token the phone presents, a ride service as a state machine, a geo index of available vehicles, pricing and payment, and a batch rebalancing planner. I'd go deep on layering the unlock path so it degrades gracefully on a bad network. I'd delegate demand forecasting to data science; my prior is a simple gravity model over historical trips, because operational rebalancing doesn't need a deep net to beat doing nothing."

**Why it scores:** protects the physical unlock path with a degraded fallback and defers rebalancing. **Red flag avoided:** assuming reliable cellular for a safety-critical unlock.

</details>

#### D23. "Design a find-my-device network from crowdsourced sightings."

**Family:** privacy / geo · **Reps:** rising, privacy-forward prompt · **The turn:** locating a device through strangers' phones without anyone learning who saw whom

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: a crowdsourced finding network, so the system turns a billion bystander phones into anonymous beacon reporters and the deliverable is a location only the owner can read; I'd cut the finder UI and focus on the report-and-retrieval crypto. It's write-heavy from reporters, read-light from owners. Assume 1 billion reporter devices emitting rotating beacons, and 10M lost-device queries a day from owners. The turn: I have to locate a device through strangers' phones without anyone, the platform included, learning who saw whom, so privacy isn't bolted on, it is the architecture. Shape: rotating device keys so a beacon can't be tracked over time, sighting reports encrypted to the owner's public key before upload, anonymous upload that strips reporter identity, owner-side decryption, and anti-stalking detection. I'd go deep on the key-rotation and encryption scheme, specifically why the server can't correlate a beacon to an owner or a reporter. I'd delegate anti-stalking heuristics to the safety team; my prior is on-device unwanted-tracker alerts, because detection has to run where the victim's phone is, not on a server that sees nothing by design."

**Why it scores:** makes privacy the architecture, not a policy, and explains why the server can't correlate. **Red flag avoided:** an anonymized-but-still-linkable report the platform could de-anonymize.

</details>

#### D24. "Design a surge-pricing service."

**Family:** geo / marketplace · **Reps:** classic Uber-family prompt · **The turn:** reactivity to supply-demand imbalance vs price oscillation from driver herding

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: a surge-pricing service, so the job is computing a per-area price multiplier from live supply and demand, not running the marketplace; I'd cut fare calculation itself and focus on the pricing control loop. It's streaming-in, publish-out: demand and supply events in, a multiplier per cell out. Assume 500 cities, each carved into hex-grid cells, with a pricing decision recomputed every 30 seconds per cell. The turn: the price must react to real supply-demand imbalance, but a naive reaction oscillates, because a spike herds drivers into the cell, which crashes the price, which sends them away, so smoothing fights responsiveness. Shape: demand and supply event streams, per-cell imbalance computation on a hex grid like H3, a smoothing controller that bounds step changes, price publication to riders and drivers, and guardrails plus an audit trail. I'd go deep on the control-loop design, capping gradients so price can't swing hard enough to self-oscillate. I'd delegate the elasticity model to the economics team; my prior is a per-cell learned demand curve, because one global elasticity constant misprices dense downtowns and quiet suburbs alike."

**Why it scores:** identifies the oscillation feedback loop and answers it with a bounded-gradient controller. **Red flag avoided:** a reactive multiplier with no smoothing that self-oscillates.

</details>

#### D25. "Design an EV-charging network platform."

**Family:** IoT / energy · **Reps:** rising with electrification · **The turn:** high-value low-count chargers with hard payment and grid limits; reservation vs opportunistic arrival

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: an EV-charging network, so the core is a charger fleet, a session-and-payment path, and per-site power management, not the cars; I'd defer dynamic tariffs and focus on sessions and site load. Unlike consumer IoT this is high-value and low-count: a hundred thousand chargers, not ten million sensors. Assume 100k chargers, 1M sessions a day, and a charger-uptime SLO (service level objective) of 99%, because a dead charger is a stranded driver. The turn: the fleet is high-value low-count IoT with hard payment and grid constraints, and the product forks on reservation versus opportunistic arrival, which changes everything downstream. Shape: charger connectivity over an OCPP (open charge point protocol) gateway, a session and payment service, an availability and reservation service, per-site load management respecting the grid limit, and fleet-health monitoring with dispatch. I'd go deep on site-level load balancing, since active sessions at a site can't exceed the electrical panel feeding it. I'd delegate dynamic tariff design to the energy team; my prior is time-of-use pricing tied to grid signals, because flattening peak draw is where the utility economics live."

**Why it scores:** separates high-value low-count chargers from consumer IoT and puts site load against the panel limit. **Red flag avoided:** ignoring the grid constraint and overdrawing a site.

</details>

## Commerce, fintech, and marketplaces

These prompts all pivot on money and scarce inventory, where a single wrong write costs trust or cash. The recurring tension is correctness under contention (no oversell, exactly-once redemption, exactly-once bookkeeping) against the spikes and availability a live marketplace demands.

#### D26. "Design a flash-sale system: 100k units, 10M buyers, one minute."

**Family:** commerce / high-contention · **Reps:** classic, still high-frequency · **The turn:** absolute no-oversell on one counter vs surviving a 100x spike, and a fairness queue vs conversion

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: sell 100k units to 10M people in one minute and never confirm the 100,001st order; I'd cut browsing and treat this as pure admission-plus-counter, no seat map. The asymmetry is brutal, 10M reads on one product page against maybe 100k successful writes, so reads fan out to cache and I guard the single number that matters. Assume 10M arrive at T0, 100k inventory, checkout about two minutes, so once a waiting room meters admission the write path survives only a few hundred atomic decrements per second. The turn: absolute no-oversell fights surviving a 100x spike, and a fairness queue fights conversion. Shape: an edge waiting room issuing queue tokens, an inventory service doing atomic decrements (Redis Lua or a single-writer log), reservation TTL (time to live) returning abandoned units to the pool, an async order pipeline, and bot defense at the door. I'd go deep on the decrement path and reservation expiry, where oversell hides. I'd delegate bot-detection signals to the trust team; my prior is device fingerprint plus velocity scoring, because a CAPTCHA alone just taxes real buyers."

**Why it scores:** it isolates the one contended number and sizes the write path after the waiting room, instead of trying to make 10M requests consistent. **Red flag avoided:** promising a transactional database will "just handle" 10M concurrent decrements.

</details>

#### D27. "Design a shopping cart and checkout."

**Family:** commerce / availability vs consistency · **Reps:** classic, still high-frequency · **The turn:** a cart that must never reject a write vs a checkout that needs one consistent snapshot

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: two products glued together, a cart that must never reject a write and a checkout that must be exactly right; I'd build them as separate consistency regimes rather than one store. Reads and writes are both cart-side and cheap; the rare, expensive, must-be-correct event is the checkout. Assume 50M active carts and a peak of 1M checkouts per hour, roughly 300 per second, tiny compared to the add-to-cart chatter, so I can spend real consistency budget only at order placement. The turn: the cart wants Dynamo-style always-writable availability, but checkout needs one consistent snapshot of price, stock, and payment. Shape: a highly available key-value cart store with a merge policy, pricing and promotion evaluated at checkout time (not at add), inventory reserved at order placement not cart-add, an order orchestrator running a saga, and payment integration. I'd go deep on the cart-merge policy, because add-wins beats last-write-wins when two devices diverge. I'd delegate the promotion-rule engine to the pricing team; my prior is a declarative rule set evaluated server-side, because client-computed discounts get gamed."

**Why it scores:** it splits the availability regime from the consistency regime and moves inventory reservation to order time, the two calls this problem exists to test. **Red flag avoided:** reserving stock at add-to-cart, which locks inventory behind abandoned carts.

</details>

#### D28. "Design a Robinhood-style retail brokerage."

**Family:** fintech / dual-spine · **Reps:** rising 2025-26 platform staple · **The turn:** best-effort quote fan-out vs a correctness-and-audit order path that must not share a spine with it

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: this is the broker, not the exchange, so I'm not building a matching engine; I'm building the customer's front door to the market, and the two halves have opposite requirements. Quotes are read-heavy fan-out to everyone; orders are a thin, sacred write stream. Assume 10M DAU (daily active users), a market-open spike of about 50x, and quotes streaming to roughly 1M concurrent viewers, so the quote tier moves millions of updates a second while the order tier sees only thousands. The turn: quote fan-out is best-effort and can drop ticks, but the order path is correctness-and-audit and must never lose or double a fill, so they cannot share a spine. Shape: a market-data ingest and fan-out tier with coalesced updates, an order-management system that validates, journals, and acknowledges, execution routing to venues, a positions-and-ledger service, and pre-trade risk checks. I'd go deep on order-path integrity, idempotent submission and exactly-once bookkeeping replayed from an append-only journal. I'd delegate venue-routing to the execution team; my prior is smart routing on price-time with a fallback venue, because single-venue routing fails at open."

**Why it scores:** it names the broker/exchange boundary up front and refuses to let the lossy quote tier touch the journaled order tier. **Red flag avoided:** designing a matching engine, which is the venue's job, not the broker's.

</details>

#### D29. "Design a multi-warehouse inventory system."

**Family:** commerce / distributed counting · **Reps:** classic, still high-frequency · **The turn:** sellable-count accuracy across warehouses vs write contention, with asymmetric costs to over- and undercounting

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: one sellable number per item across 50 warehouses, correct enough to sell against but never a bottleneck; I'd cut the fantasy of a single globally-consistent counter and make each warehouse authoritative for its stock. Writes dominate, item movements from receiving, picking, and returns, while the read is a cheap cached sellable view. Assume 10M SKUs (stock-keeping units), 50 warehouses, and about 5k stock updates per second, so a central strongly-consistent counter would serialize the fleet. The turn: sellable-count accuracy fights write contention and partitions, and the two errors are asymmetric, overselling costs trust while undercounting loses sales. Shape: per-warehouse authoritative counts, an async central aggregation with bounded lag, a reservation ledger claiming units against a chosen warehouse at order time, reconciliation jobs, and per-SKU safety-stock buffers. I'd go deep on the buffer policy, how much to hold back while the aggregation lags, because that dial trades oversell risk against lost sales. I'd delegate demand-based buffer tuning to the supply-chain data team; my prior is buffer sized to SKU velocity times aggregation lag, because flat buffers waste fast movers."

**Why it scores:** it localizes authority per warehouse and turns the consistency gap into an explicit, tunable safety buffer instead of pretending the aggregate is real-time. **Red flag avoided:** a single global inventory row that every warehouse contends on.

</details>

#### D30. "Design a Craigslist-scale classifieds marketplace."

**Family:** marketplace / trust-first · **Reps:** classic, still high-frequency · **The turn:** the infrastructure is deliberately boring and read-heavy, so the real weight sits in abuse and identity protection

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: post a listing, search nearby, message a seller; I'd cut recommendations and fancy ranking and say out loud that the hard problem here is trust and abuse, not scale. It is overwhelmingly read-heavy, and the honest move is to admit the infrastructure is boring. Assume 100M active listings, 60M users a month, and a read:write ratio around 100:1, so a geo-sharded store fronted by cache handles the traffic without heroics. The turn: the system is deliberately unglamorous and geo-partitioned, so the design's real weight sits in abuse prevention and identity protection, not throughput. Shape: a geo-partitioned listing store with search, an image pipeline, a posting flow gated by rate and abuse checks, an anonymized messaging relay, and a moderation queue with reporting. I'd go deep on the anonymized buyer-seller relay, so neither party learns the other's real contact until they choose to share it. I'd delegate category-specific fraud rules to the trust team; my prior is per-category heuristics over a shared graph, because a rental scam looks nothing like a fake-goods scam."

**Why it scores:** naming that the scale is easy and the trust problem is hard is exactly the senior read of this deceptively simple prompt. **Red flag avoided:** over-engineering the storage tier while ignoring that abuse is the product-killer.

</details>

#### D31. "Design a coupon and promo redemption service."

**Family:** commerce / idempotency under hot keys · **Reps:** classic, still high-frequency · **The turn:** exactly-once redemption on a viral hot code vs flexible rule evaluation inside the checkout latency budget

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: redeem a code exactly once per eligible user while evaluating messy rules fast; I'd cut coupon creation UX and focus on the claim-and-evaluate hot path. Reads (does this code apply) vastly outnumber writes (a committed redemption), but the write is the one that must be exactly-once. Assume one code goes viral at 200k redemptions per minute, roughly 3k per second on a single key, and rule evaluation must land under 20ms inside checkout. The turn: idempotent single-use redemption on a hot code fights flexible rule evaluation (stacking, eligibility, budget caps) at checkout latency. Shape: a code registry holding both bulk-generated and single hot codes, a redemption ledger doing an atomic claim keyed on user-plus-code, a rule engine for eligibility and stacking, a budget circuit breaker, and fraud analytics. I'd go deep on the hot-code claim path, sharded claim pools so one viral code doesn't serialize on one row. I'd delegate stacking-rule product policy to the promotions team; my prior is deny-stacking-by-default with explicit allow-lists, because open stacking is where margin quietly leaks."

**Why it scores:** it separates the exactly-once claim (a concurrency problem) from rule evaluation (a latency problem) and shards the hot code. **Red flag avoided:** a single-row atomic counter per code that collapses when one code goes viral.

</details>

## Search, discovery, and content

These prompts drill the freshness-versus-quality axis on read-mostly content systems, where the write path (crawl, index, edit, play-event) is the hard part hiding behind an easy read. The recurring tension is getting new content visible fast against grouping, ranking, and invalidating it correctly.

#### D32. "Design a news aggregator like Google News."

**Family:** content / freshness vs clustering · **Reps:** classic, still high-frequency · **The turn:** crawl-to-visible freshness for breaking news vs the clustering quality that groups the same story from hundreds of outlets

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: crawl the news web, group the same story from many outlets, and rank clusters, with personalization layered on top rather than replacing the shared front page. It's read-mostly for consumers, but the ingest side is a steady write-and-cluster firehose. Assume 100k sources and about 2M articles a day, roughly 25 per second averaged, and a breaking-news target of under 5 minutes from publish to visible. The turn: crawl-to-visible freshness for breaking news fights clustering and dedupe quality, since the same story lands from 400 outlets and grouping them well takes signal that accrues over minutes. Shape: a prioritized crawler with source tiers, an extraction plus dedupe-and-clustering stage (embeddings with locality-sensitive hashing), per-cluster ranking, a personalization layer, and push alerts for breaking stories. I'd go deep on incremental clustering under freshness pressure, assigning a new article to a live cluster in seconds without waiting for the batch. I'd delegate source-authority scoring to the ranking team; my prior is a slow-moving reputation prior per source, because trusting recency alone lets low-quality outlets set the narrative."

**Why it scores:** it treats clustering as the freshness-constrained hard part and keeps personalization as a layer, not the spine. **Red flag avoided:** a nightly batch clustering job that makes breaking news minutes-to-hours late.

</details>

#### D33. "Design full-text search over 100B posts."

**Family:** search / index sharding · **Reps:** classic, still high-frequency · **The turn:** document-sharded (write-friendly, query fans out to all shards) vs term-sharded (query-friendly, writes fan out)

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: full-text search over 100B short posts with near-real-time visibility; I'd cut deep relevance for the opening and nail the indexing and sharding spine first. Queries are the read, indexing is the relentless write, and both matter. Assume 10k query QPS, 500M new documents a day (roughly 6k per second), and a freshness target of under 10 seconds from post to searchable. The turn: document-sharded indexing is write-friendly but every query fans out to all shards, while term-sharded indexing is query-friendly but writes fan out across shards; at this write rate document-sharding wins, and I'd say so. Shape: an ingestion and analysis pipeline, document-sharded inverted indexes each with an in-memory recent segment, query fan-out with top-K merge, a ranking stage, and index lifecycle handling segment merges and tiering. I'd go deep on the doc-versus-term sharding argument with the fan-out math, because that one call sets the whole latency and cost profile. I'd delegate the relevance model to the search-quality team; my prior is cheap first-pass retrieval feeding a learned reranker, because ranking every shard's long tail is wasted compute."

**Why it scores:** it makes the doc-vs-term sharding choice explicit and defends document-sharding from the write rate, the load-bearing decision. **Red flag avoided:** hand-waving "we'll use Elasticsearch" without stating the sharding trade-off it hides.

</details>

#### D34. "Design a Spotify-style music streaming service."

**Family:** content / accounting-shaped · **Reps:** classic, still high-frequency · **The turn:** storage is cheap, so licensing windows, offline sync, and royalty-grade play accounting shape the system, not bytes

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: stream a track anywhere and count the play correctly for royalties; I'd cut the recommendation engine and note that unlike video the catalog is small and cheap to store. It's read-heavy delivery with a load-bearing accounting write. Assume 100M tracks at roughly 5 PB total (tiny vs video), 500M users, and about 1B streams a day, so delivery is a CDN problem but the play-event stream is 1B accountable records daily. The turn: storage is cheap, so the system is shaped by licensing windows, offline sync, and royalty-grade play accounting, not by bytes. Shape: a catalog and licensing service enforcing region windows, CDN delivery of near-whole files, a client cache with offline sync under DRM (digital rights management), a play-event pipeline that counts a play only past a 30-second threshold, and recommendations. I'd go deep on royalty-grade play counting, deduping offline replays and resisting stream fraud, because that number pays artists and gets audited. I'd delegate the recommendation stack to the personalization team; my prior is candidate generation plus a reranker, because it's a separate discipline from delivery."

**Why it scores:** it flips the expected "how do we store all the audio" framing to the actual hard problem, auditable play counting. **Red flag avoided:** spending the whole answer on CDN delivery, which is the easy, solved part here.

</details>

#### D35. "Design a Reddit-style forum."

**Family:** content / trees and ranking · **Reps:** classic, still high-frequency · **The turn:** unbounded-depth comment trees vs cheap precomputed listings, with vote velocity as both signal and abuse surface

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: nested comment threads plus ranked listings across thousands of communities; I'd cut search and chat and center the design on the comment tree and the ranked feed. It's extremely read-heavy, with votes as a high-volume signal write. Assume 500M monthly users and a hot post pulling 100k comments in an hour, roughly 30 per second onto one thread, so a single post's tree can be enormous and deeply nested. The turn: comment trees are unbounded-depth and expensive to read, while ranked listings must be cheap and precomputed, and vote velocity is simultaneously the ranking signal and the main abuse surface. Shape: a post-and-comment store using materialized paths with a pagination strategy, ranking pipelines precomputing hot and top per community, vote ingestion with anti-brigading, a cache hierarchy, and moderation tooling. I'd go deep on comment-tree pagination, because naive recursive reads of a 100k-comment thread die, so I load top-level pages and lazy-expand subtrees. I'd delegate ranking-decay constants to the ranking team; my prior is a time-decayed vote score tuned per community, because one global decay misfits fast and slow subreddits."

**Why it scores:** it identifies comment-tree pagination as the read that dies at scale and treats vote velocity as a dual-use signal. **Red flag avoided:** recursively reading a whole comment tree per page load.

</details>

#### D36. "Design Wikipedia."

**Family:** content / extreme read-skew · **Reps:** classic, still high-frequency · **The turn:** trivially cacheable reads vs anonymous-edit correctness and the invalidation fan-out when a heavily-linked template changes

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: serve articles fast and let anyone edit them correctly; I'd cut discussion and media infrastructure and focus on the read cache and the edit-to-invalidation path. This is the most read-skewed system in the set. Assume 60k reads per second at peak against maybe 2 edits per second, a ratio near 10,000:1, and one edit to a heavily-linked template can invalidate 5M pages at once. The turn: the design is trivially cacheable for reads, but anonymous-edit correctness and the fan-out when a popular template changes are what actually strain it. Shape: a parser and render pipeline feeding a parsed-page cache, edge caching with a purge bus, a revision store keeping full history, edit-conflict handling, and a template dependency graph driving invalidation. I'd go deep on the template-invalidation fan-out, doing lazy re-render with queued purges so a 5M-page cascade doesn't stampede the render tier. I'd delegate the vandalism-detection model to the trust team; my prior is a scored-edit queue with reputation weighting, because reverting after the fact is worse than holding a suspect edit for review."

**Why it scores:** it makes the read side trivial in one line and spends the design budget on template-invalidation fan-out, the actual hard problem. **Red flag avoided:** treating a 5M-page template change as a synchronous purge that stampedes the render tier.

</details>

## Trust, safety, and operations

These systems all put a hard correctness or safety guarantee on a path that runs on every action, then fight it against a latency budget or an adaptive adversary. The drill is to name which guarantee is non-negotiable before naming a single box.

#### D37. "Design a real-time payment fraud detection system."

**Family:** trust & safety · **Reps:** classic, still high-frequency · **The turn:** the inline decision budget forbids computing fresh features, yet the score is only as good as its freshest features

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: score every transaction inline and block or allow, pushing chargeback disputes and the investigator UI to separate systems. The asymmetry is unusual: each write (a transaction) forces a read of that user's recent history, so it's join-heavy lookups, not a read cache. Assume 10k transactions a second, an inline budget of 50 to 100ms because the authorization blocks on me, and a fraud base rate near 0.1%, so false positives dominate the pain: a wrong block loses a customer, a wrong pass loses cash. The turn: the score is only as good as the freshest features, this card's velocity in the last 60 seconds, which I can't compute inline in that budget. Shape: an inline scorer over precomputed features, a streaming feature store of velocity counters, a rules-plus-model ensemble emitting reason codes, an async review queue, and a training feedback loop. I'd go deep on the feature-freshness pipeline, the streaming counters kept roughly exactly-once so fraud can't hide in double-counted noise. I'd delegate the model architecture to fraud science; my prior is gradient-boosted trees over a deep net, because reason codes and audit beat the last accuracy point."

**Why it scores:** the 0.1% base rate is stated as the reason false positives dominate, so the whole design bends toward explainable blocks. **Red flag avoided:** promising an inline model that recomputes aggregates per request inside a 50ms budget.

</details>

#### D38. "Design abuse and fake-review detection for a marketplace."

**Family:** trust & safety · **Reps:** classic, still high-frequency · **The turn:** adversaries adapt so static rules rot in weeks, but every enforcement action must stay explainable and appealable

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: detect fake and abusive reviews and take graduated action, cutting the seller dispute portal and legal takedowns to adjacent teams. Every review is scored on write, but the heavy work (label collection, graph rebuilds) is background reads, so the write path stays cheap and analysis runs async. Assume 5M reviews a day, roughly 60 a second average with campaign spikes 20x that, and a target under 1% false positives on enforcement, because wrongly banning a legitimate seller is the expensive mistake. The turn: adversaries adapt, so static rules rot in weeks, yet every model I ship must stay explainable and appealable. Shape: an ingestion scorer over content, behavioral, and graph features, a reviewer-seller graph service hunting collusion rings, an enforcement ladder from rank-down to hold to ban with appeals, adversarial-drift monitoring, and human-review sampling for ground truth. I'd go deep on graph-based ring detection, the dense subgraphs where a handful of accounts keep reviewing the same sellers. I'd delegate the policy thresholds to trust-and-safety; my prior is a conservative ladder with a human in the loop before permanent bans, because a false ban is a lawsuit and a headline."

**Why it scores:** the sub-1% false-positive target is named as the reason for a graduated, appealable ladder rather than instant bans. **Red flag avoided:** a static rules engine presented as if adversaries won't route around it next week.

</details>

#### D39. "Design an audit-logging platform for a regulated company."

**Family:** operations & compliance · **Reps:** rising 2025-26 platform staple · **The turn:** the log is legal evidence so it must be tamper-evident and never drop, yet it sits on the write path of every product action

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: capture every security-relevant action as an immutable, tamper-evident record, cutting general application logging and metrics, which tolerate sampling, to a separate pipeline. This is write-once-read-many: writes are relentless, reads are rare (an auditor, an investigation), so I optimize the write path for completeness and the read path for scoped correctness, not throughput. Assume 500k events a second at peak, 7-year retention, and roughly 200 bytes an event, so about 100 MB a second and low petabytes a year landing in WORM (write once read many) storage. The turn: this log is legal evidence, so it must be tamper-evident and never drop under load, yet it rides the write path of every product action. Shape: thin SDK interceptors, a durable ingest tier that backpressures rather than samples, hash-chained Merkle segments for tamper evidence, tiered storage (hot 30 days, then cold object store), and a scoped query service that audits its own reads. I'd go deep on the tamper-evidence design, hash-chaining each segment and anchoring digests periodically to an external witness so a deletion is provable. I'd delegate legal-hold workflows to compliance; my prior is declarative retention config over a WORM substrate, because ad hoc deletion is how audit logs lose evidentiary value."

**Why it scores:** the write-once-read-many framing justifies backpressure-never-drop ingest and the tamper-evidence chain before any storage is named. **Red flag avoided:** a sampled log pipeline that quietly drops events under the exact load spike an incident produces.

</details>

#### D40. "Design an electronic voting system."

**Family:** trust & safety · **Reps:** reported in security-heavy loops · **The turn:** a voter must verify their vote counted, yet no one can link a voter to their ballot, and the honest answer names what you would not build

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: authenticate eligible voters, accept one ballot each, and produce a verifiable tally, cutting voter registration itself to the existing electoral roll. The load is trivial by web standards, bursty writes and near-zero reads, which is exactly why I refuse to let scale distract from the real problem. Assume 50M voters over a 12-hour window, so roughly 1,200 ballots a second average and maybe 10x at peaks, results wanted within hours; the numbers are the easy part here. The turn: a voter must confirm their vote was counted, yet no one, including the operator, can link a voter to their ballot, and the honest answer names what I would not build. Shape: an eligibility and authentication service kept strictly separate from the ballot path, an end-to-end verifiable scheme (encrypted ballots, a mixnet or homomorphic tally), an append-only public bulletin board, independent verifiers, and a paper-trail fallback. I'd go deep on the verifiability-versus-secrecy scheme and say plainly that internet voting's risk profile is worse than in-person paper, so I'd anchor to a voter-verified paper record. I'd delegate the cryptographic protocol review to external academic auditors; my prior is that nothing ships without adversarial public review, because security-through-obscurity in elections is indefensible."

**Why it scores:** it treats the tiny scale as a tell, spends the time on the secrecy-versus-verifiability crypto, and states the judgment call about internet voting out loud. **Red flag avoided:** a slick all-online design that never mentions a paper trail or independent verification.

</details>

#### D41. "Design a Zanzibar-style authorization system."

**Family:** platform infra · **Reps:** rising 2025-26 platform staple · **The turn:** checks ride every read so caching is mandatory, but a freshly revoked permission must never resolve stale

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: answer 'can subject S do action A on object O?' for every product surface and store the relationships that imply it, cutting role-management UIs and provisioning to the product teams. This is overwhelmingly read: authorization checks ride on every content read, so writes (relationship changes) are rare by comparison. Assume 20M checks a second across the fleet at a p99 under 10ms, against maybe 20k relation writes a second, a thousand-to-one ratio that screams cache aggressively. The turn: caching for that read volume fights consistency, because a freshly revoked permission must not resolve stale, the new-enemy problem where a re-shared document leaks to someone just removed. Shape: a relation-tuple store (object#relation@subject), a check evaluator that walks usersets with rewrites, a heavy cache fronted by zookies (consistency tokens), a watch and changelog feeding index rebuilds, and per-namespace config. I'd go deep on the zookie design, the token that pins a check to a snapshot so caches stay safe without ever serving a stale allow. I'd delegate namespace modeling to each product team; my prior is a small reviewed schema per namespace over free-form relations, because permission bugs are almost always modeling mistakes, not engine bugs."

**Why it scores:** the thousand-to-one read ratio motivates caching, then the new-enemy problem explains why zookies exist, in that order. **Red flag avoided:** an aggressive cache with no consistency token, which serves revoked access until the entry expires.

</details>

#### D42. "Design an incident alerting and on-call platform."

**Family:** operations · **Reps:** classic, still high-frequency · **The turn:** a lost page is itself an outage so delivery must be at-least-once, yet delivering every alert during a storm buries the on-call

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: take signals from monitoring, decide who to wake and when, and drive escalation until acknowledged, cutting the metric collection itself to the systems that emit the alerts. The load is bursty writes with a trickle of reads (schedules, dashboards), so I size for the storm, not the steady state. Assume 100k alerts a minute at peak during a broad outage, roughly 1,700 a second, most of them duplicates of a handful of real incidents, and a notification target under 30 seconds. The turn: a lost page is itself an outage, so delivery must be at-least-once, yet blindly firing every alert during a storm buries the on-call in fatigue, so dedupe and grouping are not optional. Shape: an ingest tier that fingerprints and groups alerts, routing rules over an on-call schedule store, an escalation state machine backed by durable timers, multi-channel notification with provider failover, and an ack-resolve feedback loop. I'd go deep on the durable escalation timers, millions of pending fires that must survive a node dying mid-escalation without double-paging or skipping a step. I'd delegate the grouping model to the data team; my prior is deterministic fingerprint grouping first with ML as an overlay, because an on-call engineer must be able to explain why they got paged."

**Why it scores:** it names the storm as the sizing case and puts the escalation clock (durable timers) at the center as the real state machine. **Red flag avoided:** an at-most-once notification path where a dropped page during the storm goes unnoticed.

</details>

## AI and ML infrastructure: the 2025-26 wave

These are the systems the current loop now expects, where the tension is usually a hardware-cost or model-quality guarantee pulling against latency, freshness, or fan-out. Each one sits next to a covered walkthrough, so the drill is to stay on the infrastructure primitive and its own turn, not drift into the RAG or serving lessons.

#### D43. "Design a vector search database."

**Family:** AI infrastructure · **Reps:** rising 2025-26 platform staple · **The turn:** graph indexes are fast but RAM-hungry, and metadata filtering plus live upserts break the pretty benchmark

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: build the vector index and its query engine, nearest-neighbor search with metadata filters and live upserts, and I'd cut embedding generation and any retrieval-augmented-generation orchestration to the callers. This is read-heavy, but the writes are the interesting part: queries fan out to shards while upserts quietly force background index rebuilds. Assume 5B vectors at 768 dimensions, so about 15 TB raw before compression, 50k queries a second, and a recall-at-10 target above 0.95. The turn: recall fights latency and memory, because a graph index is fast but RAM-hungry, so I tier a hot HNSW (hierarchical navigable small world) layer against an IVF-PQ (inverted file with product quantization) compressed layer. Shape: sharded index nodes across those two tiers, an ingest and upsert path with background rebuilds, a filtered-search executor, a query router over replica groups, and heat-based tiering per collection. I'd go deep on filtered search, because naive post-filtering throws away most candidates and collapses recall, so the filter has to push into the graph walk. I'd delegate the quantization parameters to the retrieval team; my prior is PQ with a re-rank pass over full-precision vectors, because unre-ranked compression quietly loses the last few points of recall users notice."

**Why it scores:** the recall-at-0.95 target drives the two-tier index, and filtered search is called out as the thing that breaks benchmarks. **Red flag avoided:** quoting a benchmark QPS with no mention of filtering or upserts, the two things production actually stresses.

</details>

#### D44. "Design a GPU scheduler for a shared training and inference cluster."

**Family:** AI infrastructure · **Reps:** rising 2025-26 platform staple · **The turn:** utilization wants tight packing, but gang-scheduled training and spiky latency-bound inference want opposite things from the scheduler

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: place training and inference jobs on a shared GPU fleet to maximize utilization, cutting the model code and checkpoint format to the ML teams. There's barely a read:write axis here, the load is scheduling decisions, so I frame it as bin-packing under contention. Assume 10k GPUs, training jobs that need 64 to 512 GPUs gang-scheduled (all or nothing, or they deadlock), and inference pools that must scale up in under a minute when traffic spikes. The turn: utilization fights fairness, because GPUs are the scarcest dollar in the building, yet a long gang-scheduled training job and a spiky latency-bound inference pool want opposite things from the scheduler. Shape: a quota and priority layer where teams buy capacity, a gang scheduler with backfill, preemption governed by checkpoint contracts, separate autoscaling inference pools, and topology-aware bin-packing across NVLink domains. I'd go deep on gang scheduling with backfill, because without it fragmentation strands roughly 20% of the fleet as unusable gaps. I'd delegate the checkpoint framework to training-infra; my prior is mandatory periodic checkpointing so training is preemptible, because non-preemptible jobs make fair scheduling impossible."

**Why it scores:** it separates gang-scheduled training from latency-bound inference and ties preemptibility to checkpointing, the crux of GPU economics. **Red flag avoided:** treating GPUs like stateless web workers you can least-connection load-balance.

</details>

#### D45. "Design a system to push 500 GB model weights to 10,000 machines."

**Family:** AI infrastructure · **Reps:** rising 2025-26 platform staple · **The turn:** origin fan-out is 5 PB of egress against a minutes-level rollout, so distribution must go peer-to-peer with atomic version cutover

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: get a new model artifact onto every serving node fast and atomically, cutting model training and registry metadata to their own systems. This is a pure write-fan-out problem, one source object and 10,000 destinations, so the read side barely exists. Assume a 500 GB artifact and 10k nodes: pushing it from one origin is 5 PB of egress, which even at 100 Gbps is hours, against a rollout expectation measured in minutes. That number alone kills the naive design. The turn: I can't fan out from origin, so distribution goes peer-to-peer or through a caching tree, and the catch is version consistency, no node may serve a half-copied model. Shape: a content-addressed chunk store, a torrent-style swarm or tiered pull-through caches, per-rack seeders, a version manifest with atomic cutover (serve the old weights until the new set is complete and verified), and per-chunk integrity checks. I'd go deep on the swarm-versus-tiered-cache choice, running the egress math that drops origin load from 5 PB to a few hundred GB. I'd delegate chunk-size tuning to infra; my prior is a few megabytes a chunk, because tiny chunks drown in metadata and huge chunks kill swarm parallelism."

**Why it scores:** the 5 PB egress number is computed out loud and is the entire reason the design is peer-to-peer, not push. **Red flag avoided:** a naive origin-push design that ignores egress and lets nodes serve a partially-downloaded model.

</details>

#### D46. "Design an ML feature store."

**Family:** AI infrastructure · **Reps:** classic, still high-frequency · **The turn:** online and offline must return identical values or training-serving skew silently rots the model, yet one path is a 10ms lookup and the other a two-year backfill

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: serve feature values online for inference and reproduce the exact same values offline for training, cutting the feature engineering itself to the ML teams. The asymmetry is two-sided: 500k online lookups a second at a p99 under 10ms, against heavy batch backfills that rewrite two years of history. Assume 2k features across the org. The turn: online and offline must agree, because training-serving skew (a feature computed one way in training and another in serving) rots a model with no error message, so one definition has to produce one value in both worlds. Shape: feature definitions as code as the single source, an offline store on lakehouse tables, an online key-value store (Redis or Dynamo-class), streaming materialization (Flink) plus batch backfill from that same definition, and point-in-time-correct training-set generation. I'd go deep on point-in-time correctness, because a naive join of labels to features leaks the future into training and inflates offline metrics that then collapse in production. I'd delegate per-team feature governance to a platform council; my prior is definitions reviewed and versioned like code, because unversioned features are how two teams ship subtly different 'purchase count' columns."

**Why it scores:** it names training-serving skew as the silent failure and makes one shared definition the fix, then flags point-in-time correctness as the trap. **Red flag avoided:** separate online and offline pipelines with no shared definition, guaranteeing skew.

</details>

#### D47. "Design an LLM evaluation platform that gates releases."

**Family:** AI infrastructure · **Reps:** rising 2025-26 platform staple · **The turn:** LLM-as-judge is the only grader that scales to open-ended output, but it drifts, and a drifting gate is worse than none

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: run evaluation suites against every prompt or model change and gate the release the way failing tests gate a deploy, cutting model serving and training to their own systems. The write path is the eval runs; the reads are a dashboard, so I size the batch harness, not a query tier. Assume 200 prompt or model changes a week, 50 eval suites, and a judge-cost budget near $10k a month, which means I cannot re-run every suite on every change without caching. The turn: LLM-as-judge is the only grader that scales to open-ended output, but it drifts, so its verdicts fight the need for a stable release gate. Shape: an eval-suite registry of golden sets and rubrics, a batch execution harness with caching, an LLM-as-judge tracked against periodic human calibration, regression detection versus baselines with a significance test, CI integration that gates and reports, and a feedback loop mining production failures into new suites. I'd go deep on judge calibration, tracking judge-human agreement over time so a drifting judge is caught before it silently passes a regression. I'd delegate rubric authorship to the product teams owning each surface; my prior is human-written rubrics with sampled human audits, because a gate no one trusts gets bypassed the first time it's inconvenient."

**Why it scores:** it treats the judge itself as a drifting component to calibrate, which is the part that separates a real gate from a vanity metric. **Red flag avoided:** trusting a bare LLM-as-judge score as a release gate with no human-agreement tracking.

</details>

#### D48. "Design a semantic caching layer to cut LLM token spend."

**Family:** AI infrastructure · **Reps:** rising 2025-26 platform staple · **The turn:** a semantic hit saves 30 to 60% of spend, but a paraphrase that deserved fresh reasoning returns a subtly wrong answer

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: sit in front of the LLM providers and serve cached answers for repeated or paraphrased queries to cut token spend, cutting model serving and prompt orchestration to the callers. This is read-heavy by design, the whole point is turning expensive generations into cheap cache reads, so I optimize the lookup and treat writes as a side effect of misses. Assume 100M LLM calls a day, roughly 30% semantically similar to a prior call, and a spend near $0.5M a month before caching, so even a 40% hit rate is real money. The turn: a hit saves 30 to 60% of spend, but a semantic hit on a paraphrase that actually deserved fresh reasoning returns a subtly wrong answer, so the similarity threshold is a correctness decision, not a tuning knob. Shape: an embedding-based lookup with a per-route threshold, an exact-match fast path, a cache-policy engine (time-to-live by content class, hard no-cache routes), invalidation hooks on model and prompt version, and spend-attribution reporting. I'd go deep on the similarity-threshold policy, the cases where 0.95 cosine similarity is still the wrong answer because the prompts differ on the one token that matters. I'd delegate per-route thresholds to owning teams; my prior is caching off by default per route until an owner opts in, because a wrong cached answer erodes trust faster than the savings justify."

**Why it scores:** it frames the similarity threshold as a per-route correctness call and defaults caching off, respecting that a wrong hit is worse than a miss. **Red flag avoided:** one global cosine threshold applied to every route, silently serving stale answers on the ones that needed fresh reasoning.

</details>

#### D49. "Design a fine-tuning platform serving hundreds of LoRA adapters."

**Family:** AI infrastructure · **Reps:** rising 2025-26 platform staple · **The turn:** training wants to pack many small jobs on shared GPUs, while serving wants hundreds of adapters multiplexed on one base model

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: let many teams fine-tune adapters on a shared base model and serve them cheaply, cutting base-model pretraining and eval-rubric authoring to other teams. The load splits in two: a queue of training jobs (write-heavy, bursty) and a serving tier answering inference against hundreds of adapters. Assume 200 teams, 500 fine-tune jobs a month, and 300 live adapters that must serve off shared base-model replicas, because a dedicated replica each would need 300x the GPUs. The turn: training wants to pack many small jobs onto shared GPUs, while serving wants to multiplex hundreds of LoRAs (low-rank adaptations) on one base model, and no adapter reaches production without passing eval gates. Shape: dataset validation and versioning, a training orchestrator (queued, spot-friendly, checkpointed), an eval gate against base and safety suites, an adapter registry, and multiplexed serving that hot-swaps adapters on shared replicas. I'd go deep on the multi-LoRA serving economics, why swapping small adapter weights onto a resident base model beats dedicated replicas by an order of magnitude. I'd delegate hyperparameter defaults to the ML platform team; my prior is a single conservative recipe most teams never override, because per-team tuning burns GPU hours for gains that rarely survive the eval gate."

**Why it scores:** the 300x replica math is the reason multiplexed serving exists, and the eval gate is placed before any adapter ships. **Red flag avoided:** a dedicated replica per fine-tune, which is the obvious design and is economically absurd at 300 adapters.

</details>

#### D50. "Design an AI code-review service for a 2,000-engineer org."

**Family:** AI infrastructure · **Reps:** rising 2025-26 platform staple · **The turn:** good review needs repo-wide retrieval, but that fights the CI-latency budget, and a noisy bot gets muted in a month

<details>
<summary>90-second opening, try yours out loud first</summary>

"Scope: review every pull request inline with a few high-value comments, cutting the CI pipeline and merge automation to the existing dev-infra. The load is spiky writes (PRs land in bursts) against a slowly-changing read structure (the indexed repo), so I keep indexing incremental and off the critical path. Assume 4k pull requests a day, a comment budget under 5 per request, and a latency budget under 3 minutes so the bot doesn't stall CI. The turn: good review needs repo-wide context via retrieval, but that fights the latency budget, and precision beats recall, because a bot that posts noisy comments gets muted within a month and never recovers. Shape: incremental repo indexing (a code graph plus embeddings), a PR analysis pipeline over the diff and retrieved context, a finding ranker with per-rule precision tracking, an inline comment and suggestion API, and a feedback loop on accept-versus-dismiss telemetry. I'd go deep on the precision governor, the per-category acceptance tracking that auto-mutes any rule whose comments developers keep dismissing. I'd delegate the org-specific rule packs to the platform teams owning each language; my prior is shipping three high-precision rules over thirty noisy ones, because trust lost on day one doesn't come back."

**Why it scores:** it makes precision the governing constraint and builds an auto-mute governor around it, which is what keeps the bot from being ignored. **Red flag avoided:** maximizing findings per PR, which floods reviewers and gets the bot disabled within weeks.

</details>

---

### What interviewers probe here

- **"Why did you cut that?"** The scope cut is probed before the architecture is. *Strong:* the cut maps to the stated non-functional priority ("I cut edit-history because the dominating requirement is read latency, and history changes the storage model; I'd confirm with the interviewer"). *Red flag:* a cut discovered by the interviewer that the candidate never announced.
- **"Where did that number come from?"** *Strong:* the assumption chain said aloud, rounded, and owned ("10M DAU, 10 reads each, so ~100M/day, call it ~1.2k QPS average, 5x peak"). *Red flag:* a suspiciously precise figure with no visible arithmetic.
- **"You named the tension, defend it."** *Strong:* why THIS trade-off dominates and which requirement makes it so; the runner-up tension named and dismissed with a reason. *Red flag:* the tension restated as a topic ("it's about scale") when pushed.
- **"Okay, go deep."** The opening earns credibility only if the promised depth exists. *Strong:* the deep dive delivers real mechanics in the component where the turn lives. *Red flag:* the opening was the whole answer, five beats of fluency with nothing underneath (the sight-reader who can read the key signature but not play the phrase).
- **The follow-the-delegation probe.** *Strong:* the stated prior survives one push ("why is your prior Y?") with a mechanism or a number. *Red flag:* delegation as evasion, no prior, no reason.

---

### Common mistakes

- **Turning the drill into study.** Reading fifty openings back to back is the anti-pattern; the value is produced in the 90 seconds before you open the model. Timed, out loud, a handful per day.
- **Memorizing shapes instead of deriving them.** The same prompt with one constraint flipped (10x the writes, or strong consistency required) has a different shape; drill the derivation (beats 1-3 force beat 4), not the answer.
- **Skipping the numbers under time pressure.** The 90-second clock tempts you to jump from prompt to boxes; the numbers are what make the opening defensible, and they cost fifteen seconds when the assumption habit is grooved.
- **Naming a topic instead of a tension.** "It's a caching problem" is a category; "flag reads sit on every request so reads must be local, but a kill switch must propagate in seconds, so freshness pushes against the local cache" is a turn. Only the second one earns the shape.
- **Grinding prompts to fix a concept gap.** If leaderless quorums or CDC (change data capture) are foggy, ten more prompts will not fix it; one concept lesson will. Route gaps to concepts.

---

### Key takeaways
- **The first five minutes are a skill of their own.** Interviewers calibrate early; a committed opening (scope, numbers, tension, shape, depth call) buys goodwill the rest of the round spends.
- **Five beats, at tempo.** Scope cut → headline numbers → the turn → the shape → depth-plus-delegation, in 90 seconds, out loud, every time; the order is the discipline.
- **Tensions repeat; prompts don't.** Fifty prompts collapse into a dozen tension families; naming the family fast is what recognition speed actually is.
- **The shape is earned, not recalled.** Every component in beat 4 must trace to a requirement or a number from beats 1-3; a memorized architecture with no derivation dies on the first "why".
- **Gaps route to concept lessons.** The bank is a diagnostic; the curriculum is the treatment. A missed tension family means a re-read, not more reps.

> **Spaced-repetition recap:** Sight-reading for the design round: fifty unseen prompts, five beats each, 90 seconds, out loud. Scope cut (what you build, what you cut, read:write), headline numbers (rounded, assumptions aloud), the turn (one trade-off the design pivots on), the shape (4-6 components earned by the first three beats), depth + delegation (deep where the turn lives, delegate the rest with a stated prior). Compare beats, not words; route gaps to concept lessons; never let fluency in the opening replace the depth it promises.

---

*End of Lesson 4.19. The walkthroughs are your repertoire; this bank is your sight-reading. Together they cover the round: repertoire proves you can go deep, sight-reading proves you can start strong on anything, and the rubric lessons tell you how the whole performance is scored.*
