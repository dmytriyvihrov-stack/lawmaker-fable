/**
 * The one way a reign ends early, and the only one the player writes themselves.
 *
 * A law about wrongdoing is the only law in the game that names a punishment
 * rather than an arrangement. Seal the one that names the rope, and it is a
 * sentence with no exceptions in it, because you did not write any. Then stand
 * under it and say the rope is not for this particular person, in front of the
 * people who watched you seal it.
 *
 * They do not argue. They agree with you about the law. That is the problem.
 *
 * Nothing here is a punishment for playing badly: every other hard choice in
 * the game leaves you holding the seal. This one is the single case where the
 * consequence of a decree lands on the person who wrote it, and the screen says
 * so out loud before the answer is given.
 */

/** The warning on the answer itself, before it is chosen. */
export const OWN_ROPE_WARNING =
  'Your own decree names the rope and names no exceptions. If you make one standing under it, the town will hold you to the sentence you wrote.';

/** What happens the moment the ruling is spoken. Appended to the aftermath. */
export const OWN_ROPE_SCENE = [
  'You say it, and it is a good sentence, and the square agrees with every word of it. A child should not hang for a coat. Nobody in the crowd thinks otherwise.',
  'What the crowd also does not think otherwise about is the decree on the post behind you, which you wrote, which names the crossroads and names nobody it does not apply to. They read it again, out loud, twice, because reading it aloud is what you taught them to do.',
  'The Captain asks you, quietly, whether the law means what it says. You have spent your whole reign teaching this town that it does.',
  'They are not cruel about it. They walk you out to the crossroads in the afternoon, in good order, with the decree carried in front, and the boy keeps the coat.',
];

/**
 * The same ending, reached from a different bench.
 *
 * The coat is the answer that says the rope is not for a child, out loud. The
 * toll box is quieter: a man everybody agrees took a winter of grain, over
 * eleven years, and the ruling that nobody is to count the box again. Under
 * every other law about wrongdoing that is a mercy. Under the one that names
 * the crossroads it is the same sentence as the coat, said by not saying it.
 * Keyed by case; a case with no scene of its own gets the coat's.
 */
export const OWN_ROPE_SCENES: Record<string, string[]> = {
  c1_lark: OWN_ROPE_SCENE,
  c2_toll: [
    'You say it, and it is a reasonable sentence, and half the square nods. He knows the river. Nobody else does. A winter of grain over eleven years is a bad thing and not a hanging thing, and most people here would have said so in a kitchen.',
    'The post at the crossroads does not say so. It says what happens to a hand that takes, and it names nobody it does not apply to, because you wrote none in. The other half of the square reads it out, twice, standing, the way you taught them to read a decree.',
    'The Captain asks you, quietly, whether the box counts as taking. You have spent your whole reign teaching this town that a decree means exactly what it says.',
    'They are not cruel about it. They walk you out to the crossing in the afternoon, in good order, with the decree carried in front, and the Ferrier rows the boat back alone.',
  ],
};

/** The portrait, when a reign ends this way. It replaces the usual reading. */
export const OWN_ROPE_HEADLINE = 'You wrote it. They read it. It applied to you.';

export const OWN_ROPE_DESC =
  'Every law you sealed was obeyed, and the last one was obeyed most carefully of all. The town did not turn on you: it did exactly what you spent the reign telling it to do, on the one day you asked it to stop.';
