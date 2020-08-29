import { faCheck, faThumbsUp } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useCallback, useState } from "react"
import styled from "styled-components"

import { Button } from "./button"

const Question = styled.div`
  color: ${({ theme }) => theme.colors.accent2};
  font-weight: bold;
  margin-bottom: 0.5rem;
`

const ShoutButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.accent};
  /* color: ${({ theme }) => theme.colors.invertedText}; */
  color: #fff;
  font-weight: bold;
  text-transform: uppercase;
`

const TryPoll: React.FC = () => {
  const [tryPollClicked, setTryPollClicked] = useState(false)
  const handleClick = useCallback(() => {
    setTryPollClicked(true)
    window.gtag &&
      window.gtag("event", "tried-jeuchre", {
        event_category: "engagement",
        event_label: "poll",
      })
  }, [setTryPollClicked])

  return (
    <>
      {tryPollClicked ? (
        <Question>Thanks for trying Jeuchre and good luck in your next game!</Question>
      ) : (
        <Question>Please let us know if you've tried playing Jeuchre</Question>
      )}
      <ShoutButton onClick={handleClick}>
        <FontAwesomeIcon icon={tryPollClicked ? faCheck : faThumbsUp} /> YES I'VE TRIED JEUCHRE
      </ShoutButton>
    </>
  )
}

export default TryPoll
