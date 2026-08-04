#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
FRAME_SOURCE_DIR="${1:-}"
FRAME_OUTPUT_DIR="${PROJECT_DIR}/public/animation/tunnel"
EXPECTED_FRAME_COUNT=90

if [[ -z "${FRAME_SOURCE_DIR}" ]]; then
  echo "Usage: $0 /absolute/path/to/png-frames" >&2
  exit 2
fi

if [[ ! -d "${FRAME_SOURCE_DIR}" ]]; then
  echo "Missing source directory: ${FRAME_SOURCE_DIR}" >&2
  exit 1
fi

source_count="$(find "${FRAME_SOURCE_DIR}" -maxdepth 1 -type f -name 'ezgif-frame-*.png' | wc -l | tr -d ' ')"
if [[ "${source_count}" != "${EXPECTED_FRAME_COUNT}" ]]; then
  echo "Expected ${EXPECTED_FRAME_COUNT} PNG frames, found ${source_count}" >&2
  exit 1
fi

mkdir -p "${FRAME_OUTPUT_DIR}"

for frame_number in $(seq -f "%03g" 1 "${EXPECTED_FRAME_COUNT}"); do
  source_frame="${FRAME_SOURCE_DIR}/ezgif-frame-${frame_number}.png"
  output_frame="${FRAME_OUTPUT_DIR}/ezgif-frame-${frame_number}.webp"

  if [[ ! -r "${source_frame}" ]]; then
    echo "Unreadable source frame: ${source_frame}" >&2
    exit 1
  fi

  cwebp \
    -quiet \
    -near_lossless 92 \
    -q 94 \
    -sharp_yuv \
    -metadata none \
    "${source_frame}" \
    -o "${output_frame}"
done

output_count="$(find "${FRAME_OUTPUT_DIR}" -maxdepth 1 -type f -name 'ezgif-frame-*.webp' | wc -l | tr -d ' ')"
if [[ "${output_count}" != "${EXPECTED_FRAME_COUNT}" ]]; then
  echo "Expected ${EXPECTED_FRAME_COUNT} WebP frames, found ${output_count}" >&2
  exit 1
fi

for frame_number in $(seq -f "%03g" 1 "${EXPECTED_FRAME_COUNT}"); do
  output_frame="${FRAME_OUTPUT_DIR}/ezgif-frame-${frame_number}.webp"
  width="$(sips -g pixelWidth "${output_frame}" | awk '/pixelWidth/ { print $2 }')"
  height="$(sips -g pixelHeight "${output_frame}" | awk '/pixelHeight/ { print $2 }')"

  if [[ "${width}" != "1080" || "${height}" != "1080" ]]; then
    echo "Unexpected dimensions for ${output_frame}: ${width}x${height}" >&2
    exit 1
  fi
done

echo "Encoded ${output_count} near-lossless WebP frames at 1080x1080."
