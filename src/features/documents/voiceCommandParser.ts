import type { ISODate } from '@/lib/dates';

import { findDocumentType, parseDate, type ScannedDocumentFields } from './scanParser';

const SPOKEN_DATE =
  /\b(?:19|20|21|22)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b|\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b|\b\d{1,2}\s+(?:de\s+)?[a-z]+\s+(?:de\s+)?\d{4}\b|\b[a-z]+\s+\d{1,2},?\s+\d{4}\b/g;

const EXPIRATION_CLAUSE =
  /(?:\b(?:that|which|que)\s+)?\b(?:expires?|expiring|expiry|expiration|expira(?:cion)?|vence|vencimiento|valid\s+until|valid\s+through|valido\s+hasta|valable\s+jusqu|date\s+d\s+expiration|data\s+de\s+validade)\b[\s\S]*$/i;

const COMMAND_PREFIX =
  /^(?:(?:please|por favor)\s+)?(?:(?:i want to|quiero|quero|je veux)\s+)?(?:add|create|save|register|track|record|agrega|agregar|anade|anadir|guarda|guardar|registra|registrar|adiciona|adicionar|adicione|cadastra|ajoute|enregistre)\b[\s,;:-]*(?:(?:my|the|a|an|mi|mis|el|la|un|una|meu|minha|minhas|meus|mon|ma|mes|le|les|une)\b[\s,;:-]*)*/i;

const LEADING_CONNECTOR = /^(?:(?:for|of|to|para|de|por|del|do|da|dos|das|du|des)\b[\s,;:-]*)+/i;

interface NormalizedText {
  text: string;
  starts: number[];
  ends: number[];
}

function normalizeWithOffsets(value: string): NormalizedText {
  let text = '';
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;

  for (const character of value) {
    const start = offset;
    offset += character.length;
    const normalized = character
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[’']/g, ' ');
    for (const outputCharacter of normalized) {
      text += outputCharacter;
      starts.push(start);
      ends.push(offset);
    }
  }

  return { text, starts, ends };
}

function originalRange(normalized: NormalizedText, start: number, length: number): [number, number] | null {
  const first = normalized.starts[start];
  const last = normalized.ends[start + length - 1];
  return first === undefined || last === undefined ? null : [first, last];
}

function withoutRanges(value: string, ranges: [number, number][]): string {
  return [...ranges]
    .sort(([a], [b]) => b - a)
    .reduce((text, [start, end]) => `${text.slice(0, start)} ${text.slice(end)}`, value);
}

function extractExpirationDate(normalized: string): { date: ISODate; index: number; length: number } | null {
  for (const match of normalized.matchAll(SPOKEN_DATE)) {
    const fragment = match[0];
    const date = fragment ? parseDate(fragment) : null;
    if (date && match.index !== undefined) return { date, index: match.index, length: fragment.length };
  }
  return null;
}

function cleanName(value: string): string | null {
  const name = value
    .replace(EXPIRATION_CLAUSE, '')
    .replace(COMMAND_PREFIX, '')
    .replace(/^(?:a\s+nombre\s+de|a\s+nome\s+de|nombre\s+de|nome\s+de|in\s+the\s+name\s+of|under\s+the\s+name\s+of)\b[\s,;:-]*/i, '')
    .replace(LEADING_CONNECTOR, '')
    .replace(/^(?:that|which|que|who|holder|owner|titular)\b[\s,;:-]*/i, '')
    .replace(/[0-9]/g, '')
    .replace(/[^\p{L}\p{M}\s.'’-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,;:.'’"()-]+|[\s,;:.'’"()-]+$/g, '')
    .trim();

  return name.length >= 2 ? name.slice(0, 80) : null;
}

export function parseVoiceDocumentRequest(transcript: string): ScannedDocumentFields {
  const normalized = normalizeWithOffsets(transcript);
  const typeMatch = findDocumentType(normalized.text);
  const dateMatch = extractExpirationDate(normalized.text);
  const ranges: [number, number][] = [];

  if (typeMatch) {
    const range = originalRange(normalized, typeMatch.index, typeMatch.match.length);
    if (range) ranges.push(range);
  }
  if (dateMatch) {
    const range = originalRange(normalized, dateMatch.index, dateMatch.length);
    if (range) ranges.push(range);
  }

  return {
    documentType: typeMatch?.documentType ?? null,
    documentName: typeMatch || dateMatch ? cleanName(withoutRanges(transcript, ranges)) : null,
    expirationDate: dateMatch?.date ?? null,
  };
}
