#!/usr/bin/env bash
set -euo pipefail

version="${VERSION:?VERSION is required}"
source_dir="${SOURCE_DIR:-packages/opencode/dist}"
release_root="${RELEASE_ROOT:-releases}"
mkdir -p "$release_root"
release_root="$(cd "$release_root" && pwd)"
version_dir="$release_root/v$version"

targets=(
  linux-arm64
  linux-x64
  linux-x64-baseline
  linux-arm64-musl
  linux-x64-musl
  linux-x64-musl-baseline
  darwin-arm64
  darwin-x64
  darwin-x64-baseline
  windows-arm64
  windows-x64
  windows-x64-baseline
)

rm -rf "$version_dir"
mkdir -p "$version_dir"

for build_target in "${targets[@]}"; do
  release_target="${build_target/musl-baseline/baseline-musl}"
  bin_dir="$source_dir/mimocode-$build_target/bin"
  if [[ "$build_target" == windows-* ]]; then
    source_binary="$bin_dir/mimo.exe"
    [[ -f "$source_binary" ]] || source_binary="$bin_dir/mimo"
    output_binary="ah.exe"
  else
    source_binary="$bin_dir/mimo"
    output_binary="ah"
  fi

  if [[ ! -f "$source_binary" ]]; then
    echo "Missing binary for $build_target: $source_binary" >&2
    exit 1
  fi

  work_dir="$(mktemp -d)"
  cp "$source_binary" "$work_dir/$output_binary"
  chmod 755 "$work_dir/$output_binary"

  if [[ "$build_target" == windows-* ]]; then
    archive="$version_dir/ah-$release_target.zip"
    (cd "$work_dir" && zip -q "$archive" "$output_binary")
  else
    archive="$version_dir/ah-$release_target.tar.gz"
    tar -czf "$archive" -C "$work_dir" "$output_binary"
  fi
  rm -rf "$work_dir"
done

printf '%s\n' "$version" > "$release_root/latest"
(
  cd "$version_dir"
  shasum -a 256 ah-* > ../manifest.txt
)

echo "Packaged AgentHosting CLI v$version:"
cat "$release_root/manifest.txt"

