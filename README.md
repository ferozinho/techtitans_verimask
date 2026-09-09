# Verimask

Prove the source is real. Never prove who they are.

Selective-disclosure digital identity. One credential, many policies. A chain receipt that a check happened — never who you are.

Hackathon problem: **PS4 — Blockchain-Based Digital Identity with Selective Disclosure.**

---

## What

Verimask is a three-role identity loop:

1. An **issuer** (hospital, campus, event desk, employer) stamps a bundle of attributes onto a credential.
2. The **holder** keeps that file in a wallet. Secrets never leave the device unless they choose.
3. A **verifier** (hotline, gate, hiring desk) asks for a **subset**. The holder discloses only that subset. Everything else stays hidden.

Same stamp. Different doors. Different subsets.

The headline story is a **whistleblower / anonymous source**: a journalist or regulator can learn “this person is currently employed at St Mary's Hospital” without learning a name, staff ID, or department. Gate entry and hiring are other **policy packs** on the same platform, not separate apps.

---

## When (the problem)

A tip is only useful if the source is real. Checking that usually means unmasking them — name, employee ID, department — which is exactly what puts them at risk.

The same trade-off shows up everywhere:

| Desk | What they actually need | What they usually get |
| --- | --- | --- |
| Ethics hotline / newsroom | “Employed at Hospital X” | The whole HR file |
| Hiring | Degree + institution | Name, GPA, full transcript |
| Event gate | Name + pass type | Address, DOB, gender |
| 18+ door | Name + over-18 | Exact birthday |
| Staff door | Name + role | Home address |

Verimask is for **after onboarding, before the check**: the credential already exists. At the door you only open the claims that desk is allowed to see.

---

## Who

| Role | Route | Person in the story |
| --- | --- | --- |
| Issuer | `/issuer` | HR / medical board / campus / event registration |
| Holder | `/holder` | Employee, attendee, graduate — the wallet |
| Verifier | `/kiosk` | Journalist, gate tablet, recruiter |

Landing: `/`.

---

## How (non-tech)

### Issue (once, at onboarding)

Hospital (or any issuer) fills a template — name, institution, employment status, role, department, staff ID — and stamps it.

Each attribute is committed **separately**. The signed public file is a list of hashes, not plaintext. The real values + salts stay in the holder’s wallet.

If a date of birth is present, the issuer also stamps a derived **Age 18+** claim (`yes` / `no`). The birthday itself never has to leave the wallet later.

A **pickup code** (6 characters, 15 minutes) moves the whole wallet from the issuer laptop to a phone. That code is **issuer → holder only**. A verifier must never type it — it is the full file.

### Hold

The wallet shows every claim. The holder ticks what this verifier is allowed to see.

If they opened the wallet from a kiosk QR, the **required** claims for that desk are locked on. They can add extras. They cannot turn required claims off.

### Verify

The portal picks a **desk** (policy pack):

| Pack | Required claims | Stays hidden (if present) |
| --- | --- | --- |
| Anonymous source | institution, employmentStatus | name, staffId, department, role |
| Gate entry | name, passType | address, DOB, gender |
| Hiring desk | institution, degree | name, program, … |
| Age-restricted door | name, over18 | exact birthday |
| Staff / backstage | name, role | address |

Then it shows a **QR**. Phone camera (or the link under the QR on the same laptop) opens the wallet for **this session**.

Holder hits Present. Portal goes **PASS** or **FAIL**.

PASS shows only the revealed values. A count of hidden claims. An ephemeral one-time DID for this scan. A hash receipt (and a tx if chain is configured).

**15 minutes.** Session dies. Next person = new QR.

### Two desks, one wallet (the demo)

1. Issuer → Employer / license → Fill sample → Issue.
2. Kiosk desk: **Anonymous source**. Scan / open holder. Present. PASS: St Mary's + Employed. Name and staff ID stay in the wallet.
3. New QR. Desk: **Staff / backstage**. Same wallet. Now name + role must show.

That is the product: one file, two rooms, different subsets.

---

## How (tech)

### Stack

- Next.js 16 (App Router) + React 19 + Tailwind 4
- Ed25519 (`@noble/curves`) for issuer and holder signatures
- SHA-256 field commitments; keccak-256 for chain receipts (`@noble/hashes`)
- Optional on-chain: `contracts/VerimaskRegistry.sol` via **viem**
- Optional multi-instance sessions: **Upstash Redis** (needed on Vercel if phone ≠ kiosk machine)
- Groth16 circuits live under `circuits/` and `npm run zk:*`. **Not on the live present path.**

### Credential

A credential is not a hardcoded degree type. It is:

- `schema`: `{ id, label }[]`
- `commitments`: `Record<claimId, sha256(value + ":" + salt)>`
- issuer Ed25519 signature over the canonical unsigned body
- holder **secrets** (values + salts) stored only in `localStorage` (`verimask.v3.holder`)

Templates and packs: `lib/schema.ts`.

Issue path: `lib/credential.ts` → `issueCredential`.

### Presentation

`lib/present.ts` builds a presentation:

- Fresh **ephemeral** Ed25519 keypair / DID for this scan (pairwise, not the issuer DID)
- Only selected fields’ `{ value, salt }` are included
- Holder signs `{ sessionId, ephemeralDid, expiresAt, disclosures, credentialId }`

`lib/verify-presentation.ts` checks:

1. Not expired (15 min)
2. Issuer signature on the credential
3. Holder signature on the presentation
4. Every pack-required claim is disclosed
5. Each disclosed value+salt hashes to the committed value
6. Unknown attributes rejected

Hidden keys = schema ids not in the disclosure set.

### Session + pickup

In-memory map on `next dev`. Redis if `UPSTASH_REDIS_REST_*` is set. `lib/store.ts`.

| Thing | What it is | Who uses it |
| --- | --- | --- |
| Pickup code | Entire `HolderBundle` | Issuer → holder phone |
| Session id | Kiosk QR → `/holder?s=…` | Verifier ↔ holder for one check |

APIs:

- `POST /api/pickup` — mint pickup code
- `GET /api/pickup/:code` — **one-time** claim, then deleted
- `POST /api/sessions` — mint session with `packId` + `disclose[]`
- `GET /api/sessions/:id` — kiosk poll
- `POST /api/sessions/:id/present` — verify + log receipt
- `POST /api/chain` — optional issuer register + credential hash anchor

### Chain (optional)

`VerimaskRegistry`:

- `registerIssuer(did, pubkey)`
- `anchorCredential(credHash, issuerDidHash)` — hash of commitments, no values
- `logVerification(receipt, verifierDidHash, issuerDidHash, claimsHash, passed)` — claim **types** + pass/fail, no PII

Receipt hash = keccak of canonical `{ sessionId, verifierDid, issuerDid, claimTypes, passed }`.

Without `VERIMASK_PRIVATE_KEY` the app still verifies locally and still shows the keccak. Status: `local` (“No operator key — hash kept, not broadcast”).

Env: `.env.example`.

### Phone / Cloudflare tunnel

QR must be minted on the **public origin**, not `localhost`.

```bash
npm run dev
cloudflared tunnel --url http://localhost:3000
```

Open **`https://<subdomain>.trycloudflare.com/kiosk`** so the QR encodes that host.

`next.config.ts` → `allowedDevOrigins` includes `*.trycloudflare.com`. Next 16 otherwise blocks `/_next` from the tunnel host.

## Run

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)

**30-second path**

1. `/issuer` — Employer / license is default. Fill sample → Issue. Pickup code appears if you need a phone.
2. `/kiosk` — desk **Anonymous source**. Open the URL under the QR (same browser is fine).
3. `/holder` — Present. Portal PASS: institution + employed.
4. Kiosk → New QR → desk **Staff / backstage** → present again → name + role.

### Optional chain

```
VERIMASK_RPC_URL=
VERIMASK_PRIVATE_KEY=
VERIMASK_CONTRACT=
VERIMASK_CHAIN_ID=11155111
VERIMASK_EXPLORER=https://sepolia.etherscan.io
```

Deploy `contracts/VerimaskRegistry.sol` (Sepolia or Anvil `31337`).

### Vercel

Set Upstash Redis so phone and kiosk share sessions:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

---

## Map

| Path | Job |
| --- | --- |
| `lib/schema.ts` | Templates + policy packs (revert skin here) |
| `lib/credential.ts` | Issue |
| `lib/present.ts` | Build presentation |
| `lib/verify-presentation.ts` | Verify |
| `lib/crypto.ts` | DID, Ed25519, SHA-256 commitments |
| `lib/receipt.ts` / `lib/chain.ts` | keccak receipt + viem broadcast |
| `contracts/VerimaskRegistry.sol` | Registry |
| `app/issuer/page.tsx` | Issue UI |
| `app/holder/page.tsx` | Wallet |
| `app/kiosk/page.tsx` | Portal |
| `circuits/` | Unused in live demo |

To drop the whistleblower skin: delete the `employer` template and `source` pack in `lib/schema.ts`, set issuer/kiosk defaults back to `event` / `entry`, restore landing copy. No crypto change.
