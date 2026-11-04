import { parseVoiceDocumentRequest } from "@/features/documents/voiceCommandParser";

describe("parseVoiceDocumentRequest", () => {
  it("parses a Spanish document request with month-first date and owner name", () => {
    expect(
      parseVoiceDocumentRequest(
        "Agrega mi licencia de conducir, John Smith que expira en diciembre 22 2026",
      ),
    ).toEqual({
      documentType: "drivers_license",
      documentName: "John Smith",
      expirationDate: "2026-12-22",
    });
  });

  it("parses day-first Spanish dates with de and del", () => {
    expect(
      parseVoiceDocumentRequest(
        "Agrega mi pasaporte de María Pérez que vence el 22 de diciembre de 2026",
      ),
    ).toEqual({
      documentType: "passport",
      documentName: "María Pérez",
      expirationDate: "2026-12-22",
    });
  });

  it("supports English and Portuguese requests", () => {
    expect(
      parseVoiceDocumentRequest(
        "Add my passport for John Smith, expires December 22, 2026",
      ),
    ).toEqual({
      documentType: "passport",
      documentName: "John Smith",
      expirationDate: "2026-12-22",
    });
    expect(
      parseVoiceDocumentRequest(
        "Adicione minha carteira de motorista para Ana Souza que vence em 22 de dezembro de 2026",
      ),
    ).toEqual({
      documentType: "drivers_license",
      documentName: "Ana Souza",
      expirationDate: "2026-12-22",
    });
  });

  it("keeps only fields it can confidently identify", () => {
    expect(
      parseVoiceDocumentRequest("Agrega mi pasaporte a nombre de John Smith"),
    ).toEqual({
      documentType: "passport",
      documentName: "John Smith",
      expirationDate: null,
    });
    expect(parseVoiceDocumentRequest("Prueba de voz sin datos")).toEqual({
      documentType: null,
      documentName: null,
      expirationDate: null,
    });
  });

  it("does not accept an invalid spoken date", () => {
    expect(
      parseVoiceDocumentRequest(
        "Agrega mi pasaporte, John Smith que vence febrero 31 2026",
      ),
    ).toEqual({
      documentType: "passport",
      documentName: "John Smith",
      expirationDate: null,
    });
  });
});
