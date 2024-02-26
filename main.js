const { Plugin } = require("obsidian")
const { syntaxTree } = require("@codemirror/language")
const { ViewPlugin, Decoration, ViewUpdate, EditorView } = require("@codemirror/view")
const { RangeSet, RangeSetBuilder } = require("@codemirror/state")

const BLOCKQUOTE_PATTERN = /^\s*>[>\s]*/

/**
 * @param {EditorView} view
 * @returns {RangeSet<Decoration>}
 */
function decorate(view) {
  /** @type {RangeSetBuilder<Decoration>} */
  const builder = new RangeSetBuilder()
  syntaxTree(view.state).iterate({
    enter: node => {
      if (node.name.startsWith("list")) {
        const slice = view.state.sliceDoc(node.from, node.to)
        const match = slice.match(BLOCKQUOTE_PATTERN)
        if (match) {
          const image = match[0]
          builder.add(node.from, node.from + image.length, Decoration.mark({
            class: "cm-formatting cm-formatting-quote cm-quote",
            inclusive: true,
          }))
        }
      }
    }
  })
  return builder.finish()
}

const viewPlugin = ViewPlugin.fromClass(
  class {
    /** @type {RangeSet<Decoration>} */
    decorations

    /** @param {EditorView} view */
    constructor(view) {
      this.decorations = decorate(view)
    }

    /** @param {ViewUpdate} update */
    update(update) {
      if (update.docChanged) {
        this.decorations = decorate(update.view)
      }
    }
  },

  { decorations: value => value.decorations }
)

module.exports = class extends Plugin {
  async onload() {
    this.registerEditorExtension(viewPlugin);
  }
}