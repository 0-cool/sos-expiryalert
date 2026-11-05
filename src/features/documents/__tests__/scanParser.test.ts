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

  it("uses the date after the expiration label when the line also has an issue date", () => {
    expect(parseScannedDocument("Expedición 01/02/2022 Vence 01/02/2028")).toMatchObject({
      expirationDate: "2028-02-01",
    });
    expect(
      parseScannedDocument("Date of issue 05/03/2021 Date of expiry 05/03/2031"),
    ).toMatchObject({
      expirationDate: "2031-03-05",
    });
  });

  it("reads an expiration date from the next line and normalizes accented uppercase labels", () => {
    expect(parseScannedDocument("FECHA DE VENCIMIENTO\n15/11/2030")).toMatchObject({
      expirationDate: "2030-11-15",
    });
    expect(parseScannedDocument("EXPIRACIÓN: 10/10/2029")).toMatchObject({
      expirationDate: "2029-10-10",
    });
  });

  it("uses month-first order for clear US documents and day-first otherwise", () => {
    expect(parseScannedDocument("USA DRIVER LICENSE\nEXP 05/11/2030")).toMatchObject({
      documentType: "drivers_license",
      expirationDate: "2030-05-11",
    });
    expect(parseScannedDocument("LICENCIA DE CONDUCIR\nVence: 05/11/2030")).toMatchObject({
      expirationDate: "2030-11-05",
    });
    expect(parseScannedDocument("Vence: 25/11/2030")).toMatchObject({
      expirationDate: "2030-11-25",
    });
  });

  it("uses month-first order for a US state and driver license label", () => {
    expect(parseScannedDocument("California Driver License\nEXP 05/11/2030")).toMatchObject({
      documentType: "drivers_license",
      expirationDate: "2030-05-11",
    });
  });
});
