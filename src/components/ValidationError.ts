export function hasError(
  message: String | undefined,
  touched: boolean | undefined,
): boolean {
  return message !== undefined && touched !== undefined && touched;
}
