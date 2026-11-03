#!/bin/sh
# ConvertX iPhone a-Shell environment probe. Read-only; no package installs.
echo "ConvertX iPhone build diagnostics"
echo "Platform: $(uname -s 2>/dev/null || echo unknown)"
for tool in node npm git curl python3; do
  if command -v "$tool" >/dev/null 2>&1; then
    printf '%s: found\n' "$tool"
    case "$tool" in
      node|npm) "$tool" --version 2>&1 ;;
    esac
  else
    printf '%s: unavailable\n' "$tool"
  fi
done
if command -v npm >/dev/null 2>&1; then
  echo "npm cache location:"
  npm config get cache 2>&1
  echo "cached MLightCAD entries (may be empty):"
  npm cache ls @mlightcad 2>&1
  echo "npm registry:"
  npm config get registry 2>&1
fi
echo "No dependencies installed or global configuration changed."
