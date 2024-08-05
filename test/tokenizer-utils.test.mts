import { describe, it } from "node:test"
import assert from 'assert/strict'
import { parseDec, parseHex, parseOct } from "../src/tokenizer/utils.mjs"

describe("utils", () => {
  describe("#parseDecimal", () => {
    it(
      "0",
      () => {
        assert.equal(parseDec("0"), 0)
      }
    )

    it(
      "0.1",
      () => {
        assert.equal(parseDec("0.1"), 0.1)
      }
    )

    it(
      "1.23",
      () => {
        assert.equal(parseDec("1.23"), 1.23)
      }
    )
  })

  describe("#parseOct", () => {
    it(
      "00",
      () => {
        assert.equal(parseOct("0"), 0)
      }
    )

    it(
      "0123",
      () => {
        assert.equal(parseOct("0123"), 0o123)
      }
    )
  })

  describe("#parseHex", () => {
    it(
      "0x0",
      () => {
        assert.equal(parseHex("0x0"), 0x0)
      }
    )

    it(
      "0x123",
      () => {
        assert.equal(parseHex("0x123"), 0x123)
      }
    )

    it(
      "0xABC",
      () => {
        assert.equal(parseHex("0xABC"), 0xABC)
      }
    )

    it(
      "0xabc",
      () => {
        assert.equal(parseHex("0xabc"), 0xabc)
      }
    )

    it(
      "0xABCDEF",
      () => {
        assert.equal(parseHex("0xABCDEF"), 0xABCDEF)
      }
    )
  })
})
