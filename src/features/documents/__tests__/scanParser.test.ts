import { parseScannedDocument } from "@/features/documents/scanParser";

describe("parseScannedDocument", () => {
  it("detects a Spanish license, holder name, and labeled day-first expiration date", () => {
    expect(
      parseScannedDocument(
        "LICENCIA DE CONDUCIR\nNombre completo: John Smith\nFecha de vencimiento: 15/11/2030\nFecha de nacimiento: 02/04/1990",
      ),
    ).toEqual({
      documentType: "drivers_license",
      documentName: "John Smith",
      expirationDate: "2030-11-15",
    });
  });

  it("extracts passport name and expiration date from a machine-readable zone", () => {
    expect(
      parseScannedDocument(
        "P<DOMROJAS<<JUAN<MIGUEL<<<<<<<<<<<<<<\n1234567890DOM9004021M3004157<<<<<<<<<<<<<<02",
      ),
    ).toEqual({
      documentType: "passport",
      documentName: "JUAN MIGUEL ROJAS",
      expirationDate: "2030-04-15",
    });
  });

  it("does not treat an unlabeled birth date as the expiration date", () => {
    expect(
      parseScannedDocument(
        "PASAPORTE\nNombre: John Smith\nFecha de nacimiento: 02/04/1990",
      ),
    ).toEqual({
      documentType: "passport",
      documentName: "John Smith",
      expirationDate: null,
    });
  });

  it("rejects impossible dates and leaves undetected fields empty", () => {
    expect(parseScannedDocument("Fecha de vencimiento: 31/02/2030")).toEqual({
      documentType: null,
      documentName: null,
      expirationDate: null,
    });
  });

  it("recognizes English and French document-type labels", () => {
    expect(parseScannedDocument("Passport")).toMatchObject({
      documentType: "passport",
    });
    expect(parseScannedDocument("Carte nationale d’identité")).toMatchObject({
      documentType: "national_id",
    });
  });
});
