# Play game normal flow test report: symyr0814a

- Date: 2026-08-14
- Player: symyr0814a (BO: x9048_symyr0814a)
- Currency: MYR
- Game: AI Gaming - Little Mermaid (`stage-mem.linkv2.com/play/aig?game=littlemermaid`)
- Reference checklist: Testpad #10059 "V2 Normal Flow" (sample only, not filled in)

## Test 1: Over Balance bet

- Balance before: 5.00 MYR
- Bet attempted: RM7.50 (> balance)
- Result: game showed "Not enough balance." — bet rejected as expected
- Playsite MyBets: No Record
- Playsite Statement: Running Total unchanged at 5.00, Net Win/Loss 0.00, Commission 0.00
- BO balance: unchanged at 5.00 MYR

**Result: PASS** — over-balance bet correctly rejected, no ticket generated.

## Test 2: Bet within balance (3x RM1.50)

- 3 bets placed at RM1.50 each, all resolved LOSE
- Tickets: AIG_448687, AIG_448688, AIG_448689 (game: Little Mermaid)
- Playsite Statement: Total Stake 4.50, Valid Bet 4.50, Net Win/Loss -4.50, Commission 0.04
- Balance after: 0.54 MYR (playsite and BO both confirm)

Cross-checked in BO:
- Search Ticket (by RoundId 202608141219213917): found AIG_448689, Little Mermaid, Bet 1.50/1.50, Status Lose, Win Loss -1.5, matches playsite exactly
- Reports > Win Lose Simple (today): Turnover 4.50, Gross Comm 0.04, Payout -4.45
- Reports > Member Statement (date range must start one day before today, else returns 0 rows — see note below): shows 2026-08-13 Transaction +5.00, 2026-08-14 Bet -4.50/Comm 0.04, Running Total 0.54, Total Winloss -4.45

**Result: PASS** — bet within balance succeeds, ticket recorded correctly, balance/statement/reports all consistent across playsite and BO.

## Test 3: Over Balance bet again (post-spin, balance 0.54)

- Bet attempted again exceeding remaining 0.54 balance
- Result: "Not enough balance." shown again, correctly rejected

**Result: PASS**

## Skipped

- 0011 "auto spin until balance run out" — not run as a dedicated auto-spin test (user opted to skip); balance draw-down was instead observed via 3 manual bets in Test 2
- BO "total bet outstanding" / member account "today's date" field check — skipped per user request

## Notes / quirks found

- Reports > Member Statement returns 0 rows when From date = To date = today; must set From to the previous day to see today's activity with a correct running total. Not a data-missing bug — retry with an earlier From date.
- BO Search Ticket requires either Ticket Number or RoundId (UserId alone is not sufficient to search).
- AI Gaming's Little Mermaid game iframe intermittently gets stuck loading around 97%; a manual refresh by the tester resolved it each time.
