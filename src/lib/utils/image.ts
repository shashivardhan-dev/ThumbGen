export async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

// ...

// const logoBuffer = logoFile ? await streamToBuffer(logoFile.stream()) : null;
// const s3 = await uploadBuffer(key, logoBuffer, "image/png");