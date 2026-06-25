import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { fetchTaxCourtText } from "@/lib/research/fetch/tax-court";

// Round-trips a real (pdf-lib-generated) PDF through the actual unpdf text extractor + the two-hop
// DAWSON download flow, all network-free via an injected fetch. Proves case law can now GROUND
// (the getText that used to throw "not yet wired"), not just be searched.
async function makePdf(text: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 50, y: 700, size: 12, font });
  return doc.save();
}

describe("Tax Court opinion text extraction (fetchTaxCourtText)", () => {
  it("resolves the presigned URL, fetches the PDF, and extracts its text", async () => {
    const phrase = "The petitioner is not entitled to the deduction under section 162.";
    const pdfBytes = await makePdf(phrase);
    const stub = (async (url: string) => {
      if (String(url).endsWith("public-document-download-url")) {
        return { ok: true, status: 200, json: async () => ({ url: "https://dawson-s3.example/op.pdf" }) };
      }
      return { ok: true, status: 200, arrayBuffer: async () => pdfBytes.buffer };
    }) as unknown as typeof fetch;

    const text = await fetchTaxCourtText("https://public-api.dawson.ustaxcourt.gov/x/y/public-document-download-url", {
      fetchImpl: stub,
    });
    expect(text).toContain("not entitled to the deduction");
    expect(text).toContain("section 162");
  });

  it("throws (→ honest abstain) when DAWSON returns no presigned url", async () => {
    const stub = (async () => ({ ok: true, status: 200, json: async () => ({}) })) as unknown as typeof fetch;
    await expect(
      fetchTaxCourtText("https://x/public-document-download-url", { fetchImpl: stub }),
    ).rejects.toThrow(/no presigned url/);
  });
});
