export default function getDeepClone(array) {
  return JSON.parse(JSON.stringify(array))
}