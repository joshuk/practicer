export default function getTextWidth(element, text) {
  // Get the computed styles of the element
  const computedStyles = window.getComputedStyle(element)

  // Now create a new div with the same attributes as the select
  const tempElement = document.createElement('div')
  tempElement.style.cssText = `
    position: absolute;
    top: -999px;
    font-family: ${computedStyles.fontFamily};
    font-size: ${computedStyles.fontSize};
  `
  tempElement.textContent = text
  
  // Now append it to the body, get it's width, and remove it again
  document.body.appendChild(tempElement)
  const elementWidth = tempElement.clientWidth
  document.body.removeChild(tempElement)

  return elementWidth
}