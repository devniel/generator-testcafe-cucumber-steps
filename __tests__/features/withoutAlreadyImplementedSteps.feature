Feature: title

  Scenario: title
  Given precondition with "1" and "2"
  Given precondition with 1 and "2" and 3 and 5.
  Given precondition with "word" and "2" and 3 and "word".
  When action
  And addition
  Then testable outcome equals "1"
  Then non implemented step.