export class ParserError extends Error {
  private constructor(message: string) {
    super(message)
  }

  public static assert(condition: boolean, message: string) {
    if (!condition) {
      throw new ParserError(message)
    }
  }
}
