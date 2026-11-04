import { CameraView } from 'expo-camera';
import { File } from 'expo-file-system';

import { parseScannedDocument, type ScannedDocumentFields } from './scanParser';

export type DocumentScanFailure =
  | 'scannerUnavailable'
  | 'cameraFailed'
  | 'developmentBuildRequired'
  | 'recognitionFailed'
  | 'nothingRecognized'
  | 'temporaryFileCleanupFailed';

export type DocumentScanResult =
  | { status: 'cancelled' }
  | { status: 'failure'; reason: DocumentScanFailure }
  | { status: 'success'; fields: ScannedDocumentFields };

function isUnlinkedNativeModule(error: unknown): boolean {
  return error instanceof Error && error.message.includes("doesn't seem to be linked");
}

export async function scanDocumentLocally(): Promise<DocumentScanResult> {
  if (!CameraView.isDocumentScannerAvailable) {
    return { status: 'failure', reason: 'scannerUnavailable' };
  }

  let scan;
  try {
    scan = await CameraView.scanDocumentAsync({ requestPdf: false, quality: 0.85 });
  } catch {
    return { status: 'failure', reason: 'cameraFailed' };
  }
  if (!scan) return { status: 'cancelled' };

  let fields: ScannedDocumentFields | null = null;
  let recognitionFailure: DocumentScanFailure | null = null;
  try {
    const { default: TextRecognition } = await import('@react-native-ml-kit/text-recognition');
    for (const page of scan.pages) {
      const result = await TextRecognition.recognize(page);
      const parsed = parseScannedDocument(result.text);
      if (parsed.documentType || parsed.documentName || parsed.expirationDate) {
        fields = parsed;
        break;
      }
    }
    if (!fields) recognitionFailure = 'nothingRecognized';
  } catch (error) {
    recognitionFailure = isUnlinkedNativeModule(error) ? 'developmentBuildRequired' : 'recognitionFailed';
  }

  let cleanupFailed = false;
  for (const uri of [...scan.pages, ...(scan.pdfUri ? [scan.pdfUri] : [])]) {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      cleanupFailed = true;
    }
  }
  if (cleanupFailed) return { status: 'failure', reason: 'temporaryFileCleanupFailed' };
  if (recognitionFailure) return { status: 'failure', reason: recognitionFailure };
  if (!fields) return { status: 'failure', reason: 'nothingRecognized' };
  return { status: 'success', fields };
}
