/** Keeps every locale structurally aligned while allowing translated string values. */
export type TranslationShape<T> = {
  readonly [Key in keyof T]: T[Key] extends string ? string : TranslationShape<T[Key]>
}
