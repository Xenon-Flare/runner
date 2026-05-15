<p align="center">
  <img src="https://raw.githubusercontent.com/Xenon-Flare/branding/main/banner-1200x400.png" alt="XenonFlare Banner" width="100%" />
</p>

# Xenonflare Runner

**The open-source worker that powers your own AI studio on hardware *you* control.**  
Lease jobs from the Xenonflare cloud queue, run **OpenAI** (Responses API) locally, and ship **files, charts, tables, lists, and SVGs** back to **Xenonflare Studio** — without ever sending your provider API key to our servers.

---

## Why run this?

| You get | What it means |
|--------|----------------|
| **Keys stay yours** | `OPENAI_API_KEY` lives only on the machine running this process. We never see it. |
| **Private queue** | Point jobs at **your** runner using a **Runner API key** from Studio → Settings → Runners. |
| **Same pipeline as prod** | Same HTTPS endpoints and deliverable shapes our hosted runners use — predictable, boring, debuggable. |
| **Scale horizontally** | Run multiple processes with different `RUNNER_TOKEN` values and watch the queue drain faster. |

---

## What it does (60 seconds)

1. **`leaseWorkspaceJob`** — Wait for work assigned to your runner key (global pool or private “user” target).
2. **`getWorkspaceRunnerContext`** — Pull the compiled prompt + workspace state.
3. **Model + tools** — OpenAI Responses with tool calls for deliverables (charts, tables, files, …).
4. **`completeWorkspaceJob`** or **`failWorkspaceJob`** — Upload results to Studio Storage — done.

For narrative docs, use **Documentation → Runners & queues** inside your Studio deployment, or browse the [Studio monorepo](https://github.com/Xenon-Flare/shorts-generator) where this worker is maintained.

---

## Quick start

```bash
git clone https://github.com/Xenon-Flare/runner.git
cd runner
npm install
cp .env.example .env   # edit before running
npm run build
npm start
```

Run **several terminals** with **different** `RUNNER_TOKEN` values (separate runner instances in Studio) to increase throughput.

---

## Environment

Create a `.env` file (see [.env.example](./.env.example)):

| Variable | Required | Description |
|----------|:--------:|-------------|
| `RUNNER_API_BASE` | yes | Cloud API origin, **no trailing slash** — e.g. `https://cloud.xenonflare.com` (must match your deployment). |
| `RUNNER_TOKEN` | yes | Your **Runner API key**: `credentialId.secret` from **Studio → Settings → Runners** (shown once when you create an instance). Not your Studio login. |
| `OPENAI_API_KEY` | yes | OpenAI API key — **never commit**. |
| `OPENAI_MODEL` | no | Default model (e.g. `gpt-5-mini`). |
| `OPENAI_SUMMARY_MODEL` | no | Optional model for summarization paths. |
| `POLL_MS` | no | Backoff when the queue is empty (default `2500`). |

---

## Learn more

- **Mint a key** — Xenonflare Studio → **Settings** → **Runners** → **Add runner**, copy the secret into `RUNNER_TOKEN`.
- **Deliverable shapes** — Files, charts, tables, lists, and SVGs follow the same schemas as production runners.
- **Horizontally** — One OS process = one token; duplicate the process for parallel capacity.

---

## Contributing

Issues and PRs are welcome. If you change tool payloads or HTTP contracts, align with the [shorts-generator](https://github.com/Xenon-Flare/shorts-generator) app and runner package so Studio and workers stay compatible.

---

## License

See `LICENSE` at the repository root.

<p align="center">
  <b>Queue smarter · Run locally · Ship artifacts</b><br/>
  <sub>Xenonflare — workspaces for builders</sub>
</p>
