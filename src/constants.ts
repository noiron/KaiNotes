export const ALL_TAGS = '__ALL__';
export const UNTAGGED = '__UNTAGGED__';

export const TAG_TEXT: { [index: string]: string } = {
  [ALL_TAGS]: 'ALL',
  [UNTAGGED]: 'UNTAGGED',
};

// (?<=^|\s) positive lookbehind - hash must be start of a line or have space before it
// (?!\s|#|!|\d) negative lookahead - space, #, !, numbers can't be after hash
export const MARKDOWN_REGEX = /(?<=^|\s)#(?!\s|#|!|\d)([\S]+)/gm;