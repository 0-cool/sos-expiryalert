import { isValidISODate, type ISODate } from '@/lib/dates';

import { isDocumentType, type DocumentType } from './types';

export interface ScannedDocumentFields {
  documentType: DocumentType | null;
  documentName: string | null;
  expirationDate: ISODate | null;
}

const TYPE_PATTERNS: readonly [DocumentType, RegExp][] = [
  ['passport', /\b(passport|pasaporte|passaporte|passeport)\b/],
  [
    'drivers_license',
    /\b(driver.?s license|driver license|driving license|licencia de conducir|carnet de conducir|permiso de conducir|carteira de habilitacao|carteira de motorista|carta de conducao|permis de conduire)\b/,
  ],
  [
    'national_id',
    /\b(national identity|identity card|national id|cedula|documento de identidad|documento nacional de identidad|dni|carte nationale d identite|carte d identite|cartao de cidadao|bilhete de identidade|carteira de identidade)\b/,
  ],
  ['visa', /\b(visa|visado)\b/],
  ['residence_permit', /\b(residence permit|resident card|permiso de residencia|permiso de resid\w+|titre de sejour|autorizacao de residencia)\b/],
  ['vehicle_registration', /\b(vehicle registration|registration certificate|matricula|registro del vehiculo|certificado de matricula|certificat d immatriculation)\b/],
  ['vehicle_insurance', /\b(vehicle insurance|auto insurance|car insurance|seguro (?:del|de) vehiculo|seguro automovel|assurance automobile)\b/],
  ['medical_insurance', /\b(health insurance|medical insurance|seguro medico|seguro de salud|seguro de saude|assurance maladie|seguro saude)\b/],
  ['professional_certification', /\b(professional certification|certificate|certificacion|certificado|certification|certificat|diploma)\b/],
];

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  janv: 1,
  enero: 1,
  janeiro: 1,
  janvier: 1,
  feb: 2,
  february: 2,
  fev: 2,
  fevr: 2,
  febrero: 2,
  fevereiro: 2,
  fevrier: 2,
  mar: 3,
  march: 3,
  marzo: 3,
  marco: 3,
  mars: 3,
  apr: 4,
  april: 4,
  abr: 4,
  abril: 4,
  avr: 4,
  avril: 4,
  may: 5,
  mayo: 5,
  mai: 5,
  jun: 6,
  june: 6,
  junio: 6,
  junho: 6,
  juin: 6,
  jul: 7,
  july: 7,
  julio: 7,
  juillet: 7,
  aug: 8,
  august: 8,
  ago: 8,
  agosto: 8,
  aout: 8,
  sep: 9,
  sept: 9,
  september: 9,
  set: 9,
  septiembre: 9,
  setembro: 9,
  septembre: 9,
  oct: 10,
  october: 10,
  out: 10,
  octubre: 10,
  outubro: 10,
  octobre: 10,
  nov: 11,
  november: 11,
  noviembre: 11,
  novembre: 11,
  dec: 12,
  december: 12,
  dez: 12,
  diciembre: 12,
  dezembro: 12,
  decembre: 12,
};

export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, ' ');
}

export function findDocumentType(text: string): { documentType: DocumentType; index: number; match: string } | null {
  for (const [documentType, pattern] of TYPE_PATTERNS) {
    const match = pattern.exec(text);
    if (match?.index !== undefined) return { documentType, index: match.index, match: match[0] };
  }
  return null;
}

function normalizedName(value: string): string | null {
  const name = value
    .replace(/[0-9]/g, '')
    .replace(/[^\p{L}\p{M}\s.'’-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return name.length >= 2 ? name.slice(0, 80) : null;
}

function parseYear(value: string): number {
  const year = Number(value);
  return value.length === 2 ? 2000 + year : year;
}

function toISODate(year: number, month: number, day: number): ISODate | null {
  const value = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return isValidISODate(value) ? value : null;
}

export function parseDate(value: string, order: 'DMY' | 'MDY' = 'DMY'): ISODate | null {
  const iso = /\b((?:19|20|21|22)\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/.exec(value);
  if (iso?.[1] && iso[2] && iso[3]) return toISODate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const numeric = /\b(\d{1,2})[./\s-](\d{1,2})[./\s-](\d{2,4})\b/.exec(value);
  if (numeric?.[1] && numeric[2] && numeric[3]) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    const year = parseYear(numeric[3]);
    const month = first > 12 ? second : second > 12 || order === 'MDY' ? first : second;
    const day = first > 12 ? first : second > 12 || order === 'MDY' ? second : first;
    return toISODate(year, month, day);
  }

  const normalized = normalizeText(value);
  const textDate =
    /\b(\d{1,2})\s+(?:de\s+)?([a-z]+)\.?,?\s+(?:de\s+)?(\d{4})\b/.exec(normalized) ??
    /\b([a-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})\b/.exec(normalized);
  if (!textDate?.[1] || !textDate[2] || !textDate[3]) return null;

  if (/^\d/.test(textDate[1])) {
    return toISODate(Number(textDate[3]), MONTHS[textDate[2].replace(/\.$/, '')] ?? 0, Number(textDate[1]));
  }
  return toISODate(Number(textDate[3]), MONTHS[textDate[1].replace(/\.$/, '')] ?? 0, Number(textDate[2]));
}

const EXPIRY_LABEL =
  /\b(date of expiry|date of expiration|expiration date|expiry date|expires?|expiry|expiration|expiracion|exp\.?|fecha de vencimiento|fecha de expiracion|vence|valid until|valid through|valid thru|valido hasta|valable jusqu|date d expiration|data de validade|validade)\b/;

const US_STATES =
  /\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)\b/;

function getDateOrder(text: string): 'DMY' | 'MDY' {
  const normalized = normalizeText(text);
  if (/\b(?:usa|united states)\b/.test(normalized)) return 'MDY';
  return US_STATES.test(normalized) && /\b(?:driver license|drivers license|driver s license)\b/.test(normalized)
    ? 'MDY'
    : 'DMY';
}

function normalizeWithEndOffsets(value: string): { text: string; ends: number[] } {
  let text = '';
  const ends: number[] = [];
  let offset = 0;
  for (const character of value) {
    offset += character.length;
    const normalized = character.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, ' ');
    for (const normalizedCharacter of normalized) {
      text += normalizedCharacter;
      ends.push(offset);
    }
  }
  return { text, ends };
}

function mrzLines(lines: string[]): string[] {
  return lines.map((line) => line.toUpperCase().replace(/[^A-Z0-9<]/g, ''));
}

function readMrz(lines: string[]): { name: string | null; expirationDate: ISODate | null } {
  const normalized = mrzLines(lines);
  const firstLineIndex = normalized.findIndex((line) => line.startsWith('P<') && line.length >= 25);
  if (firstLineIndex < 0) return { name: null, expirationDate: null };

  const firstLine = normalized[firstLineIndex];
  if (!firstLine) return { name: null, expirationDate: null };
  const nameParts = firstLine.slice(5).split('<<');
  const surname = (nameParts[0] ?? '').replace(/</g, ' ').trim();
  const givenNames = nameParts.slice(1).join(' ').replace(/</g, ' ').trim();
  const name = normalizedName([givenNames, surname].filter(Boolean).join(' '));

  const secondLine = normalized
    .slice(firstLineIndex + 1)
    .find((line) => line.length >= 27 && line.length <= 44 && /\d/.test(line));
  const encodedDate = secondLine?.slice(21, 27).replace(/[OQD]/g, '0').replace(/[IL]/g, '1');
  const expirationDate =
    encodedDate && /^\d{6}$/.test(encodedDate)
      ? toISODate(2000 + Number(encodedDate.slice(0, 2)), Number(encodedDate.slice(2, 4)), Number(encodedDate.slice(4, 6)))
      : null;

  return { name, expirationDate };
}

function readName(lines: string[]): string | null {
  const fullNameLabels = /^(?:full name|name of holder|holder(?:s)? name|nombre completo|nom complet|nome completo|titular|name|nombre|nom|nome)\s*[:\-]\s*(.+)$/i;
  const surnameLabels = /^(?:surname|family name|last name|apellido(?:s)?|sobrenome|nom de famille)\s*[:\-]\s*(.+)$/i;
  const givenNameLabels = /^(?:given names?|forenames?|first name|nombres?|prenoms?|nomes?)\s*[:\-]\s*(.+)$/i;

  for (const line of lines) {
    const match = line.trim().match(fullNameLabels);
    if (match?.[1]) return normalizedName(match[1]);
  }

  let surname: string | null = null;
  let givenNames: string | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    const surnameMatch = trimmed.match(surnameLabels);
    if (surnameMatch?.[1]) surname = normalizedName(surnameMatch[1]);
    const givenNamesMatch = trimmed.match(givenNameLabels);
    if (givenNamesMatch?.[1]) givenNames = normalizedName(givenNamesMatch[1]);
  }
  return surname || givenNames ? normalizedName([givenNames, surname].filter(Boolean).join(' ')) : null;
}

function readExpirationDate(
  lines: string[],
  mrzDate: ISODate | null,
  order: 'DMY' | 'MDY',
): ISODate | null {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) continue;
    const { text: normalizedLine, ends } = normalizeWithEndOffsets(line);
    const expiryLabel = EXPIRY_LABEL.exec(normalizedLine);
    if (!expiryLabel || expiryLabel.index === undefined) continue;

    const labelEnd = expiryLabel.index + expiryLabel[0].length;
    const originalLabelEnd = ends[labelEnd - 1] ?? line.length;
    const dateOnLine = parseDate(line.slice(originalLabelEnd), order);
    if (dateOnLine) return dateOnLine;
    for (const nextLine of lines.slice(index + 1, index + 3)) {
      const dateOnNextLine = parseDate(nextLine, order);
      if (dateOnNextLine) return dateOnNextLine;
    }
  }
  return mrzDate;
}

export function parseScannedDocument(text: string): ScannedDocumentFields {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const normalized = normalizeText(text);
  const mrz = readMrz(lines);
  const documentType = findDocumentType(normalized)?.documentType ?? (mrz.name ? 'passport' : null);
  const dateOrder = getDateOrder(normalized);

  return {
    documentType: documentType && isDocumentType(documentType) ? documentType : null,
    documentName: mrz.name ?? readName(lines),
    expirationDate: readExpirationDate(lines, mrz.expirationDate, dateOrder),
  };
}
