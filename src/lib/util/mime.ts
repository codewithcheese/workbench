export function humanType(type: string) {
  if (type.startsWith("image/") || type.startsWith("application/pdf")) {
    return type.split("/")[1];
  }
  return type;
}
