const removeAccents = require('remove-accents').remove

/**
 * Create slugify -> "create-slugify" permalink  of text
 * @param {String} text
 * @returns {String}
 */
function slugify (text) {
  // to be sure that text is String
  text = text.toString()

  // remove regional characters
  text = removeAccents(text)

  return text
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
}

module.exports = slugify
