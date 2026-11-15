import { BarcodeDetector as Ponyfill, prepareZXingModule } from "barcode-detector/ponyfill";
import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

// The decoder's WebAssembly ships with the app instead of loading from a CDN.
prepareZXingModule({
  overrides: { locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? wasmUrl : prefix + path) },
});

type Detector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> };
const FORMATS = ["code_128", "code_39", "ean_13", "itf", "qr_code"];

/** The browser's own detector where it has one (Chrome on Android, macOS), else the bundled ZXing build. */
export async function createDetector(): Promise<Detector> {
  const Native = (globalThis as { BarcodeDetector?: { new (o: object): Detector; getSupportedFormats(): Promise<string[]> } }).BarcodeDetector;
  if (Native) {
    try {
      const supported = await Native.getSupportedFormats();
      if (supported.includes("code_128")) return new Native({ formats: FORMATS.filter((f) => supported.includes(f)) });
    } catch {
      /* fall through to the bundled detector */
    }
  }
  return new Ponyfill({ formats: FORMATS as never[] }) as unknown as Detector;
}
