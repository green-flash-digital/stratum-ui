export function toPascalCase(name: string) {
  return name
    .replace(/\.svg$/, "")
    .replace(/(^\w|-\w)/g, (match) => match.replace("-", "").toUpperCase());
}
