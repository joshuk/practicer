import styled from 'styled-components'

const Underline = styled.span`
  text-decoration: underline;
  /* text-decoration-style: dashed; */
  text-decoration-color: rgb(var(--red));
  text-decoration-thickness: 2px;
  text-underline-offset: 6px;

  @media screen and (max-width: 750px) {
    text-decoration-thickness: 1px;
    text-underline-offset: 5px;
  }
`

export default Underline