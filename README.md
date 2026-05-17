<p align="center">
  <img src="https://raw.githubusercontent.com/Xenon-Flare/branding/main/banner.png" alt="XenonFlare Banner" width="100%" />
</p>

# Xenonflare Runner

**The open-source worker that powers your own AI studio on hardware *you* control.**  
Lease jobs from the Xenonflare cloud queue, run **OpenAI** (Responses API) locally, and ship **files, charts** (pie, bar, line, area, scatter, stacked bar), **tables, lists, checklists, and SVGs** back to **Xenonflare Studio** — without ever sending your provider API key to our servers.

---

## Why run this?

| You get | What it means |
|--------|----------------|
| **Keys stay yours** | `OPENAI_API_KEY` lives only on the machine running this process. We never see it. |
| **Private queue** | Point jobs at **your** runner using a **Runner API key** from Studio → Settings → Runners. |
| **Same pipeline as prod** | Same HTTPS endpoints and deliverable shapes our hosted runners use — predictable, boring, debuggable. |
| **Scale horizontally** | Run multiple processes with different `RUNNER_TOKEN` values and watch the queue drain faster. |

**Community:** builders, PMs, and designers hang out on [Discord](https://discord.gg/AZQDhSYupX) and [Reddit r/xenonflare](https://www.reddit.com/r/xenonflare/) — the runner prints both links on startup.

---

## What it does (60 seconds)

1. **`leaseWorkspaceJob`** — Wait for work assigned to your runner key (global pool or private “user” target).
2. **`getWorkspaceRunnerContext`** — Pull the compiled prompt + workspace state.
3. **Model + tools** — OpenAI Responses with tool calls for deliverables (charts, tables, files, lists, checklists, SVGs, …).
4. **`completeWorkspaceJob`** or **`failWorkspaceJob`** — Send deliverable arrays (files, charts, tables, lists, checklists, SVGs) and the assistant message — done.

For narrative docs, use **Documentation → Runners & queues** inside your Xenonflare Studio deployment. Studio itself is not open source; this repository is the **open-source worker** that talks to Studio's cloud queue over HTTPS.

---

## Quick start

```bash
git clone https://github.com/Xenon-Flare/runner.git
cd runner
npm install
cp .env.example .env   # edit before running
npm run build
npm start
# or: bash scripts/build/build.sh && bash scripts/start/start.sh
```

Run **several terminals** with **different** `RUNNER_TOKEN` values (separate runner instances in Studio) to increase throughput.

---

## Shell scripts

| Folder | Scripts | Purpose |
|--------|---------|---------|
| [`scripts/build/`](./scripts/build/) | [`build.sh`](./scripts/build/build.sh) | `npm run build` (TypeScript → `dist/`) |
| [`scripts/start/`](./scripts/start/) | [`start.sh`](./scripts/start/start.sh) | `npm start` (`node dist/index.js`) |
| [`scripts/deploy/local/`](./scripts/deploy/local/) | [`docker-build.sh`](./scripts/deploy/local/docker-build.sh), [`docker-run.sh`](./scripts/deploy/local/docker-run.sh) | Build and run the **`Dockerfile`** (`.env`; default tag `xenonflare-runner:local`) |

---

## Docker

From **`runner/`**:

```bash
bash scripts/deploy/local/docker-build.sh
bash scripts/deploy/local/docker-run.sh
```

Or manually:

```bash
docker build -f Dockerfile -t xenonflare-runner:local .
docker run --rm --env-file .env xenonflare-runner:local
```

Build context must be the **`runner/`** directory (where `Dockerfile`, `package.json`, and `src/` live). From a monorepo root: `docker build -f runner/Dockerfile -t xenonflare-runner:local runner/`

---

## Environment

Create a `.env` file (see [.env.example](./.env.example)):

| Variable | Required | Description |
|----------|:--------:|-------------|
| `RUNNER_API_BASE` | no | Cloud API origin, **no trailing slash**. Defaults to **`https://cloud.xenonflare.com`** if unset. Set when using a **custom hosting / API host**. |
| `RUNNER_TOKEN` | yes | Your **Runner API key**: `credentialId.secret` from **Studio → Settings → Runners** (shown once when you create an instance). Not your Studio login. |
| `OPENAI_API_KEY` | yes | OpenAI API key — **never commit**. |
| `OPENAI_MODEL` | no | Default model (e.g. `gpt-5-mini`). |
| `OPENAI_SUMMARY_MODEL` | no | Optional model for summarization paths. |
| `POLL_MS` | no | Backoff when the queue is empty (default `2500`). |
| `RUNNER_JOB_MAX_RUNTIME_MS` | no | If set: exit cleanly after this many milliseconds (useful for **scheduled / batch** workers). |
| `RUNNER_JOB_MAX_EMPTY_POLLS` | no | If set: exit after this many consecutive “no job” polls (avoids idle containers in cron-style setups). |

---

## Learn more

- **Mint a key** — Xenonflare Studio → **Settings** → **Runners** → **Add runner**, copy the secret into `RUNNER_TOKEN`.
- **Deliverable shapes** — Files, charts (all kinds above), tables, lists, checklists, and SVGs follow the same JSON shapes as production runners and Cloud Functions validation. Per-type caps and parsers live under `src/deliverables/` (`deliverable-limits.ts`, `validate-runner-*.ts`, re-exported from `deliverable-validation.ts`).
- **Horizontally** — One OS process = one token; duplicate the process for parallel capacity.

---

## Contributing

Issues and PRs are welcome. If you change tool payloads or HTTP contracts, coordinate with Xenonflare so **Studio's cloud APIs and this worker stay compatible** (watch Xenonflare release notes or open a discussion in this repository).

---

## License

See `LICENSE` at the repository root.

<p align="center">
  <b>Queue smarter · Run locally · Ship artifacts</b><br/>
  <sub>Xenonflare — workspaces for builders</sub>
</p>
