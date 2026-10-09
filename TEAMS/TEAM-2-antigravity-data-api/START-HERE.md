# TEAM-2: START HERE  (just copy and paste, nothing else)

## Step 1: Install (once). Copy this, paste into PowerShell, press Enter. Click "Yes" on any popups.

```powershell
winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
winget install -e --id astral-sh.uv --accept-source-agreements --accept-package-agreements
```

Then download and install Antigravity from https://antigravity.google/download . Close PowerShell when done.

## Step 2: Get the project (once). Open a NEW PowerShell window, copy this, paste, press Enter.

```powershell
cd $HOME\Desktop
git clone https://github.com/CMPN-CODECELL/Syrus7_4_Goats.git
cd Syrus7_4_Goats
git checkout -b team-2/work
git config user.name "TEAM-2"
git config user.email "team-2@users.noreply.github.com"
```

If it asks you to log in to GitHub, log in. If it says "not found", send Wahab your GitHub username.

## Step 3: Open it in Antigravity (once).

Antigravity > File > Open Folder > Desktop > Syrus7_4_Goats.

Settings (gear icon): set "Artifact review" and "Terminal" to "Request review", turn ON "Sandbox Mode", NEVER pick "Turbo" or "Always proceed". Model: Gemini 3.1 Pro (or Claude Sonnet 5.5 if listed).

## Step 4: Start the work. Copy this line into the Antigravity chat and press Enter.

```text
Do everything in @TEAMS/TEAM-2-antigravity-data-api/PROMPT-1-U3-data-layer.md
```

If the file name does not turn into a chip/link, delete the `@...` part, type `@`, type `PROMPT-1`, click the file, then press Enter.

The first run can take about 10 minutes. Just wait. When it shows a plan or asks to run something, click Accept / Run / Proceed.

EXCEPT: if a command contains `rm`, `del`, `rmdir`, `Remove-Item`, `--force`, `reset --hard` or `.env`, click Reject and paste the help text from Step 7.

## Step 5: Save your work when the agent says it is done. Copy this into the chat.

```text
Run the check command from the prompt file. If it passes, run: git add -A, git commit -m "team-2: prompt done", git push -u origin team-2/work. Then tell me the result in one line.
```

Then message Wahab: "TEAM-2 pushed".

## Step 6: Next prompt. Same as Step 4, with the next line. Do them in this order:

| # | Copy this line into the chat | Wait for |
|---|---|---|
| 1 | `Do everything in @TEAMS/TEAM-2-antigravity-data-api/PROMPT-1-U3-data-layer.md` | Step 5 done |
| 2 | `Do everything in @TEAMS/TEAM-2-antigravity-data-api/PROMPT-2-U4-screen-costs-oos.md` | PROMPT-1 saved (Step 5) |
| 3 | `Do everything in @TEAMS/TEAM-2-antigravity-data-api/PROMPT-3-U11-api-jobs.md` | PROMPT-2 saved (Step 5) |
| 4 | `Do everything in @TEAMS/TEAM-2-antigravity-data-api/PROMPT-4-U15-offline-demo.md` | Wahab says "go" |

## Step 7: If something goes wrong, copy this into the chat:

```text
Something went wrong. Here is the error: <paste the red text>. Fix it only inside my team's files listed in the prompt. Do not delete anything. Do not touch other teams' files.
```

If it is still broken after 2 tries, screenshot it and send it to Wahab.

## Never do this

- Never click "Turbo" or "Always proceed".
- Never delete files or folders yourself.
- Never edit files outside your team's files. The agent knows them.
- Never run "git push --force".
