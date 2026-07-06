---
title: "Glossary"
description: Course-wide glossary of abbreviations and named concepts, one canonical definition per term.
sidebar:
  order: 1
---

Every abbreviation and named concept used across the course, in one place, with the decision-relevant one-liner. Lessons also expand each abbreviation at its first use, so this page is a reference, not required reading. Deep treatments live in each term's home lesson; the site search (press `/`) will take you there.

### A–B

- **ABAC (attribute-based access control).** Authorization decided by evaluating attributes of the caller, resource, and context against policy; more expressive than RBAC, harder to audit.
- **ABR (adaptive bitrate).** Video streaming that switches among quality renditions per segment based on the client's measured bandwidth.
- **ACID (atomicity, consistency, isolation, durability).** The transactional guarantees of classic relational databases: all-or-nothing multi-step changes that survive crashes.
- **ACL (access control list).** A per-resource list of who may do what; the simplest authorization model and the one that fans out worst at scale.
- **ACH (Automated Clearing House).** The US batch bank-transfer rail: cheap, slow (hours-days), reversible; the opposite trade of card networks.
- **ADR (architecture decision record).** A short committed document capturing one decision, its context, and the alternatives rejected.
- **AML (anti-money laundering).** The compliance controls (screening, monitoring, reporting) payment systems must run on money movement.
- **ANN (approximate nearest neighbor).** Vector search that trades exact results for orders-of-magnitude speed; the query mode of every vector database.
- **AP / CP.** Under a network partition, a system chooses to stay Available (serving possibly stale data) or Consistent (refusing requests it cannot verify); the CAP theorem's two ends.
- **APM (application performance monitoring).** Tooling that traces requests through services to attribute latency and errors.
- **APNs (Apple Push Notification service).** Apple's push channel; with FCM, one of the two gateways all mobile push must transit.
- **ARR (annual recurring revenue).** Subscription revenue normalized to a year; the growth metric SaaS cost decisions are weighed against.
- **ASR (automatic speech recognition).** Speech-to-text; the streaming front end of every voice product.
- **ATO (account takeover).** An attacker gaining control of a legitimate account, usually via stolen or reused credentials.
- **AZ (availability zone).** An isolated datacenter within a cloud region; spreading replicas across three AZs is the default failure-independence move.
- **BASE (basically available, soft state, eventually consistent).** The loose counterpart to ACID adopted by many NoSQL stores: prefer availability, let replicas converge later.
- **BFF (backend-for-frontend).** A thin per-client API layer that aggregates and reshapes backend calls so each client gets exactly the payload it needs.
- **BGP (Border Gateway Protocol).** The internet's inter-network routing protocol; its misconfigurations and hijacks are why "the internet is down" happens.
- **BLOB (binary large object).** Opaque binary data (images, video, backups); belongs in object storage, not a database row.
- **BYOK (bring your own key).** Enterprise customers supplying their own encryption keys so the vendor can never unilaterally read their data.

### C–D

- **CAP theorem.** Under a network partition a distributed system cannot be both consistent and available; partitions are not optional, so the choice is forced. See also PACELC.
- **CAS (compare-and-swap).** An atomic conditional write: succeed only if the value still matches what you read; the primitive under optimistic concurrency.
- **CCPA (California Consumer Privacy Act).** California's privacy law; with GDPR, the reason deletion and data-subject-access must be designed in, not bolted on.
- **CDC (change data capture).** Tailing a database's replication log to stream every row change to downstream consumers; the standard bridge from OLTP to analytics.
- **CDN (content delivery network).** Globally distributed edge caches that serve static (and increasingly dynamic) content near users.
- **CLS (Cumulative Layout Shift).** Core Web Vital measuring visual stability: how much the page jumps around while loading.
- **COGS (cost of goods sold).** The direct cost of serving the product (infra, inference, support); gross margin's denominator and the lens for unit-economics decisions.
- **CP.** See AP / CP.
- **CQRS (command query responsibility segregation).** Separate write and read models, letting each be shaped and scaled for its own access pattern.
- **CRDT (conflict-free replicated data type).** A data structure whose replicas merge automatically, in any order, without coordination; the offline-first and collaborative-editing workhorse.
- **CRP (critical rendering path).** The sequence of resources a browser must fetch and process before first paint.
- **CRUD (create, read, update, delete).** The four basic data operations; shorthand for "a plain forms-over-data app."
- **CSAT (customer satisfaction).** Post-interaction satisfaction score; a support product's quality metric alongside deflection rate.
- **CSAM (child sexual abuse material).** The abuse category with zero tolerance and mandatory reporting; hash-matching (PhotoDNA-style) is the standard control.
- **CSR (client-side rendering).** The browser downloads a JavaScript bundle and renders everything; fastest to build, slowest first paint, weakest SEO.
- **CTR (click-through rate).** Clicks per impression; the core engagement and ads metric.
- **CVE (Common Vulnerabilities and Exposures).** The public registry of known vulnerabilities; "patch the CVE" is the operational unit of vulnerability management.
- **DAG (directed acyclic graph).** A dependency graph with no cycles; the shape of every data pipeline and build system.
- **DAU / MAU (daily / monthly active users).** The standard scale inputs for estimation; their ratio is a stickiness signal.
- **DDL (data definition language).** Schema-changing SQL (CREATE/ALTER); "online DDL" is the art of changing schemas without downtime.
- **DEK / KEK (data encryption key / key encryption key).** Envelope encryption's two layers: a DEK encrypts the data, a KEK (held in a KMS) encrypts the DEK.
- **DLP (data loss prevention).** Controls that detect and block sensitive data leaving approved boundaries.
- **DLQ (dead-letter queue).** Where messages go after exhausting retries, so poison messages don't block the queue and failures stay visible.
- **DORA (DevOps Research and Assessment) metrics.** Deployment frequency, lead time, change-failure rate, time-to-restore: the four delivery-performance numbers.
- **DR (disaster recovery).** The plan and machinery for surviving region-scale loss; specified by RPO and RTO.
- **DSAR (data subject access request).** A user exercising their legal right to see (or delete) their data; must complete within statutory deadlines.
- **DX (developer experience).** How fast and safely engineers can ship on your platform; the product metric of internal platforms.

### E–H

- **E2E (end-to-end).** Spanning the full path from client to storage and back; in messaging, encryption only the endpoints can read.
- **ECMP (equal-cost multi-path).** Router-level load spreading across equal-cost routes; how L4 load balancers scale horizontally.
- **ELT / ETL (extract-load-transform / extract-transform-load).** Moving data into an analytical store; modern platforms load raw first and transform in-warehouse (ELT).
- **EM (engineering manager).** First-line people manager; in this course, the level whose scope a Director answer must exceed.
- **FCM (Firebase Cloud Messaging).** Google's push channel; with APNs, the mandatory transit for mobile push.
- **FK / PK (foreign key / primary key).** The row's identity (PK) and its typed reference to another table's identity (FK).
- **FLOP (floating-point operation).** The unit of compute for ML sizing; GPU capacity is quoted in FLOPs per second.
- **FSM (finite state machine).** Explicit states and legal transitions; the design tool that turns "status spaghetti" into verifiable lifecycle logic.
- **GC (garbage collection).** Automatic memory reclamation; its pauses are a canonical source of tail latency and false failure detection.
- **GDPR (General Data Protection Regulation).** The EU privacy law that makes erasure, access, residency, and consent architectural requirements.
- **GMV (gross merchandise value).** Total transaction value flowing through a marketplace; the scale number for commerce systems.
- **GQA / MHA (grouped-query / multi-head attention).** Transformer attention variants; GQA shrinks the KV cache to serve longer contexts cheaper.
- **GSLB (global server load balancing).** DNS-level steering of users to the nearest or healthiest region.
- **GTID (global transaction ID).** MySQL's replication position identifier; what failover tooling uses to know a replica is caught up.
- **HA (high availability).** Surviving component failure without an outage, usually via redundancy and automatic failover.
- **HBM (high-bandwidth memory).** The on-package GPU memory whose size and speed bound LLM serving capacity.
- **HDFS (Hadoop Distributed File System).** The original big-data filesystem; its bolted-together storage-compute model is what object storage displaced.
- **HIPAA (Health Insurance Portability and Accountability Act).** US health-data law; PHI handling, BAAs, and audit trails follow from it.
- **HITL (human-in-the-loop).** A human approval or review step inside an automated flow; the standard control for high-stakes agent actions.
- **HLC (hybrid logical clock).** A timestamp combining physical time with a logical counter so causality survives clock skew; used by CockroachDB and MongoDB.
- **HLD / LLD (high-level / low-level design).** Boxes-and-arrows system architecture vs class-and-method design; interviews test both, differently.
- **HLL (HyperLogLog).** A probabilistic sketch that counts distinct items in kilobytes with ~2% error; the answer to "unique visitors" at scale.
- **HLS (HTTP Live Streaming).** Segment-over-HTTP video delivery; rides plain CDNs instead of special protocols.
- **HMAC (hash-based message authentication code).** A keyed hash proving a message's integrity and origin; how webhooks and signed URLs are authenticated.
- **HNSW (Hierarchical Navigable Small World).** The dominant graph-based ANN index: high recall, fast queries, memory-hungry.
- **HRW (highest random weight / rendezvous hashing).** Consistent hashing's simpler cousin: hash every (key, node) pair, pick the max.
- **HSM (hardware security module).** Tamper-resistant hardware that holds keys and performs crypto so key material never leaves silicon.
- **HTAP (hybrid transactional/analytical processing).** One store claiming to serve OLTP and OLAP simultaneously; usually a replicated columnar copy under the hood.

### I–M

- **IC (individual contributor).** An engineer who ships rather than manages; "IC depth" in this course marks detail below Director altitude.
- **IDP (internal developer platform).** The paved-road tooling layer (golden paths, self-service infra) an org builds so product teams don't each solve deployment.
- **INP (Interaction to Next Paint).** Core Web Vital measuring responsiveness: the latency of the slowest user interaction.
- **IOPS (I/O operations per second).** Disk throughput in operations; the number that separates SSD classes and prices.
- **ISR (incremental static regeneration).** Statically rendered pages that revalidate in the background per-path; Next.js's middle ground between SSG and SSR.
- **ISR (in-sync replica).** In Kafka, the set of replicas caught up with the partition leader; `acks=all` waits for them.
- **ITL (inter-token latency).** Time between generated tokens after the first; with TTFT, the two numbers of LLM serving latency.
- **IVF (inverted file index).** Cluster-then-probe ANN indexing: coarser and cheaper than HNSW, better for memory-tight or disk-based search.
- **JWT (JSON Web Token).** A signed, self-contained claims token; stateless to verify, painful to revoke before expiry.
- **KEK.** See DEK / KEK.
- **KGS (key generation service).** A service that pre-mints unique short keys (TinyURL-style) so writes never collide or coordinate.
- **kNN (k-nearest neighbors).** Exact nearest-neighbor search; what ANN approximates.
- **KMS (key management service).** The managed root-of-trust for encryption keys: generation, rotation, access policy, audit.
- **KTLO (keep the lights on).** The recurring operational work that maintains existing systems; the budget line squeezed against feature work.
- **KV (key-value).** Data addressed only by key, with an opaque value; the simplest and most scalable storage contract.
- **KYC (know your customer).** Identity verification required before offering financial services.
- **LCP (Largest Contentful Paint).** Core Web Vital measuring loading: when the main content becomes visible.
- **LFU / LRU (least frequently / least recently used).** The two canonical cache-eviction policies: evict by popularity vs by recency.
- **LSM tree (log-structured merge tree).** Write-optimized storage (Cassandra, RocksDB): sequential writes into sorted runs, background compaction, read amplification as the tax.
- **LSN (log sequence number).** Postgres's replication position; the recovery and lag-measurement coordinate.
- **LWT (lightweight transaction).** Cassandra's Paxos-backed conditional write; linearizable, and roughly 4× the latency of a normal write.
- **LWW (last-write-wins).** Conflict resolution by highest timestamp: cheapest possible writes, silent loss of concurrent updates, dependent on synchronized clocks.
- **MAU.** See DAU / MAU.
- **MCP (Model Context Protocol).** The open standard for connecting LLM agents to tools and data sources.
- **MFA (multi-factor authentication).** Requiring a second proof beyond a password; the single highest-leverage ATO control.
- **mTLS (mutual TLS).** TLS where both sides present certificates; the workload-identity primitive of service meshes.
- **MTTR / MTTD (mean time to recovery / to detect).** How fast you notice and how fast you restore; the incident metrics that matter more than incident count.
- **MVCC (multi-version concurrency control).** Readers see a consistent snapshot while writers create new versions; why reads don't block writes in Postgres.

### N–R

- **NAT (network address translation).** Rewriting private addresses to public ones at the network edge; why inbound connections to mobile clients don't work.
- **NFR (non-functional requirement).** The -ilities: availability, latency, consistency, durability, cost. The R in RESHADED that decides every later trade-off.
- **NIC (network interface card).** The server's network hardware; its bandwidth is a real per-host ceiling in fan-out math.
- **NPS (net promoter score).** Would-you-recommend survey metric; coarse but ubiquitous in product health reviews.
- **NTP (Network Time Protocol).** How machines sync clocks: milliseconds of typical skew, no guaranteed bound; the reason LWW can lose newer writes.
- **OIDC (OpenID Connect).** The OAuth2-based identity layer behind "Sign in with X"; the modern SSO protocol alongside SAML.
- **OKR (objectives and key results).** Goal-setting framework linking qualitative objectives to measurable outcomes.
- **OLAP (online analytical processing).** Scan-heavy aggregation over many rows, columnar storage, seconds of latency tolerated.
- **OLTP (online transaction processing).** Point reads and writes on individual entities, row storage, milliseconds required.
- **OOD (object-oriented design).** Class/interface design; the skill LLD interview rounds probe.
- **OOM (out-of-memory).** The kill that ends a process exceeding its memory budget; the failure mode of unbounded caches and queues.
- **OT (operational transformation).** Collaborative-editing concurrency control that rewrites operations against concurrent ones; needs a central server (Google Docs), contrast CRDT.
- **OTA (over-the-air).** Remote software updates to devices in the field; the fleet-management problem's core mechanic.
- **OTP (one-time password).** A short-lived single-use code; the common second factor.
- **PACELC.** Extends CAP: if Partitioned, trade Availability vs Consistency; Else, trade Latency vs Consistency. The "else" is the trade-off you live with every day.
- **PAN (primary account number).** The card number itself; the datum PCI DSS exists to keep out of your systems (tokenize at the edge).
- **PCI DSS (Payment Card Industry Data Security Standard).** The card-data security standard; scope minimization (never touching the PAN) is the architectural response.
- **PHI (protected health information).** Health data under HIPAA; stricter handling, logging, and contracts than ordinary PII.
- **PII (personally identifiable information).** Data identifying a person; the classification that triggers privacy obligations (encryption, deletion, residency).
- **PIP (performance improvement plan).** The formal, documented remediation period for a low performer.
- **PK.** See FK / PK.
- **PSP (payment service provider).** Stripe/Adyen-style processors that own card acceptance so you never touch PANs.
- **QPS (queries per second).** The universal load unit; every estimation in this course starts from it.
- **RAG (retrieval-augmented generation).** Retrieve relevant documents, stuff them into the prompt, generate with citations; the default architecture for LLMs over private data.
- **RBAC (role-based access control).** Authorization via roles that bundle permissions; auditable and coarse, contrast ABAC.
- **RCU / WCU (read / write capacity unit).** DynamoDB's provisioned-throughput units; the knobs its cost model is priced in.
- **RDBMS (relational database management system).** Postgres/MySQL-class stores: schemas, joins, ACID transactions.
- **RESHADED.** This course's interview spine: Requirements, Estimation, Storage, High-level design, API, Data model, Evaluation, Design evolution.
- **RF (replication factor).** How many copies of each datum exist; 3 across 3 AZs is the production default.
- **RGA (replicated growable array).** The sequence CRDT family used for collaborative text: every character gets a stable unique ID.
- **RLHF (reinforcement learning from human feedback).** The post-training step that aligns an LLM to preferred behavior.
- **RLS (row-level security).** The database enforcing per-row visibility predicates itself; the pooled multi-tenancy isolation backstop.
- **RPO / RTO (recovery point / time objective).** How much data you may lose, and how long you may be down; the two numbers that price any DR design.
- **RPS (requests per second).** Interchangeable with QPS for request-shaped load.
- **RRF (reciprocal rank fusion).** A rank-merging formula for combining dense and sparse search results without tuning weights.
- **RSC (React Server Components).** Components rendered on the server with zero client-bundle cost; the streaming-first React architecture.
- **RTT (round-trip time).** One network round trip; ~1 ms same-AZ, ~50-150 ms cross-region; the atom of latency budgets.

### S–Z

- **SAML (Security Assertion Markup Language).** The XML-era enterprise SSO protocol still required to sell to large companies.
- **SCD (slowly changing dimension).** Warehouse patterns for dimensions whose attributes change; type 2 keeps dated history rows.
- **SIMD (single instruction, multiple data).** CPU vector instructions; why columnar engines aggregate billions of values per second.
- **SKU (stock-keeping unit).** One sellable product variant; the unit of inventory systems.
- **SLA / SLO / SLI (service-level agreement / objective / indicator).** The measured signal (SLI), the internal target on it (SLO), and the contractual promise with penalties (SLA).
- **SLI.** See SLA / SLO / SLI.
- **SOC 2 (System and Organization Controls 2).** The audit report enterprises demand as proof of security practice; audit logging and change control follow from it.
- **SOX (Sarbanes-Oxley).** US financial-reporting law; change-control and segregation-of-duties requirements on systems that touch the ledger.
- **SPA (single-page application).** A client-rendered app that navigates without full page loads.
- **SPOF (single point of failure).** Any component whose loss takes the system down; the thing redundancy exists to eliminate.
- **SRE (site reliability engineering).** The discipline (and role) of running production systems against explicit reliability targets.
- **SSG (static site generation).** Rendering pages to static files at build time; fastest possible serving, stalest possible content.
- **SSO (single sign-on).** One identity, many applications; delivered via OIDC or SAML.
- **SSR (server-side rendering).** Rendering HTML per-request on the server; fast first paint, higher server cost.
- **SSTable (sorted string table).** An immutable sorted file on disk; the on-disk unit of LSM-tree stores like Cassandra and RocksDB.
- **TCO (total cost of ownership).** Infra plus people plus opportunity cost; the build-vs-buy denominator.
- **TDE (transparent data encryption).** Storage-layer encryption the application never sees; protects disks, not application-level access.
- **TLD (top-level domain).** The last DNS label (.com); where DNS resolution starts.
- **TOCTOU (time-of-check-to-time-of-use).** The race between validating a condition and acting on it; why "check then write" needs a conditional write.
- **TPS (transactions per second).** QPS for transaction-shaped load.
- **TSDB (time-series database).** A store optimized for timestamped metrics: high ingest, time-bucketed queries, aggressive downsampling.
- **TTFB (time to first byte).** How fast the server starts responding; the server-side share of page latency.
- **TTFT / TPOT (time to first token / time per output token).** LLM serving's two latencies: prefill cost before the first token, then per-token decode speed.
- **TTI (time to interactive).** When the page actually responds to input, not just looks ready.
- **TTL (time-to-live).** How long a cache entry, message, or record remains valid before expiry; the simplest staleness bound.
- **UGC (user-generated content).** Content your users create; implies moderation, abuse, and copyright obligations.
- **VOD (video on demand).** Pre-encoded video libraries (Netflix), contrast live streaming.
- **WAF (web application firewall).** Edge filtering of malicious HTTP traffic (injection, bots, L7 floods).
- **WAL (write-ahead log).** Append the change durably before applying it; the primitive under crash recovery, replication, and CDC.
- **WCU.** See RCU / WCU.
- **WORM (write once, read many).** Storage that forbids modification after write; the compliance-hold and audit-log guarantee.
- **ZIRP (zero interest-rate policy).** The cheap-money era whose growth-at-any-cost instincts read as miscalibrated in 2026 leadership interviews.
