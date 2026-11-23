#!/bin/sh
# Installs pmctl, the Platform Mesh CLI.
#
#   curl -fsSL https://platform-mesh.io/install.sh | sh
#
# Environment variables:
#   PMCTL_VERSION      Release to install, for example v26.11.0. Default: the latest release.
#   PMCTL_INSTALL_DIR  Directory to install into. Default: /usr/local/bin if it
#                      is writable, otherwise $HOME/.local/bin.
#
# This file is published at the root of platform-mesh.io by
# .github/workflows/release.yml.

set -eu

REPO="platform-mesh/platform-mesh"
BINARY="pmctl"

say() {
  printf '%s\n' "$*"
}

fail() {
  printf 'install.sh: %s\n' "$*" >&2
  exit 1
}

has() {
  command -v "$1" >/dev/null 2>&1
}

# download URL FILE
download() {
  if has curl; then
    curl -fsSL -o "$2" "$1"
  elif has wget; then
    wget -q -O "$2" "$1"
  else
    fail "curl or wget is required"
  fi
}

# Prints the tag of the latest release. It follows the redirect of
# /releases/latest instead of calling the GitHub API, which is rate limited.
latest_version() {
  url="https://github.com/${REPO}/releases/latest"
  if has curl; then
    location=$(curl -fsSLI -o /dev/null -w '%{url_effective}' "$url")
  elif has wget; then
    location=$(wget -q -S --spider "$url" 2>&1 | sed -n 's/^ *[Ll]ocation: *//p' | tail -n 1 | tr -d '\r')
  else
    fail "curl or wget is required"
  fi
  case "$location" in
    */releases/tag/*) say "${location##*/}" ;;
    *) fail "cannot determine the latest release of ${REPO}; set PMCTL_VERSION" ;;
  esac
}

sha256() {
  if has sha256sum; then
    sha256sum "$1" | cut -d ' ' -f 1
  elif has shasum; then
    shasum -a 256 "$1" | cut -d ' ' -f 1
  else
    fail "sha256sum or shasum is required to verify the download"
  fi
}

main() {
  case "$(uname -s)" in
    Linux) os=linux ;;
    Darwin) os=darwin ;;
    *) fail "unsupported operating system $(uname -s); pmctl is released for Linux and macOS" ;;
  esac

  case "$(uname -m)" in
    x86_64 | amd64) arch=amd64 ;;
    arm64 | aarch64) arch=arm64 ;;
    *) fail "unsupported architecture $(uname -m); pmctl is released for amd64 and arm64" ;;
  esac

  has tar || fail "tar is required"

  tag="${PMCTL_VERSION:-}"
  if [ -z "$tag" ]; then
    tag=$(latest_version)
  fi
  # Tags have a leading v, the names of the archives do not.
  tag="v${tag#v}"
  version="${tag#v}"

  archive="${BINARY}_${version}_${os}_${arch}.tar.gz"
  checksums="${BINARY}_${version}_checksums.txt"
  base="https://github.com/${REPO}/releases/download/${tag}"

  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT

  say "Downloading ${BINARY} ${tag} for ${os}/${arch}"
  download "${base}/${archive}" "${tmp}/${archive}" ||
    fail "cannot download ${base}/${archive}"
  download "${base}/${checksums}" "${tmp}/${checksums}" ||
    fail "cannot download ${base}/${checksums}"

  want=$(awk -v name="$archive" '$2 == name { print $1 }' "${tmp}/${checksums}")
  [ -n "$want" ] || fail "${checksums} has no checksum for ${archive}"
  got=$(sha256 "${tmp}/${archive}")
  [ "$want" = "$got" ] || fail "checksum of ${archive} does not match: want ${want}, got ${got}"

  tar -xzf "${tmp}/${archive}" -C "$tmp" "$BINARY"

  dir="${PMCTL_INSTALL_DIR:-}"
  if [ -z "$dir" ]; then
    if [ -d /usr/local/bin ] && [ -w /usr/local/bin ]; then
      dir=/usr/local/bin
    else
      dir="${HOME}/.local/bin"
    fi
  fi
  mkdir -p "$dir"
  # Install under a temporary name and rename, so that a pmctl that is running
  # is replaced and not overwritten.
  cp "${tmp}/${BINARY}" "${dir}/.${BINARY}.new"
  chmod 0755 "${dir}/.${BINARY}.new"
  mv -f "${dir}/.${BINARY}.new" "${dir}/${BINARY}"

  say "Installed ${dir}/${BINARY}"
  case ":${PATH}:" in
    *":${dir}:"*) ;;
    *) say "${dir} is not on your PATH. Add it with: export PATH=\"${dir}:\$PATH\"" ;;
  esac
}

# The call is on the last line, so a download that was cut off runs nothing.
main "$@"
