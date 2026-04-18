"use client";

import { Mp3Encoder } from "lamejs";

type ExportMp3Options = {
  bitrate?: number;
  fileBaseName?: string;
};

function clampSample(sample: number): number {
  const value = Math.max(-1, Math.min(1, sample));
  return value < 0 ? value * 0x8000 : value * 0x7fff;
}

function float32ToInt16(source: Float32Array): Int16Array {
  const target = new Int16Array(source.length);
  for (let index = 0; index < source.length; index += 1) {
    target[index] = clampSample(source[index] || 0);
  }
  return target;
}

function toArrayBuffer(chunk: Int8Array): ArrayBuffer {
  const normalized = Uint8Array.from(chunk);
  return normalized.buffer.slice(
    normalized.byteOffset,
    normalized.byteOffset + normalized.byteLength,
  );
}

function buildMp3Blob(
  leftChannel: Int16Array,
  rightChannel: Int16Array | null,
  sampleRate: number,
  bitrate: number,
): Blob {
  const encoder = new Mp3Encoder(rightChannel ? 2 : 1, sampleRate, bitrate);
  const mp3Chunks: ArrayBuffer[] = [];
  const frameSize = 1152;

  for (let index = 0; index < leftChannel.length; index += frameSize) {
    const leftChunk = leftChannel.subarray(index, index + frameSize);
    const encodedChunk = rightChannel
      ? encoder.encodeBuffer(
          leftChunk,
          rightChannel.subarray(index, index + frameSize),
        )
      : encoder.encodeBuffer(leftChunk);

    if (encodedChunk.length > 0) {
      mp3Chunks.push(toArrayBuffer(encodedChunk));
    }
  }

  const finalChunk = encoder.flush();
  if (finalChunk.length > 0) {
    mp3Chunks.push(toArrayBuffer(finalChunk));
  }

  return new Blob(mp3Chunks, { type: "audio/mpeg" });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

export async function exportBlobAsMp3(
  sourceBlob: Blob,
  options: ExportMp3Options = {},
): Promise<{ blob: Blob; filename: string }> {
  const { bitrate = 128, fileBaseName = "recording-export" } = options;
  const audioContext = new AudioContext();

  try {
    const audioBuffer = await audioContext.decodeAudioData(
      await sourceBlob.arrayBuffer(),
    );
    const leftChannel = float32ToInt16(audioBuffer.getChannelData(0));
    const rightChannel =
      audioBuffer.numberOfChannels > 1
        ? float32ToInt16(audioBuffer.getChannelData(1))
        : null;

    const mp3Blob = buildMp3Blob(
      leftChannel,
      rightChannel,
      audioBuffer.sampleRate,
      bitrate,
    );
    const filename = `${fileBaseName}.mp3`;
    triggerDownload(mp3Blob, filename);
    return { blob: mp3Blob, filename };
  } finally {
    await audioContext.close();
  }
}
