import type { ActionId, LawId, SubjectId } from '../engine/types';

/**
 * The word bank of the drafting table. A decree is a subject and a predicate,
 * and nothing else. The town has to be able to quote the whole law from memory,
 * and in a hamlet of five it will be quoted back at you by name.
 */

export const SUBJECT_WORDS: Record<SubjectId, string> = {
  work: 'THE WORK OF THIS PLACE',
  strangers: 'A STRANGER AT THE FENCE',
  dead: 'A DEATH IN THIS PLACE',
  mushrooms: 'WHAT GROWS IN THE WOOD',
  trade: 'ALL TRADE IN THIS PLACE',
  lives: 'WHEN A DEATH CANNOT BE AVOIDED',
  truth: 'A WORD SPOKEN IN THIS TOWN',
  crime: 'A HAND THAT TAKES WHAT IS NOT ITS OWN',
  song: 'A SONG SUNG IN THIS TOWN',
};

export const PREDICATE_WORDS: Record<ActionId, string> = {
  shared: 'IS SHARED ALIKE, AND SO IS THE HARVEST',
  ruled: 'IS ORDERED BY ONE, WHO DOES NOT DIG',
  owned: "IS EACH ONE'S OWN, AND SO IS WHAT IT BRINGS",
  welcomed: 'IS GIVEN A ROOF AND A SHARE',
  earned: 'WORKS A YEAR BEFORE A SHARE',
  turned_away: 'IS TURNED AWAY BEFORE DARK',
  with_a_day: 'STOPS THE WORK, AND ALL OF US STAND IN IT',
  by_the_house: 'IS CARRIED BY THE HOUSE IT HAPPENED IN',
  // the strip at the edge is what the other two answers do now; this is the
  // one that puts nobody in the ground. The id is kept: see `pv3_dead`.
  at_the_edge: 'GOES INTO THE RIVER, THE SAME DAY',
  finders: 'BELONGS TO WHOEVER IS UP EARLY ENOUGH TO FIND IT',
  weighed: 'IS PICKED BY THE PLACE, AND WEIGHED, AND SHARED',
  for_the_cart: 'GOES ON THE CART, AND NOBODY HERE EATS IT',
  free: 'IS FREE, AND PAYS NOTHING',
  taxed: 'PAYS THE CROWN A TENTH',
  licensed: 'BELONGS TO THE GUILD ALONE',
  by_count: 'THE GREATER NUMBER IS SAVED',
  untouchable: 'NO HAND MAY CHOOSE WHO DIES',
  by_lot: 'THE LOT DECIDES',
  mandatory: 'MUST BE TRUE',
  kind_lies: 'MAY BE KIND INSTEAD OF TRUE',
  forgiven: 'IS FED, AND ASKED WHY',
  repaid: 'PAYS BACK TWICE, AND IS DONE WITH IT',
  hanged: 'IS HANGED AT THE CROSSROADS',
  worthy: 'IS PAID FOR IF THE HALL CALLS IT WORTHY',
  by_crowd: 'IS PAID FOR BY THE SIZE OF ITS CROWD',
  by_hat: 'IS PAID FOR BY ITS OWN HAT, OR NOT AT ALL',
};

/** Where a shared predicate would read like a clerk who has never been outside. */
export const PREDICATE_OVERRIDES: Partial<Record<LawId, string>> = {
  truth_licensed: 'MAY LIE ONLY BY BOUGHT LICENCE',
};

export function predicateFor(subject: SubjectId, action: ActionId): string {
  return PREDICATE_OVERRIDES[`${subject}_${action}` as LawId] ?? PREDICATE_WORDS[action];
}

export function buildLabel(subject: SubjectId, action: ActionId): string {
  return `${SUBJECT_WORDS[subject]} ${predicateFor(subject, action)}`;
}
