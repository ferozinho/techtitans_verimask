# Verimask

Zero-knowledge student credentials. Prove **age ≥ 18** and **GPA ≥ 3.5** without showing the numbers. Scan a kiosk QR, proof dies in 15 minutes, new DID every time.

## Roles

- `/issuer` — college stamps a credential
- `/holder` — wallet, selective disclosure, Groth16 range proofs
- `/kiosk` — live QR verifier

## Local

```bash
npm install
npm run zk:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Two tabs: kiosk + holder. Or issue, grab the pickup code, scan the QR from a phone on the same network.

`zk:setup` needs `curl` (downloads circom) and writes `public/zk/*`. Artifacts are committed so Vercel does not need circom.

## Vercel

1. Deploy the repo.
2. For phone + kiosk to share sessions, add Upstash Redis:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Without Redis, local `next dev` still works (in-memory). Multi-instance Vercel will not.

Proofs are built in the browser. The API only verifies.

## Demo beat

1. Issuer → Demo pass → issue
2. Kiosk → scan QR (or open the URL under it)
3. Holder → Verify → kiosk goes green
4. Repeat with Demo fail for a red screen
