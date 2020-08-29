import styled from "styled-components"

const Button = styled.button`
  min-height: 52px;
  min-width: 100px;
  border: none;
  border-radius: 10px;
  font-size: 16pt;
  padding: 1rem;
  cursor: pointer;
  :disabled {
    background: lightgray;
  }
`

export { Button }
