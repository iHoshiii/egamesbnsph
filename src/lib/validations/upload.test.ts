import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, validateUploadFile } from "./upload";

describe("validateUploadFile", () => {
  it("accepts valid JPEG, PNG, and WebP metadata", () => {
    const res = validateUploadFile({
      storagePath: "tx-1/receipt-1.png",
      mimeType: "image/png",
      fileSizeBytes: 120_000,
    });
    expect(res.success).toBe(true);
  });

  it("rejects disallowed MIME types", () => {
    const res = validateUploadFile({
      storagePath: "tx-1/payload.svg",
      mimeType: "image/svg+xml",
      fileSizeBytes: 1024,
    });
    expect(res.success).toBe(false);
  });

  it("rejects files larger than 5 MB", () => {
    const res = validateUploadFile({
      storagePath: "tx-1/huge.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: MAX_UPLOAD_BYTES + 1,
    });
    expect(res.success).toBe(false);
  });

  it("rejects path traversal or leading slashes", () => {
    expect(
      validateUploadFile({
        storagePath: "../secret.png",
        mimeType: "image/png",
        fileSizeBytes: 500,
      }).success,
    ).toBe(false);

    expect(
      validateUploadFile({
        storagePath: "/root/receipt.png",
        mimeType: "image/png",
        fileSizeBytes: 500,
      }).success,
    ).toBe(false);
  });
});
