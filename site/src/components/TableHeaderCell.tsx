import styled from "styled-components"

export default styled.th`
background-color: ${({ theme }) => theme.colors.green3};
border-color: ${({ theme }) => theme.colors.text};
border: solid;
border-width: 1px;
padding-left: 0.5rem;
padding-right: 0.5rem;
`
