/** Authored voices, independent of the reign's dice. Pitch, vowel and pace. */
export const VOICES: Record<string, readonly [number, number, number]> = {
  monarch: [145, 560, .15], iva: [310, 1450, .085], widow: [185, 730, .17],
  miller: [130, 800, .12], lever: [170, 970, .10], pusher: [110, 610, .15],
  chaplain: [155, 520, .18], clerk: [235, 1350, .085], tam: [105, 470, .19],
  marta: [220, 900, .13], millwright: [160, 1150, .105], riders: [125, 680, .11],
  charter: [205, 1200, .095], treasurer: [180, 1050, .09], healer: [250, 850, .15],
  captain: [115, 750, .12], fool: [285, 1250, .08], crowd: [165, 950, .105],
  lark: [275, 1100, .10], ferrier: [140, 650, .16], wolf: [78, 310, .24],
  players: [260, 1300, .09], singer: [240, 1000, .14], runner: [200, 1450, .085],
  brother: [150, 830, .135], aunt: [190, 690, .16], digger: [120, 580, .145],
  odo: [268, 1180, .095],
};

/** Keep arrivals restrained around death, punishment and collapse. */
export const HUSHED_CASES = new Set([
  'd1_pies', 'd2_ashes', 'd3_cart', 'd4_bridge', 'd5_deathbed', 'd6_door',
  'v4_hay', 'v5_winter_ground', 'v6_road_dead', 'v8_long_night',
  'wv_hearth', 'w_grain', 'w_cold', 'w_brother_fire', 'r1_tam_cut', 'r2_marta_moved',
  'c1_lark', 'c2_toll', 'tr_accused', 'tr_accused_wrong', 'tr_accused_again',
  'x_revolt', 'x_plague', 'x_ruin', 'x_abdication', 'x_flight', 'x_square',
]);

export const SOUND_UI = {
  label: 'Sound effects',
  on: 'Turn on settlement sounds, voices and effects',
  off: 'Mute settlement sounds, voices and effects',
  unavailable: 'Sound effects are unavailable in this browser',
  volume: 'Sound effects volume',
};
