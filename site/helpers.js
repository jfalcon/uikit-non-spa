// allows us to know if we're in production mode during runtime as opposed to just compile time
export function isProdMode() {
  let result = false;

  '#if process.env.NODE_ENV === "production"';
      result = true;
  '#endif';

  return result;
}

// parses the IETF language tag format defined in BCP 47 (RFC 5646 and RFC 4647)
export function getNavigatorLocale() {
  // different browsers have the user locale defined on different fields
  // in the navigator object, so we make sure to account the differences
  const code = ((navigator.languages && navigator.languages[0])
               || navigator.language || navigator.userLanguage || '').trim();

  // if there is a region code then extract it
  const parts = code.toLowerCase().split(/[_-]+/);

  // do not support the Language-Script-Region-Variant since browsers don't use it
  return {
    full: code,
    language: (parts[0] || code),
    region: (parts.length >= 2 ? parts[1] : null)
  };
}
