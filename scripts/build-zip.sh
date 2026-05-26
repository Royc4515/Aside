#!/usr/bin/env bash
# Builds a self-install ZIP of the Aside extension.
# Output: dist/aside-<version>.zip
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

version=$(grep -E '"version"\s*:' manifest.json | head -1 | sed -E 's/.*"([0-9.]+)".*/\1/')
out_dir="$repo_root/dist"
stage="$out_dir/aside-$version"
zip_path="$out_dir/aside-$version.zip"

rm -rf "$out_dir"
mkdir -p "$stage"

# Runtime-only payload.
items=(
  manifest.json
  background.js
  _locales
  icons
  content
  options
  popup
  providers
  shared
  sidebar
)

for item in "${items[@]}"; do
  if [[ -e "$item" ]]; then
    cp -R "$item" "$stage/"
  else
    echo "Skipping missing: $item" >&2
  fi
done

(cd "$stage" && zip -rq "$zip_path" .)
rm -rf "$stage"

size=$(du -h "$zip_path" | cut -f1)
echo "Built $zip_path ($size)"
