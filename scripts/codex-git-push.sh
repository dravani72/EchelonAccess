#!/usr/bin/env bash
set -euo pipefail

branch="${1:-$(git branch --show-current)}"
identity_file="${CODEX_GIT_IDENTITY:-$HOME/.ssh/id_ed25519}"

if [[ -z "$branch" ]]; then
  echo "No current git branch detected." >&2
  exit 1
fi

if [[ ! -f "$identity_file" ]]; then
  echo "SSH identity not found: $identity_file" >&2
  exit 1
fi

ssh-add --apple-use-keychain "$identity_file" >/dev/null

ssh_check="$(ssh -T git@github.com 2>&1 || true)"
echo "$ssh_check"

if [[ "$ssh_check" != *"successfully authenticated"* ]]; then
  echo "GitHub did not accept the loaded SSH key. Add the public key to GitHub, then rerun this script." >&2
  exit 1
fi

git fetch origin
git push -u origin "$branch"
