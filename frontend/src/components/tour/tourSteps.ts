// Guided tour steps. `target` matches a `data-tour="..."` attribute in the page.
export const TOUR_DONE_KEY = 'qp_tour_done';

export const TOUR_STEPS: { target: string; title: string; body: string }[] = [
  { target: 'universe', title: 'Pick your stocks', body: 'Choose the NIFTY 50 stocks the optimiser may pick from. A smaller list runs faster.' },
  { target: 'risk', title: 'Choose a risk profile', body: 'Cautious, balanced or bold. It sets how much the optimiser worries about ups and downs compared with chasing return.' },
  { target: 'holdings-count', title: 'How many stocks to hold', body: 'Set how many stocks the final portfolio should contain.' },
  { target: 'review', title: 'Check your choices', body: 'A quick summary of what you picked. Change anything here before you run.' },
  { target: 'run', title: 'Run the optimiser', body: 'Starts the quantum method and the three classical methods on the same problem. It takes about 10 seconds.' },
  { target: 'results', title: 'Your results', body: 'The portfolio, with weights, and a trade list in whole shares and rupees.' },
  { target: 'verdict', title: 'The honest verdict', body: 'A scorecard against the exact best answer: matched, near, or worse. If the quantum method does worse, it says so.' },
  { target: 'evidence-tab', title: 'See the evidence', body: 'Open the charts behind the verdict: convergence, sampled answers and the effect of noise.' },
];
