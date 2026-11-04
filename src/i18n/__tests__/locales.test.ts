import { resources } from '@/i18n';
import { SUPPORTED_LANGUAGES } from '@/i18n/languages';
import en from '@/i18n/locales/en';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') acc[path] = value;
    else Object.assign(acc, flatten(value, path));
    return acc;
  }, {});
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((match) => match[1] ?? '').sort();
}

const english = flatten(en as unknown as Tree);

describe.each(SUPPORTED_LANGUAGES)('locale "%s"', (language) => {
  const strings = flatten(resources[language].translation as unknown as Tree);

  it('has exactly the same keys as English', () => {
    expect(Object.keys(strings).sort()).toEqual(Object.keys(english).sort());
  });

  it('has no empty strings', () => {
    const empty = Object.entries(strings).filter(([, value]) => value.trim() === '');
    expect(empty).toEqual([]);
  });

  it('uses the same interpolation variables as English', () => {
    const mismatches = Object.keys(english).filter(
      (key) => JSON.stringify(placeholders(strings[key] ?? '')) !== JSON.stringify(placeholders(english[key] ?? '')),
    );
    expect(mismatches).toEqual([]);
  });

  it('provides every plural form the language needs for realistic counts', () => {
    const rules = new Intl.PluralRules(language);
    const needed = new Set<string>();
    for (let count = 0; count <= 100_000; count += count < 200 ? 1 : 997) needed.add(rules.select(count));
    const pluralBases = new Set(
      Object.keys(english)
        .filter((key) => /_(one|other)$/.test(key))
        .map((key) => key.replace(/_(zero|one|other)$/, '')),
    );
    const missing: string[] = [];
    for (const base of pluralBases) {
      for (const category of needed) {
        if (!(`${base}_${category}` in strings)) missing.push(`${base}_${category}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
