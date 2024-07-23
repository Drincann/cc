import assert from "assert";
export var TokenType;
(function (TokenType) {
    TokenType[TokenType["Identifier"] = 0] = "Identifier";
})(TokenType || (TokenType = {}));
export class ClangTokenizer {
    code;
    nextPosition = 0;
    meta = {
        line: 1,
        symbols: {}
    };
    constructor(code) {
        this.code = code;
    }
    static fromCode(code) {
        return new ClangTokenizer(code);
    }
    next() {
        let current;
        while (current = this.code[this.nextPosition]) {
            assert(current.length === 1, "tokenizer: current char should be a single character.");
            this.nextPosition++;
            if (isEOF(current)) {
                break;
            }
            if (current === ' ') {
                continue;
            }
            if (current === '\n') {
                this.meta.line++;
                continue;
            }
            if (current === '#') {
                this.skipMacro();
                continue;
            }
            if (isIdentifierStart(current)) {
                return this.parseNextIdentifier();
            }
        }
        return undefined;
    }
    skipMacro() {
        this.until(new Set(['\n', '\0']));
    }
    parseNextIdentifier() {
        const start = this.nextPosition - 1;
        let end = this.nextPosition;
        let current = this.code[end];
        while (current != undefined && isIdentifier(current)) {
            end++;
            current = this.code[end];
        }
        this.nextPosition = end;
        const name = this.code.substring(start, end);
        if (this.symbolNotExists(name)) {
            this.insertSymbol(name);
        }
        return this.getSymbol(name);
    }
    getSymbol(name) {
        return this.meta.symbols[name].token;
    }
    symbolNotExists(name) {
        return !(name in this.meta.symbols);
    }
    insertSymbol(name) {
        this.meta.symbols[name] = {
            name,
            token: {
                type: TokenType.Identifier,
                value: name,
                line: this.meta.line
            },
        };
    }
    until(charSet) {
        let current = this.code[this.nextPosition];
        while (current != undefined && !charSet.has(current)) {
            this.nextPosition++;
            current = this.code[this.nextPosition];
        }
    }
}
function isEOF(char) {
    return char === '\0' || char === undefined;
}
function isIdentifierStart(char) {
    return isAlpha(char) || char === '_';
}
function isIdentifier(char) {
    return isAlpha(char) || isDigit(char) || char === '_';
}
function isAlpha(char) {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
}
function isDigit(char) {
    return char >= '0' && char <= '9';
}
