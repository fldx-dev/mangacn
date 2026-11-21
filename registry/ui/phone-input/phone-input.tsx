"use client";

import { cn } from "cn";
import {
  AsYouType,
  type CountryCode,
  getCountryCallingCode,
  isValidPhoneNumber,
  parseIncompletePhoneNumber,
} from "libphonenumber-js/min";
import * as React from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

// mangacn phone input: combobox's country picker (ISO code and dialling code as text, no flags)
// in the leading addon of one input-group, beside a tel input that libphonenumber-js formats as
// you type (`/min` metadata). The form posts E.164 from a hidden input.

export { isValidPhoneNumber };

/** Built-in words, each overridable through `labels`. */
const defaultLabels = {
  country: "Country",
  search: "Search countries",
  empty: "No country found.",
};

export interface PhoneInputProps
  extends Omit<
    React.ComponentProps<"input">,
    | "value"
    | "defaultValue"
    | "onChange"
    | "type"
    | "name"
    | "autoComplete"
    | "inputMode"
    | "children"
  > {
  /** The number in E.164 (`+81312345678`), controlled; `""` when empty. */
  value?: string;
  /** The number it starts with in E.164, uncontrolled. */
  defaultValue?: string;
  /**
   * Called on every change with the number in E.164 (`""` when empty, partial while typing), the
   * picked country and whether the number is a valid one for it.
   */
  onValueChange?: (value: string, details: { country: CountryCode; valid: boolean }) => void;
  /** The country picked at first (ISO 3166-1 alpha-2); otherwise the first of `countries`, or `US`. */
  defaultCountry?: CountryCode;
  /**
   * Limits the list to these countries, in this order; otherwise all 245, by English name. When
   * it changes and no longer holds the picked country, the picker moves to `defaultCountry` (if
   * listed) or the first listed country, keeps the digits typed and reports the new number.
   */
  countries?: CountryCode[];
  /** The form field name; a hidden input posts the number in E.164. */
  name?: string;
  /**
   * The picker's words: `country` names the trigger, `search` the search box, `empty` shows
   * when no country matches.
   * @default { country: "Country", search: "Search countries", empty: "No country found." }
   */
  labels?: Partial<typeof defaultLabels>;
}

interface CountryOption {
  code: CountryCode;
  name: string;
  dial: string;
}

const option = (code: CountryCode): CountryOption => ({
  code,
  name: COUNTRY_NAMES[code] ?? code,
  dial: getCountryCallingCode(code),
});

const sameCountry = (a: CountryOption, b: CountryOption) => a.code === b.code;
const countryLabel = (country: CountryOption) => country.name;

/** Search by name, ISO code or dialling code (`+81` or `81`). */
function matchCountry(country: CountryOption, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const dial = q.replace(/^\+/, "");
  return (
    country.name.toLowerCase().includes(q) ||
    country.code.toLowerCase().startsWith(q) ||
    (/^\d+$/.test(dial) && country.dial.startsWith(dial))
  );
}

/** What `onValueChange` reports. */
interface Reported {
  value: string;
  country: CountryCode;
  valid: boolean;
}

interface Typed {
  country: CountryCode;
  /** What the person typed: digits, with a leading `+` for an international number. */
  digits: string;
}

function analyse({ country, digits }: Typed, allowed: Set<CountryCode>) {
  const formatter = new AsYouType(country);
  const text = formatter.input(digits);
  const value = digits ? (formatter.getNumberValue() ?? "") : "";
  const found = formatter.getCountry();
  const valid = formatter.isValid() && found !== undefined && allowed.has(found);
  return { text, value, valid };
}

/**
 * Typed text to state. An international number (`+81…`) picks its country when the list has it;
 * once it is a whole valid number it is shown the national way (`03-1234-5678`).
 */
function read(raw: string, country: CountryCode, allowed: Set<CountryCode>): Typed {
  const digits = parseIncompletePhoneNumber(raw);
  if (!digits.startsWith("+")) return { country, digits };
  const formatter = new AsYouType();
  formatter.input(digits);
  const found = formatter.getCountry();
  if (!found || !allowed.has(found)) return { country, digits };
  const number = formatter.getNumber();
  return {
    country: found,
    digits: number?.isValid() ? parseIncompletePhoneNumber(number.formatNational()) : digits,
  };
}

/** The national digits to keep when the country changes. */
function nationalDigits(digits: string) {
  if (!digits.startsWith("+")) return digits;
  const formatter = new AsYouType();
  formatter.input(digits);
  return formatter.getNumber()?.nationalNumber ?? "";
}

/** A character the number is made of; the rest is formatting. */
const significant = /[\d+]/;

/** Where the caret goes in `text`: after its `count`-th digit (or `+`). */
function caretAfter(text: string, count: number) {
  if (count <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < text.length; index++) {
    if (significant.test(text[index])) seen++;
    if (seen === count) return index + 1;
  }
  return text.length;
}

export function PhoneInput({
  value,
  defaultValue,
  onValueChange,
  defaultCountry,
  countries,
  name,
  labels,
  id,
  className,
  disabled,
  ref,
  onBlur,
  onKeyDown,
  onInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: PhoneInputProps) {
  const words = { ...defaultLabels, ...labels };
  const options = React.useMemo(
    () =>
      (countries ?? (Object.keys(COUNTRY_NAMES) as CountryCode[]))
        .filter((code) => code in COUNTRY_NAMES)
        .map(option),
    [countries],
  );
  const allowed = React.useMemo(() => new Set(options.map((entry) => entry.code)), [options]);
  const startCountry =
    defaultCountry && allowed.has(defaultCountry) ? defaultCountry : (options[0]?.code ?? "US");

  // The typed digits are the source of truth; `seen` is the E.164 value they were last read from
  // or reported as, so a controlled `value` is read again only when the parent changed it.
  const [state, setState] = React.useState(() => {
    const initial = value ?? defaultValue ?? "";
    return { ...read(initial, startCountry, allowed), seen: initial };
  });
  // A number moved to another country because `countries` dropped the picked one, until the
  // effect below reports it.
  const [moved, setMoved] = React.useState<Reported | null>(null);
  if (allowed.has(startCountry) && !allowed.has(state.country)) {
    const next = { country: startCountry, digits: nationalDigits(state.digits) };
    const result = analyse(next, allowed);
    setState({ ...next, seen: result.value });
    setMoved({ value: result.value, country: next.country, valid: result.valid });
  } else if (value !== undefined && value !== state.seen && !moved) {
    setState({ ...read(value, state.country, allowed), seen: value });
  }
  React.useEffect(() => {
    if (!moved) return;
    setMoved(null);
    onValueChange?.(moved.value, { country: moved.country, valid: moved.valid });
  }, [moved, onValueChange]);

  const [touched, setTouched] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  // The item's own ref and the caller's, on the one tel input.
  const setInput = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const caret = React.useRef<number | null>(null);
  const anchor = React.useRef<HTMLDivElement>(null);
  const descriptionId = React.useId();

  const { text, value: e164, valid } = analyse(state, allowed);
  const selected = options.find((entry) => entry.code === state.country) ?? option(state.country);

  const commit = (next: Typed, caretAt: number | null) => {
    const result = analyse(next, allowed);
    caret.current = caretAt === null ? null : caretAfter(result.text, caretAt);
    setState({ ...next, seen: result.value });
    setTouched(false);
    onValueChange?.(result.value, { country: next.country, valid: result.valid });
  };

  const type = (raw: string, caretIndex: number) => {
    const next = read(raw, state.country, allowed);
    // Count the digits before the caret, unless the number was rewritten the national way.
    const kept = next.digits.startsWith("+") === parseIncompletePhoneNumber(raw).startsWith("+");
    const before = parseIncompletePhoneNumber(raw.slice(0, caretIndex)).length;
    commit(next, kept ? before : next.digits.length);
  };

  // Put the caret back after the same digit once the formatted text is in the input.
  React.useLayoutEffect(() => {
    const input = inputRef.current;
    const at = caret.current;
    caret.current = null;
    if (at === null || !input || document.activeElement !== input) return;
    input.setSelectionRange(at, at);
  });

  // A submit shows an invalid number as invalid, as a blur does.
  React.useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onSubmit = () => setTouched(true);
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  const invalid =
    ariaInvalid === true || ariaInvalid === "true" || (touched && state.digits !== "" && !valid);

  return (
    <div data-slot="phone-input" className={cn("w-full min-w-0", className)}>
      <InputGroup ref={anchor}>
        <InputGroupAddon align="inline-start" className="pr-1 pl-1">
          <Combobox
            items={options}
            value={selected}
            onValueChange={(next: CountryOption | null) => {
              if (!next || next.code === state.country) return;
              commit({ country: next.code, digits: nationalDigits(state.digits) }, null);
            }}
            isItemEqualToValue={sameCountry}
            itemToStringLabel={countryLabel}
            filter={matchCountry}
            disabled={disabled}
          >
            <InputGroupButton
              size="xs"
              variant="ghost"
              render={<ComboboxTrigger />}
              data-slot="phone-input-country"
              className="font-medium text-foreground tabular-nums"
              disabled={disabled}
              // Base UI makes the trigger the combobox, which takes no name from its content; the
              // name holds the visible codes.
              aria-label={`${words.country}: ${selected.name}, ${selected.code} +${selected.dial}`}
            >
              <span>{selected.code}</span>{" "}
              <span className="hidden text-muted-foreground sm:inline">+{selected.dial}</span>
            </InputGroupButton>
            <ComboboxContent anchor={anchor} aria-label={words.country}>
              <ComboboxInput
                showTrigger={false}
                placeholder={words.search}
                aria-label={words.search}
                // No trigger or clear here, so no empty addon and its rule at the end.
                className="[&>[data-slot=input-group-addon]]:hidden"
              />
              <ComboboxEmpty>{words.empty}</ComboboxEmpty>
              <ComboboxList>
                {(entry: CountryOption) => (
                  <ComboboxItem key={entry.code} value={entry} className="gap-2.5">
                    <span className="w-6 shrink-0 font-medium">{entry.code}</span>{" "}
                    <span className="min-w-0 flex-1 truncate">{entry.name}</span>{" "}
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      +{entry.dial}
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </InputGroupAddon>
        <InputGroupInput
          ref={setInput}
          id={id}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={text}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={[ariaDescribedBy, descriptionId].filter(Boolean).join(" ")}
          onChange={(event) =>
            type(event.target.value, event.target.selectionStart ?? event.target.value.length)
          }
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented || event.key !== "Backspace") return;
            // Backspace over a formatting character (a space, a hyphen, a bracket) takes the
            // digit before it, or the formatter would put the character straight back.
            const input = event.currentTarget;
            const at = input.selectionStart ?? 0;
            if (at === 0 || at !== input.selectionEnd || significant.test(text[at - 1])) return;
            let digit = at - 1;
            while (digit >= 0 && !significant.test(text[digit])) digit--;
            event.preventDefault();
            if (digit < 0) return;
            type(text.slice(0, digit) + text.slice(digit + 1), digit);
          }}
          onBlur={(event) => {
            onBlur?.(event);
            setTouched(true);
          }}
          onInvalid={(event) => {
            onInvalid?.(event);
            setTouched(true);
          }}
          {...props}
        />
      </InputGroup>
      <span id={descriptionId} hidden>
        {`${selected.name}, +${selected.dial}`}
      </span>
      {name !== undefined && <input type="hidden" name={name} value={e164} disabled={disabled} />}
    </div>
  );
}

/**
 * English country names, frozen from `Intl.DisplayNames("en", { type: "region" })` over
 * libphonenumber-js's countries and sorted by name: the runtime's names change between ICU
 * versions, so a server and a browser could print two names for one country.
 */
const COUNTRY_NAMES: Partial<Record<CountryCode, string>> = {
  AF: "Afghanistan",
  AX: "Åland Islands",
  AL: "Albania",
  DZ: "Algeria",
  AS: "American Samoa",
  AD: "Andorra",
  AO: "Angola",
  AI: "Anguilla",
  AG: "Antigua & Barbuda",
  AR: "Argentina",
  AM: "Armenia",
  AW: "Aruba",
  AC: "Ascension Island",
  AU: "Australia",
  AT: "Austria",
  AZ: "Azerbaijan",
  BS: "Bahamas",
  BH: "Bahrain",
  BD: "Bangladesh",
  BB: "Barbados",
  BY: "Belarus",
  BE: "Belgium",
  BZ: "Belize",
  BJ: "Benin",
  BM: "Bermuda",
  BT: "Bhutan",
  BO: "Bolivia",
  BA: "Bosnia & Herzegovina",
  BW: "Botswana",
  BR: "Brazil",
  IO: "British Indian Ocean Territory",
  VG: "British Virgin Islands",
  BN: "Brunei",
  BG: "Bulgaria",
  BF: "Burkina Faso",
  BI: "Burundi",
  KH: "Cambodia",
  CM: "Cameroon",
  CA: "Canada",
  CV: "Cape Verde",
  BQ: "Caribbean Netherlands",
  KY: "Cayman Islands",
  CF: "Central African Republic",
  TD: "Chad",
  CL: "Chile",
  CN: "China",
  CX: "Christmas Island",
  CC: "Cocos (Keeling) Islands",
  CO: "Colombia",
  KM: "Comoros",
  CG: "Congo - Brazzaville",
  CD: "Congo - Kinshasa",
  CK: "Cook Islands",
  CR: "Costa Rica",
  CI: "Côte d’Ivoire",
  HR: "Croatia",
  CU: "Cuba",
  CW: "Curaçao",
  CY: "Cyprus",
  CZ: "Czechia",
  DK: "Denmark",
  DJ: "Djibouti",
  DM: "Dominica",
  DO: "Dominican Republic",
  EC: "Ecuador",
  EG: "Egypt",
  SV: "El Salvador",
  GQ: "Equatorial Guinea",
  ER: "Eritrea",
  EE: "Estonia",
  SZ: "Eswatini",
  ET: "Ethiopia",
  FK: "Falkland Islands",
  FO: "Faroe Islands",
  FJ: "Fiji",
  FI: "Finland",
  FR: "France",
  GF: "French Guiana",
  PF: "French Polynesia",
  GA: "Gabon",
  GM: "Gambia",
  GE: "Georgia",
  DE: "Germany",
  GH: "Ghana",
  GI: "Gibraltar",
  GR: "Greece",
  GL: "Greenland",
  GD: "Grenada",
  GP: "Guadeloupe",
  GU: "Guam",
  GT: "Guatemala",
  GG: "Guernsey",
  GN: "Guinea",
  GW: "Guinea-Bissau",
  GY: "Guyana",
  HT: "Haiti",
  HN: "Honduras",
  HK: "Hong Kong SAR China",
  HU: "Hungary",
  IS: "Iceland",
  IN: "India",
  ID: "Indonesia",
  IR: "Iran",
  IQ: "Iraq",
  IE: "Ireland",
  IM: "Isle of Man",
  IL: "Israel",
  IT: "Italy",
  JM: "Jamaica",
  JP: "Japan",
  JE: "Jersey",
  JO: "Jordan",
  KZ: "Kazakhstan",
  KE: "Kenya",
  KI: "Kiribati",
  XK: "Kosovo",
  KW: "Kuwait",
  KG: "Kyrgyzstan",
  LA: "Laos",
  LV: "Latvia",
  LB: "Lebanon",
  LS: "Lesotho",
  LR: "Liberia",
  LY: "Libya",
  LI: "Liechtenstein",
  LT: "Lithuania",
  LU: "Luxembourg",
  MO: "Macao SAR China",
  MG: "Madagascar",
  MW: "Malawi",
  MY: "Malaysia",
  MV: "Maldives",
  ML: "Mali",
  MT: "Malta",
  MH: "Marshall Islands",
  MQ: "Martinique",
  MR: "Mauritania",
  MU: "Mauritius",
  YT: "Mayotte",
  MX: "Mexico",
  FM: "Micronesia",
  MD: "Moldova",
  MC: "Monaco",
  MN: "Mongolia",
  ME: "Montenegro",
  MS: "Montserrat",
  MA: "Morocco",
  MZ: "Mozambique",
  MM: "Myanmar (Burma)",
  NA: "Namibia",
  NR: "Nauru",
  NP: "Nepal",
  NL: "Netherlands",
  NC: "New Caledonia",
  NZ: "New Zealand",
  NI: "Nicaragua",
  NE: "Niger",
  NG: "Nigeria",
  NU: "Niue",
  NF: "Norfolk Island",
  KP: "North Korea",
  MK: "North Macedonia",
  MP: "Northern Mariana Islands",
  NO: "Norway",
  OM: "Oman",
  PK: "Pakistan",
  PW: "Palau",
  PS: "Palestinian Territories",
  PA: "Panama",
  PG: "Papua New Guinea",
  PY: "Paraguay",
  PE: "Peru",
  PH: "Philippines",
  PL: "Poland",
  PT: "Portugal",
  PR: "Puerto Rico",
  QA: "Qatar",
  RE: "Réunion",
  RO: "Romania",
  RU: "Russia",
  RW: "Rwanda",
  WS: "Samoa",
  SM: "San Marino",
  ST: "São Tomé & Príncipe",
  SA: "Saudi Arabia",
  SN: "Senegal",
  RS: "Serbia",
  SC: "Seychelles",
  SL: "Sierra Leone",
  SG: "Singapore",
  SX: "Sint Maarten",
  SK: "Slovakia",
  SI: "Slovenia",
  SB: "Solomon Islands",
  SO: "Somalia",
  ZA: "South Africa",
  KR: "South Korea",
  SS: "South Sudan",
  ES: "Spain",
  LK: "Sri Lanka",
  BL: "St. Barthélemy",
  SH: "St. Helena",
  KN: "St. Kitts & Nevis",
  LC: "St. Lucia",
  MF: "St. Martin",
  PM: "St. Pierre & Miquelon",
  VC: "St. Vincent & Grenadines",
  SD: "Sudan",
  SR: "Suriname",
  SJ: "Svalbard & Jan Mayen",
  SE: "Sweden",
  CH: "Switzerland",
  SY: "Syria",
  TW: "Taiwan",
  TJ: "Tajikistan",
  TZ: "Tanzania",
  TH: "Thailand",
  TL: "Timor-Leste",
  TG: "Togo",
  TK: "Tokelau",
  TO: "Tonga",
  TT: "Trinidad & Tobago",
  TA: "Tristan da Cunha",
  TN: "Tunisia",
  TR: "Türkiye",
  TM: "Turkmenistan",
  TC: "Turks & Caicos Islands",
  TV: "Tuvalu",
  VI: "U.S. Virgin Islands",
  UG: "Uganda",
  UA: "Ukraine",
  AE: "United Arab Emirates",
  GB: "United Kingdom",
  US: "United States",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VU: "Vanuatu",
  VA: "Vatican City",
  VE: "Venezuela",
  VN: "Vietnam",
  WF: "Wallis & Futuna",
  EH: "Western Sahara",
  YE: "Yemen",
  ZM: "Zambia",
  ZW: "Zimbabwe",
};
