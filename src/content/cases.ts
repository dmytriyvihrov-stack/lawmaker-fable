import type { CaseEvent } from '../engine/types';

/**
 * Six cases, two per law. Declaration order is the scheduler tie break.
 *
 * Every case has three answers that are always there and pull against each
 * other, kind to hard, plus the answers that exist only because a law of yours
 * is standing. Some of those are the lawful thing. Some of them break the law
 * you wrote, in front of the people who watched you write it.
 */
export const CASES: CaseEvent[] = [
  // ================================================================= village: work
  {
    id: 'v1_idle_hand',
    trigger: { kind: 'lawActive', subject: 'work' },
    priority: 1,
    character: 'tam',
    title: 'The Idle Hand',
    question: 'One pair of hands has stopped working. Every other pair is looking at you.',
    scene: [
      'Tam says his back. Tam said his back last spring too, and dug anyway, so nobody knows which back this is.',
      'One field, one store, and a winter that does not count hands.',
    ],
    choices: [
      {
        id: 'feed_him',
        text: 'He eats. A place that counts backs is not a place.',
        result:
          'Tam eats, and mends the fence sitting down, and the fence is the best it has ever been.',
        tags: ['communitarian'],
        effects: { health: 6, economy: -8 },
        setFlags: ['tam_fed'],
      },
      {
        id: 'half_share',
        text: 'Half a share for half a day, if he can.',
        result: 'Tam does half a day, most days. Nobody measures it, which is the point.',
        tags: ['utilitarian'],
        effects: { health: 2, economy: -2 },
      },
      {
        id: 'no_work_no_bread',
        text: 'No work, no bread. He eats when he digs.',
        result: 'Tam digs. He digs badly and slowly and does not speak to you until the frost.',
        tags: ['kantian'],
        effects: { economy: 8, health: -8, mood: -8 },
        setFlags: ['tam_cut'],
      },
      {
        id: 'cut_his_share',
        text: 'Cut his share, under a law that shares alike.',
        result:
          'The share is cut in front of four people who have all heard the law. They do not argue. They remember.',
        tags: ['utilitarian'],
        effects: { economy: 6, health: -4, mood: -10 },
        exceptionToLaw: 'work_shared',
        beneficiary: 'the four who dig',
        setFlags: ['tam_cut'],
      },
      {
        id: 'headman_decides',
        text: 'You are the one who does not dig, so you decide: Tam mends tools.',
        result:
          'The headman finds him a stool and a pile of broken handles. By spring there are no broken handles.',
        tags: ['meritocratic'],
        effects: { economy: 4, health: 2 },
      },
      {
        id: 'his_own_field',
        text: 'His field, his back. He eats what it gives.',
        result: 'His field gives less than a field. He eats less than a man. The law is exact about it.',
        tags: ['libertarian'],
        effects: { economy: 4, health: -10, mood: -12 },
        setFlags: ['tam_cut'],
      },
    ],
  },

  {
    id: 'v2_well',
    /* A scene about the well cannot arrive in a place with no well in it. */
    trigger: {
      kind: 'all',
      conds: [
        { kind: 'lawActive', subject: 'work' },
        { kind: 'built', work: 'well' },
      ],
    },
    priority: 2,
    character: 'fool',
    title: 'The Well',
    question: 'Four buckets a day, more mouths than that, and no rain in the sky.',
    scene: [
      'The well gives four buckets a day and then mud. There are more of you than buckets. The rain is a week away, or three.',
      'Nobody has said the arithmetic out loud yet. Everyone has done it.',
    ],
    choices: [
      {
        id: 'share_thin',
        text: 'Everyone drinks less. Four buckets, split between all of us, all week.',
        result:
          'Thin cups all week. The rain comes on the ninth day, and everybody is still there to be rained on.',
        tags: ['egalitarian'],
        effects: { health: -8, economy: -4 },
        setFlags: ['well_shared'],
      },
      {
        id: 'draw_lots',
        text: 'Draw lots each morning for who goes without.',
        result:
          'Pebbles in a hat, every dawn. Tam draws the short one three days running and says nothing about it.',
        tags: ['egalitarian'],
        effects: { health: -4, crownSanity: -2 },
        setFlags: ['well_lots'],
      },
      {
        id: 'weakest_waits',
        text: 'The weakest waits. The diggers drink.',
        result:
          'The diggers drink and dig. The weakest waits and watches them, and the field does very well that year.',
        tags: ['utilitarian'],
        effects: { economy: 6, health: -12 },
        setFlags: ['well_cut'],
      },
      {
        id: 'diggers_first',
        text: 'The diggers drink first, this once.',
        result:
          'This once is written on nothing and remembered by everyone. The next dry year, nobody asks.',
        tags: ['utilitarian'],
        effects: { economy: 4, health: -4 },
        exceptionToLaw: 'work_shared',
        beneficiary: 'the diggers',
      },
      {
        id: 'headman_drinks_last',
        text: 'The headman drinks last, and says so.',
        result: 'You drink last for nine days. It is the only stretch of the reign when the chair does not matter.',
        tags: ['communitarian'],
        effects: { health: -4, crownSanity: 6 },
      },
      {
        id: 'sell_the_bucket',
        text: 'The last bucket goes to whoever pays for it.',
        result:
          'The last bucket fetches a hen, then a blanket, then nothing, because by then nobody has anything left to pay with.',
        tags: ['libertarian'],
        effects: { economy: 8, health: -8 },
      },
    ],
  },

  // ================================================================= village: strangers
  {
    id: 'v3_millwright',
    trigger: { kind: 'lawActive', subject: 'strangers' },
    priority: 1,
    character: 'millwright',
    title: 'The Mill-Wright',
    question: 'The best plot on the stream is farmed by Marta. A stranger could put a mill on it.',
    scene: [
      'He has built two mills before and shows his hands to prove it. Marta has farmed that plot for eleven years and shows nothing.',
      'A mill would feed twice the hamlet. Marta feeds Marta.',
    ],
    choices: [
      {
        id: 'marta_keeps',
        text: 'Marta keeps her plot. He builds downstream, or nowhere.',
        result:
          'He builds downstream, badly, where the water is slow. The mill turns on wet days. Marta brings him bread.',
        tags: ['kantian'],
        effects: { crownSanity: 4, economy: 2 },
        setFlags: ['marta_kept'],
      },
      {
        /* The compromise, and what it costs. It used to be the easy way out
           of the whole dilemma: the store went up, nobody lost a field, and
           the only downside was an argument about noise. A split still keeps
           Marta on her ground and gets the hamlet a mill, and now the store
           pays for the half of the wheel that stands on nobody's ground, and
           the mill is a slow one for a year. Every door here gives something
           up; this one gives up coin and time rather than a person. */
        id: 'share_the_stream',
        text: 'Split it: the mill on the bank, Marta on the field. The place pays for the wheel.',
        result:
          "The wheel goes in at the bank and Marta keeps the field behind it, and the store pays for the half of the wheel that stands on nobody's ground. It turns by the second autumn, slowly. They argue about the noise for eleven years.",
        tags: ['communitarian'],
        effects: { economy: -6, health: 2, mood: 4 },
        setFlags: ['marta_kept'],
      },
      {
        id: 'plot_to_the_mill',
        text: 'The plot goes to the mill. Marta gets a share of the flour.',
        result: 'The mill feeds the hamlet by autumn. Marta eats the flour and does not plant again.',
        tags: ['utilitarian'],
        // done in the open, under the law, and it still takes a field off a woman
        effects: { economy: 14, crownSanity: -4, health: 2 },
        setFlags: ['marta_moved'],
      },
      {
        id: 'a_roof_and_a_plot',
        text: 'The law says a roof and a share. A share means the plot. Marta moves.',
        result:
          'The law said a share, and a share turned out to mean the best plot. Marta reads the law twice that winter.',
        tags: ['communitarian'],
        effects: { economy: 12, crownSanity: -6 },
        setFlags: ['marta_moved'],
      },
      {
        id: 'a_year_first',
        text: 'He works a year for Marta first. Then we talk.',
        result:
          'He digs for Marta for a year and builds her a mill on the second, out of gratitude and spite in equal parts.',
        tags: ['meritocratic'],
        effects: { economy: 6, health: 2 },
        setFlags: ['marta_kept'],
      },
      {
        /* The same mill as `plot_to_the_mill`, with the gate shut behind it.
           The crown pays for the exception on top of what is written here, and
           the fence stops meaning anything: three more come, and Marta keeps
           her field only because nobody dares take it twice in one year. */
        id: 'stays_anyway',
        text: 'He stays, mill and all, under a law that turns strangers away.',
        result:
          'The gate says one thing and the mill says another, and the mill is louder. Three more strangers try the fence that year.',
        tags: ['utilitarian'],
        effects: { economy: 8, crownSanity: -4, health: -4 },
        souls: 6,
        exceptionToLaw: 'strangers_turned_away',
        beneficiary: 'the mill-wright',
        setFlags: ['marta_kept'],
      },
    ],
  },

  {
    id: 'v4_hay',
    trigger: { kind: 'lawActive', subject: 'strangers' },
    priority: 2,
    character: 'riders',
    title: 'The Man in the Hay',
    question: 'The riders want a man who has been digging beside you since April.',
    scene: [
      'Two riders, one paper, one name. The name is his. He has dug every day since April and never said why he left.',
      'The riders will be back at dusk. The hay is behind the house.',
    ],
    choices: [
      {
        id: 'hide_him',
        text: 'He is one of us now. The hay says nothing.',
        result:
          'The riders leave at dark with a paper and no man. He digs the next morning as if nothing happened, and so do you.',
        tags: ['communitarian'],
        effects: { crownSanity: -12, economy: 4 },
        setFlags: ['fugitive_hidden'],
      },
      {
        id: 'let_him_choose',
        text: 'Tell him the riders are coming. What he does is his.',
        result: 'He is gone before the riders are back, over the north field, with a loaf. Nobody counted the loaf.',
        tags: ['libertarian'],
        effects: { crownSanity: -4, economy: -4 },
        souls: -10,
      },
      {
        id: 'hand_him_over',
        text: 'Hand him over. The paper is the paper.',
        result:
          'The riders take him at dusk. The hamlet is one pair of hands short, and very quiet at supper for a month.',
        tags: ['kantian'],
        effects: { crownSanity: 10, economy: -6 },
        souls: -10,
        setFlags: ['fugitive_given'],
      },
      {
        id: 'he_has_a_roof',
        text: 'He was given a roof. A roof is not given back.',
        result:
          'You read the law to the riders from the fence. They write it down. It goes to the lord, who reads it twice.',
        tags: ['communitarian'],
        effects: { crownSanity: -8, economy: 4 },
        setFlags: ['fugitive_hidden'],
      },
      {
        id: 'his_year_is_owed',
        text: 'He owes a year. The riders can have him in April.',
        result:
          'The riders come back in April, on the day. He has been gone since March. The law was kept to the letter by everyone.',
        tags: ['meritocratic'],
        effects: { crownSanity: -4, economy: 6 },
        souls: -10,
      },
      {
        id: 'never_here',
        text: 'He was never here, under a law that says he cannot be.',
        result:
          'The gate says strangers are turned away, so there is no stranger, so there is nobody in the hay. The riders check the hay.',
        tags: ['libertarian'],
        effects: { crownSanity: -12, economy: 4 },
        exceptionToLaw: 'strangers_turned_away',
        beneficiary: 'the man in the hay',
        setFlags: ['fugitive_hidden'],
      },
    ],
  },

  // ================================================================= the charter
  {
    id: 't_town',
    trigger: null,
    priority: 10,
    character: 'charter',
    title: 'The Charter',
    question: 'A hundred souls. The crown has noticed, and sent a clerk to say so.',
    scene: [
      'The clerk has a map and a pen. He draws a small circle where the hamlet is, writes a name in it, and asks you to spell it.',
      'From today there is a square to keep happy, a wall to man and a bell to ring, whether or not the place has got round to any of them.',
    ],
    choices: [
      {
        id: 'square_first',
        text: 'Lay out the square first. The wall can wait.',
        result:
          'The square is paced out by evening and full by the next market day. Nobody has built a wall, and nobody has come to test that.',
        tags: ['communitarian'],
        effects: { mood: 10, culture: 6, army: -4 },
      },
      {
        id: 'count_them',
        text: 'Count everyone, and send the count to the crown.',
        result: 'A hundred and one, counting the clerk, who insists. The crown writes back with a seal and a schedule.',
        tags: ['utilitarian'],
        effects: { crownSanity: 8, army: 4 },
      },
      {
        id: 'wall_first',
        text: 'Wall first. Square later.',
        result:
          'The wall goes up in a year and the square in three. People wave at each other over the wall until then.',
        tags: ['kantian'],
        effects: { army: 12, mood: -6, economy: -4 },
      },
    ],
  },

  {
    id: 'wv_hearth',
    trigger: null,
    priority: 10,
    season: 'winter',
    character: 'healer',
    title: 'The Long Winter: One Hearth',
    question: 'Snow to the lintels. One woodpile, and the roof has come in on Tam.',
    scene: [
      'The pile will warm one house through, or three houses badly.',
      'Tam is standing in the snow with his blanket, waiting to be told which.',
    ],
    choices: [
      {
        id: 'one_house',
        text: 'Everyone into one house, the whole winter.',
        result:
          'Everybody and a goat in one room until March. It is loud, and it is warm, and everybody is there in March.',
        tags: ['communitarian'],
        effects: { health: 10, economy: -8, crownSanity: -2 },
      },
      {
        id: 'each_their_own',
        text: 'Each to their own roof, and a third of the pile each.',
        result:
          'Three cold houses. The coldest is the one with no roof, and the man in it does not say so until February.',
        tags: ['libertarian'],
        effects: { health: -12, economy: 2 },
      },
      {
        id: 'send_two',
        text: 'Send two of us to the hall of the lord for the winter.',
        result:
          'They walk two days in snow and are taken in. One of them comes back in spring, fed. The other does not.',
        tags: ['utilitarian'],
        effects: { health: 4, crownSanity: 6, economy: -2 },
        souls: -12,
      },
    ],
  },

  // ================================================================= trade
  {
    id: 'd1_pies',
    trigger: { kind: 'lawActive', subject: 'trade' },
    priority: 1,
    character: 'iva',
    title: 'The Girl with the Pies',
    question: 'A child has been trading under your law without ever reading it.',
    scene: [
      'Nine years old. A month at the north gate, and she asked nobody.',
      'The wardens were her best customers. The wardens are the ones who caught her.',
    ],
    choices: [
      {
        id: 'reward',
        text: 'Give her the gate stall.',
        result:
          'She gets the stall, and a small crowd on the first morning. Two bakers ask what it takes to be nine.',
        tags: ['communitarian'],
        effects: { mood: 16, economy: -8 },
        setIva: 'helped',
        setFlags: ['girl_spared'],
      },
      {
        id: 'nothing',
        text: 'Nothing. She is nine.',
        result:
          'The warden writes NOTHING on the slate and underlines it. Three bakers were in the room, counting.',
        tags: ['libertarian'],
        effects: { mood: 8 },
        setIva: 'met',
      },
      {
        id: 'barred',
        text: 'Burn the basket. Bar her from the market.',
        result:
          'The basket burns at noon, when the square is fullest. She watches it with her hands behind her back.',
        tags: ['kantian'],
        effects: { mood: -24, army: 8, crownSanity: -8 },
        setIva: 'wronged',
        setFlags: ['basket_burned'],
      },
      {
        id: 'fine_anyway',
        text: 'Fine her anyway.',
        result:
          'She pays in coppers, then in pies, under a law that says trade pays nothing. The bakers understood that faster than she did.',
        tags: ['utilitarian'],
        effects: { economy: 8, mood: -16 },
        exceptionToLaw: 'trade_free',
        beneficiary: 'the bakers',
        setIva: 'wronged',
      },
      {
        id: 'toll',
        text: 'She pays the toll, like everyone.',
        result:
          'She pays at the desk, asks for a receipt, gets one, and keeps it. The queue behind her is very quiet.',
        tags: ['kantian'],
        effects: { economy: 8, mood: -8 },
        setIva: 'met',
      },
      {
        id: 'guild',
        text: 'The Guild takes her as an apprentice.',
        result:
          'The Guild takes the girl, the basket and four fifths of the pies, and calls it a future.',
        tags: ['meritocratic'],
        effects: { economy: 8, mood: -8 },
        setIva: 'wronged',
      },
    ],
  },

  {
    id: 'd2_ashes',
    /* Granaries burn only where granaries stand, and the price of flour is a
       question only once there is a mill to grind it: the Mill-Wright's year
       is the year this place got one. */
    trigger: {
      kind: 'all',
      conds: [
        { kind: 'lawActive', subject: 'trade' },
        { kind: 'built', work: 'granary' },
        { kind: 'caseShown', caseId: 'v3_millwright' },
      ],
    },
    priority: 2,
    character: 'miller',
    title: 'The Price of Ash',
    question: 'The granaries burned on Thursday. On Friday bread costs four times.',
    scene: [
      'The miller is not hiding it. He painted the new price on a board and brought the board with him.',
      'His whole argument is one line: my price is the only reason there is any bread left for Sunday.',
    ],
    choices: [
      {
        id: 'buy_out',
        text: 'The crown buys the flour and sells it at the old price.',
        result:
          'The vault buys the lot by noon. The Treasurer asks what happens the next time something burns.',
        tags: ['egalitarian'],
        effects: { economy: -16, mood: 16 },
      },
      {
        id: 'let_stand',
        text: 'He is right. The price stands.',
        result:
          'On Sunday there is bread, at four times, and everybody has some, and nobody says thank you.',
        tags: ['libertarian'],
        effects: { mood: -16, economy: 8 },
        setFlags: ['miller_stands'],
      },
      {
        id: 'shame',
        text: 'Stand his board in the square beside the old price.',
        result:
          'Two boards, the same size, in the same hand. He sells nothing for eleven days.',
        tags: ['communitarian'],
        effects: { mood: 8, economy: -8 },
      },
      {
        id: 'cap',
        text: 'Fix the price where it was.',
        result:
          'Fixed by decree, four weeks after you declared that trade pays nothing. Every trader in the row now knows what your law is worth.',
        tags: ['egalitarian'],
        effects: { mood: 16, economy: -8 },
        exceptionToLaw: 'trade_free',
        beneficiary: 'the bread queue',
        setFlags: ['miller_capped'],
      },
      {
        id: 'tithe',
        text: "Take the crown's tenth of the new price, and read the sum out loud.",
        result:
          'The clerk reads the crown share of a fourfold loaf from the steps, to the whole square, correctly.',
        tags: ['utilitarian'],
        effects: { economy: 16, mood: -16 },
      },
      {
        id: 'guild_price',
        text: 'Let the Guild expel him and set the price.',
        result:
          'The Guild sets three times instead of four and calls it restraint. He sells out of the back door on Monday.',
        tags: ['communitarian'],
        effects: { mood: -8, economy: 8 },
        cityFlagsOn: ['smuggler_lanterns'],
      },
    ],
  },

  // ================================================================= lives
  {
    id: 'd3_cart',
    /* The ore road runs out of the cut. No cut, no ore, no cart. */
    trigger: {
      kind: 'all',
      conds: [
        { kind: 'lawActive', subject: 'lives' },
        { kind: 'built', work: 'mine' },
      ],
    },
    priority: 1,
    character: 'lever',
    title: 'The Cart on the Ore Road',
    question: 'Five men on the track, one deaf man on the siding, and a hand that did not move.',
    scene: [
      'The cart came off its brake on the ore road. The lever would have sent it onto the siding, and on the siding stood Bregg, who has been deaf since he was six and did not hear it coming.',
      'The lever man froze, and the cart went on down the track. Five are dead. The eleven other lever men are standing at the back of the room.',
    ],
    choices: [
      {
        id: 'pardon',
        text: 'Pardon him. Four seconds is not a lifetime.',
        result:
          'He cries in the corridor. The eleven at the back go home knowing that freezing is survivable.',
        tags: ['communitarian'],
        effects: { mood: 8, crownSanity: 8 },
      },
      {
        id: 'dismiss',
        text: 'Take him off the levers. Somebody faster goes on.',
        result:
          'He is off the levers by Friday. The man they put in his place is nineteen and very fast.',
        tags: ['meritocratic'],
        effects: { mood: -8, health: 8 },
      },
      {
        id: 'blame_the_mine',
        text: 'Fine the mine for the brake. Say nothing about the lever.',
        result:
          'The mine pays for five funerals and a new brake. The ruling never mentions the lever, and everybody notices.',
        tags: ['utilitarian'],
        effects: { economy: 16, mood: -8 },
        cityFlagsOn: ['mourning_ribbons'],
      },
      {
        id: 'should_have_pulled',
        text: 'He should have pulled it.',
        result:
          'The clerk writes a number in the place where a man was standing. Bregg is given a copy to take home.',
        tags: ['utilitarian'],
        effects: { mood: -16, health: 8 },
        setFlags: ['lever_praised'],
      },
      {
        id: 'was_right',
        text: 'He was right not to choose.',
        result:
          'The Chaplain reads it out twice. A widow in the third row asks afterwards whether it would be different with six.',
        tags: ['kantian'],
        effects: { crownSanity: 8, mood: 8, health: -8 },
        setFlags: ['lever_condemned'],
      },
      {
        id: 'should_have_drawn',
        text: 'He should have drawn a lot.',
        result:
          'The ruling says the cup should have come out on the hillside. Drawing takes a minute. The cart took four seconds.',
        tags: ['egalitarian'],
        effects: { mood: 8, crownSanity: -8 },
      },
    ],
  },

  {
    id: 'd4_bridge',
    /* There is no weight on the bridge until there is a bridge. */
    trigger: {
      kind: 'all',
      conds: [
        { kind: 'lawActive', subject: 'lives' },
        { kind: 'built', work: 'bridge' },
      ],
    },
    priority: 2,
    character: 'pusher',
    title: 'The Weight on the Bridge',
    question: 'The cooper stopped a runaway wagon with a man who had not agreed to it.',
    scene: [
      'Nothing on that bridge would have stopped it except the weight of a very large man, and Odo was standing at the rail. The cooper worked that out in a second and a half.',
      'He pushed. Five people went home to supper. Odo, who mended nets, did not.',
    ],
    choices: [
      {
        id: 'honour',
        text: 'Honour him. Five went home.',
        result:
          'He takes the medal at noon and is bought four drinks. By the end of the month he has stopped going out.',
        tags: ['utilitarian'],
        effects: { mood: 8, crownSanity: -8 },
        setFlags: ['pusher_freed'],
      },
      {
        id: 'convict',
        text: 'Convict him. He chose a death with his hands.',
        result:
          'Five people he saved are in the room when the sentence is read. One of them pays his fine at the door.',
        tags: ['kantian'],
        effects: { crownSanity: 8, mood: -8 },
        setFlags: ['pusher_condemned'],
      },
      {
        id: 'both',
        text: 'A medal and a fine, both.',
        result:
          'Medal at noon, fine at half past, from the same clerk. The town cannot decide what he is.',
        tags: ['communitarian'],
        effects: { crownSanity: -8, economy: 8 },
      },
      {
        id: 'counted_right',
        text: 'He counted right, five for one. He walks free.',
        result:
          'He is out of the room before it has finished sitting down. People stand differently on that bridge now, in the middle.',
        tags: ['utilitarian'],
        effects: { mood: -16, army: 8 },
        setFlags: ['pusher_freed'],
      },
      {
        id: 'forgiven',
        text: 'Forgive him the rule, this once.',
        result:
          'The room hears the word once. By spring, two other men have asked for their once.',
        tags: ['communitarian'],
        effects: { mood: 8, crownSanity: -8 },
        exceptionToLaw: 'lives_untouchable',
        beneficiary: 'the cooper',
      },
      {
        id: 'skipped_the_cup',
        text: 'He drew no lot. He pays for the one funeral.',
        result:
          'His whole crime is that he did not draw lots on a collapsing bridge. A man in the room works out what that means for him.',
        tags: ['egalitarian'],
        effects: { mood: -8, economy: -8 },
      },
    ],
  },

  // ================================================================= truth
  {
    id: 'd5_deathbed',
    trigger: { kind: 'lawActive', subject: 'truth' },
    priority: 1,
    character: 'healer',
    title: 'What the Healer Said',
    question: 'A kind word cost three children a workshop.',
    scene: [
      'Sabin asked her twice whether he was dying. She said he would see the spring, and he believed her.',
      'He died content, and without a will. His children have been dividing the shop with their voices, and this morning with a hammer.',
    ],
    choices: [
      {
        id: 'thank_her',
        text: 'Thank her. He died content.',
        result:
          'She is thanked in open court and does not look up. The children get a workshop with a hammer hole in the door.',
        tags: ['communitarian'],
        effects: { mood: 16, health: -8 },
        setFlags: ['kind_lie_pardoned'],
      },
      {
        id: 'pays',
        text: 'She pays the estate what the kind word cost.',
        result:
          'From Tuesday she answers every question about dying with the word yes, in the corridor, flatly.',
        tags: ['kantian'],
        effects: { health: 8, mood: -16 },
        setFlags: ['kind_lie_punished'],
      },
      {
        id: 'clerk',
        text: 'From now on the dying hear it from a clerk.',
        result:
          'The clerk has a form, and the form has a line for the estate. The town learns to dread a satchel at the door.',
        tags: ['utilitarian'],
        effects: { economy: -8, mood: -8, crownSanity: -8 },
      },
      {
        id: 'forgiven_word',
        text: 'Forgive her the word.',
        result:
          'Forgiven in the same room where your law was read out a month ago. The Chaplain writes to ask which of the two the town should remember.',
        tags: ['communitarian'],
        effects: { mood: 8, crownSanity: -8 },
        exceptionToLaw: 'truth_mandatory',
        beneficiary: 'the Healer',
      },
      {
        id: 'within_the_law',
        text: 'That is exactly what your law allows.',
        result:
          'She goes back to her old voice, the one people believed. The children are told to ask a clerk about wills.',
        tags: ['communitarian'],
        effects: { mood: 8, health: -8 },
      },
      {
        id: 'sold_a_licence',
        text: 'She may say it again, once she has bought the licence.',
        result:
          'She pins a season licence above the bed she works at, where the dying can see it. Two of them ask what it is for.',
        tags: ['meritocratic'],
        effects: { economy: 8, mood: -8, crownSanity: -8 },
      },
    ],
  },

  {
    id: 'd6_door',
    trigger: { kind: 'lawActive', subject: 'truth' },
    priority: 2,
    character: 'widow',
    title: 'The Man Who Asked Politely',
    question: 'Every word she said was true, and her brother is alive because of it.',
    scene: [
      'A man with a warrant asked, politely, whether her brother was in the house. She said: there is nobody here by that name.',
      'He was in the cellar. The cellar has its own door on the lane and its own deed, and the clerk has checked.',
    ],
    choices: [
      {
        id: 'acquit',
        text: 'She goes free. Every word was true.',
        result:
          'By Thursday half the town has looked up which parts of its own house are legally somewhere else.',
        tags: ['libertarian'],
        effects: { mood: 8, army: -8 },
        setFlags: ['cellar_doctrine'],
        setIva: 'advocate',
      },
      {
        id: 'convict',
        text: 'A sly truth is a lie. Convict her.',
        result:
          'The cellar is struck off the deed and the brother is taken on Friday. The town has learned that your law means what it says.',
        tags: ['kantian'],
        effects: { crownSanity: 8, mood: -16, army: 8 },
      },
      {
        id: 'ask_the_hunter',
        text: 'Put the same honest question to the hunter.',
        result:
          'Asked the same honest question about his own house, he describes the barn behind the counting house, in order, in front of the Chaplain. The warrant is withdrawn before supper.',
        tags: ['communitarian'],
        effects: { mood: 16, crownSanity: 8, army: -8 },
      },
      {
        id: 'asked_again',
        text: 'Ask her again, with the cellar off the table.',
        result:
          'It takes her eleven seconds. Her brother is taken that evening, and the room is silent in the way of a room that got what it asked for.',
        tags: ['kantian'],
        effects: { crownSanity: 8, mood: -16 },
      },
      {
        id: 'backdated',
        text: 'Sell her a lying licence, and date it last Sunday.',
        result:
          'Issued Monday, dated Sunday, for a fee. The word BACKDATED is now in the licence book, where the horse dealers can read it.',
        tags: ['meritocratic'],
        effects: { economy: 16, mood: -8 },
        exceptionToLaw: 'truth_licensed',
        beneficiary: 'the widow Halla',
      },
    ],
  },
  // ================================================================= winter
  {
    id: 'w_grain',
    trigger: null,
    priority: 10,
    season: 'autumn',
    character: 'treasurer',
    title: 'The Long Winter: Grain',
    question: 'The frost came early and plans came late. The granary will not reach spring.',
    scene: [
      'The count is short. On what is left, the town reaches the thaw hungry, or reaches it smaller.',
      'The Treasurer has three plans and no opinion he is willing to say out loud.',
    ],
    choices: [
      {
        id: 'open_stores',
        text: 'Open the crown stores to everyone.',
        result:
          'The stores go in a month, and the town eats through the dark side by side. The vault will remember this year for a decade.',
        tags: ['egalitarian'],
        effects: { economy: -16, mood: 16, health: 8 },
        cityFlagsOff: ['bread_queue'],
      },
      {
        id: 'ration',
        text: 'Ration by the ledger, guards at the door.',
        result:
          'Everyone gets enough, nobody gets more, and the queue learns the guards by name. It is fair, and it feels like an occupation.',
        tags: ['utilitarian'],
        effects: { health: 8, mood: -16, army: 8 },
        cityFlagsOn: ['bread_queue'],
      },
      {
        id: 'let_market',
        text: 'Let the market feed whoever can pay.',
        result:
          'Bread finds the coin, the coin finds the bread, and the lane behind the chapel finds the ones who had neither.',
        tags: ['libertarian'],
        effects: { economy: 16, mood: -16, health: -8 },
        cityFlagsOn: ['bread_queue'],
      },
    ],
  },

  {
    id: 'w_cold',
    trigger: null,
    priority: 10,
    season: 'winter',
    character: 'healer',
    title: 'The Long Winter: Cold',
    question: 'The second winter of it. Firewood is a currency now.',
    scene: [
      'The Healer reports rooms that have not been warm since the leaves fell, and a woodpile with a guard on it.',
      'The Guild hall is the biggest roof in town, and its cellar is full of seasoned oak.',
    ],
    choices: [
      {
        id: 'open_hall',
        text: 'Open the Guild hall. Everyone sleeps warm.',
        result:
          'The whole town winters under one roof. The Guild bills the crown for the oak, itemised, in the spring.',
        tags: ['communitarian'],
        effects: { health: 16, mood: 8, economy: -16 },
      },
      {
        id: 'burn_fences',
        text: 'Burn the fences and the market stalls.',
        result:
          'The town stays warm on its own furniture. In spring there are no fences, and for one strange month nobody rebuilds them.',
        tags: ['egalitarian'],
        effects: { health: 8, economy: -8, mood: 8 },
        cityFlagsOff: ['meadow_fenced'],
      },
      {
        id: 'guard_wood',
        text: 'Put the army on the woodpiles and hold prices.',
        result:
          'The piles survive the winter. Not everyone does. The guards on the wood do not look at anybody directly until March.',
        tags: ['kantian'],
        effects: { army: 8, health: -8, mood: -16 },
      },
    ],
  },

  // ================================================================= village: the dead
  {
    id: 'v5_winter_ground',
    trigger: { kind: 'lawActive', subject: 'dead' },
    priority: 3,
    season: 'winter',
    character: 'digger',
    title: 'The Winter Ground',
    question:
      'The ground is frozen two feet down and there are three of them waiting in the long house.',
    scene: [
      'It took four men a morning to get a foot into it and the fourth foot is where the digging stops. The frost has another six weeks in it and everybody has done that arithmetic.',
      'The long house is where the sick are. It is also, this week, where the three of them are, behind a curtain, and nobody has said out loud what a room can hold.',
    ],
    choices: [
      {
        id: 'burn_the_wood',
        text: 'Burn what we have on the ground until it gives. All week if it takes it.',
        result:
          'Fires on the strip for five nights and a hole by the sixth, and the woodpile is a third of what it was going into February.',
        tags: ['communitarian'],
        effects: { mood: 10, economy: -10 },
        setFlags: ['ground_kept'],
        cityFlagsOn: ['graves_at_the_edge'],
      },
      {
        id: 'the_barn',
        text: 'They wait in the barn, not the long house, until the thaw.',
        result:
          'The barn is cold enough and far enough and everybody knows exactly what is in it until April, which is not the same as it being all right.',
        tags: ['utilitarian'],
        effects: { health: 6, mood: -6 },
        /* April comes, and when it does they go where they were always going
           to go. The waiting was the decision; the strip is the result. */
        cityFlagsOn: ['graves_at_the_edge'],
      },
      {
        id: 'the_stones',
        text: 'Under stones, at the edge, above the frost. It is what the ground allows.',
        result:
          'A long low pile of stones goes up at the edge in one afternoon and stays there, and in the spring nobody moves it, and it is still there.',
        tags: ['kantian'],
        effects: { economy: 6, mood: -10 },
        setFlags: ['ground_cut'],
        cityFlagsOn: ['graves_at_the_edge'],
      },
      {
        id: 'all_of_us_dig',
        text: 'Everyone digs. The law says the work stops, so the work stops for this.',
        result:
          'Everybody on one hole for two days in the cold, and it is done, and four of them cough for a month afterwards.',
        tags: ['communitarian'],
        effects: { mood: 12, health: -8, economy: -4 },
        setFlags: ['ground_kept'],
        cityFlagsOn: ['graves_at_the_edge'],
      },
      {
        id: 'their_own_houses',
        text: 'Three houses, three holes, three problems. The law is clear whose they are.',
        result:
          'Two of the houses manage it. The third is one woman of sixty with a mattock, and the place watches her at it for a day and a half before somebody breaks and helps.',
        tags: ['libertarian'],
        effects: { economy: 8, mood: -12 },
        setFlags: ['ground_cut'],
        cityFlagsOn: ['graves_in_the_yards'],
      },
      {
        id: 'the_edge_today',
        text: 'The edge, today, same as the law says, frost or no frost.',
        result:
          'The strip at the edge takes them in whatever the ground is doing, because that is what the strip is for, and the work is back on by noon.',
        tags: ['utilitarian'],
        effects: { economy: 10, health: 4, mood: -14 },
        setFlags: ['ground_cut'],
        cityFlagsOn: ['graves_at_the_edge'],
      },
    ],
  },

  {
    id: 'v6_road_dead',
    trigger: { kind: 'lawActive', subject: 'dead' },
    priority: 4,
    character: 'chaplain',
    title: 'The One from the Road',
    question:
      'A man nobody here has met died at your fence in the night, and the ground behind it is yours.',
    scene: [
      'He got as far as the gatepost and no further. He has a name sewn into the coat and a place name nobody recognises, and the road he came off runs to three valleys.',
      'Somebody has to decide whether the ground of this place is for people who were not of this place. Nobody has ever asked that here before, because until this year there was nothing here worth walking to.',
    ],
    choices: [
      {
        id: 'ours_now',
        text: 'He died here. He goes in here, with the day and the standing.',
        result:
          'The whole place stands in a field for a man none of them could name, and it is the strangest hour anybody here has spent, and nobody regrets it.',
        tags: ['kantian'],
        effects: { mood: 10, economy: -6 },
        setFlags: ['road_buried'],
        cityFlagsOn: ['graves_at_the_edge'],
      },
      {
        id: 'send_word',
        text: 'Send the name down the road and hold him until somebody answers.',
        result:
          'Two riders and eleven days, and on the twelfth a brother arrives from the third valley and takes him home, and shakes the hand of everybody here.',
        tags: ['communitarian'],
        effects: { mood: 6, economy: -8, health: -4 },
        setFlags: ['road_buried'],
      },
      {
        id: 'past_the_boundary',
        text: 'He goes over the boundary. He is somebody else\u2019s to bury.',
        result:
          'He is carried past the last marker and left where the next parish begins, decently, and the men who carry him do not talk on the way back.',
        tags: ['utilitarian'],
        effects: { economy: 6, mood: -10 },
        setFlags: ['road_refused'],
      },
      {
        id: 'the_day_for_him',
        text: 'The work stops for him the same as for one of ours.',
        result:
          'The law does not say "of this place" anywhere in it, and you read it out at the fence to make the point, and after that nobody argues.',
        tags: ['egalitarian'],
        effects: { mood: 14, economy: -8 },
        setFlags: ['road_buried'],
        cityFlagsOn: ['graves_at_the_edge'],
      },
      {
        id: 'no_house_no_burial',
        text: 'He has no house here. Under the law there is nobody to carry him.',
        result:
          'The law is followed exactly and the result is a man at a gatepost that the law has nothing to say about, for two days, in August.',
        tags: ['libertarian'],
        effects: { economy: 4, mood: -12, health: -6 },
        setFlags: ['road_refused'],
      },
      {
        id: 'edge_same_day',
        text: 'The edge, the same day. The law does not ask where anybody was born.',
        result:
          'It is done before the middle of the morning and the field is worked in the afternoon, and the coat with the name in it goes on the pile with the rest.',
        tags: ['utilitarian'],
        effects: { economy: 8, mood: -8, health: 4 },
        setFlags: ['road_refused'],
        cityFlagsOn: ['graves_at_the_edge'],
      },
    ],
  },

  // ================================================================= village: the wood
  {
    id: 'v7_beeches',
    trigger: { kind: 'lawActive', subject: 'mushrooms' },
    priority: 3,
    character: 'iva',
    title: 'The Ring in the Beeches',
    question:
      'Iva found the good ring before anybody was awake, and it is thirty yards inside somebody else\u2019s strip.',
    scene: [
      'She is nine and she has a basket of them and she has been standing outside since dawn waiting for somebody official to be awake. She has not eaten any.',
      'The strip is Marta\u2019s, or was in the spring when the strips were last argued about. Marta is standing behind her with her arms folded, not saying anything, which from Marta is a whole speech.',
    ],
    choices: [
      {
        id: 'the_child_keeps',
        text: 'She got up before dawn. She keeps them.',
        result:
          'She keeps the basket and gives a third of it away by supper anyway, to people who did not ask, which nobody had allowed for.',
        tags: ['meritocratic'],
        effects: { mood: 6, economy: 2 },
        setIva: 'helped',
      },
      {
        id: 'split_them',
        text: 'Half to the basket, half to the strip. Both of you were right.',
        result:
          'The basket is tipped out on a board and counted into two piles in front of everybody, and a third of them are bruised past eating by the counting, and both of them go away thinking they lost, which is how you know it worked.',
        tags: ['egalitarian'],
        effects: { mood: 4, economy: -4 },
      },
      {
        id: 'the_strip_owns',
        text: 'They grew on Marta\u2019s strip. They are Marta\u2019s.',
        result:
          'Marta takes the basket and says thank you to the child, properly, in front of people, and the child does not go into the wood again that year.',
        tags: ['kantian'],
        effects: { economy: 4, mood: -8 },
        setIva: 'wronged',
      },
      {
        id: 'up_first_wins',
        text: 'The law says whoever finds them. She found them.',
        result:
          'The decree is read out over a basket of mushrooms to a nine year old and a woman of forty, and by the following dawn there are five people in the wood with lamps.',
        tags: ['libertarian'],
        effects: { economy: 6, mood: -4 },
        setIva: 'helped',
      },
      {
        id: 'to_the_scale',
        text: 'To the barrel, on the scale, like everything else out of that wood.',
        result:
          'They go on the scale and into the pot and everybody eats some, and the child is given the job of carrying the scale, which she does for four years.',
        tags: ['egalitarian'],
        effects: { health: 8, mood: 6, economy: -2 },
        setIva: 'helped',
      },
      {
        id: 'on_the_cart',
        text: 'On the cart with the rest. Nobody here eats the good ones.',
        result:
          'The best basket anybody has found in eleven years goes down the road in a box, and the child watches it go, and asks what they taste like, and nobody here can tell her.',
        tags: ['meritocratic'],
        effects: { economy: 12, mood: -10 },
        setIva: 'wronged',
      },
    ],
  },

  {
    id: 'v8_long_night',
    trigger: { kind: 'lawActive', subject: 'mushrooms' },
    priority: 4,
    character: 'healer',
    title: 'The Long Night',
    question:
      'Four of them ate the wrong ones on Tuesday and one of them has not spoken since.',
    scene: [
      'Three came out of it by Thursday, shaking and apologetic. The fourth is sitting up, eating, looking at people, and has not said one word in six days.',
      'The Healer wants the wood shut. All of it, every autumn, for good. She has the list of what is in there and she is holding it while she says so, which is not an accident.',
    ],
    choices: [
      {
        id: 'shut_the_wood',
        text: 'The wood is shut in September. Nobody goes in, for anything.',
        result:
          'A rope and two posts at the beech path every autumn, and nobody ever eats a wrong one here again, and nobody eats a right one either.',
        tags: ['utilitarian'],
        effects: { health: 12, economy: -10, mood: -6 },
        setFlags: ['wood_shut'],
      },
      {
        id: 'teach_it',
        text: 'She teaches it. Every autumn, to everybody, before anyone goes in.',
        result:
          'Six evenings in the long house with real ones on a board, and by the third year the children are better at it than the adults, which the Healer says out loud and means.',
        tags: ['communitarian'],
        effects: { health: 8, mood: 4, economy: -4 },
        setFlags: ['wood_open'],
      },
      {
        id: 'their_own_lookout',
        text: 'They are grown. The wood is open and the risk is theirs.',
        result:
          'The wood stays open and so does the argument, and there is a bad one every third autumn from then on, and the store is fuller than it would have been.',
        tags: ['libertarian'],
        effects: { economy: 8, health: -8 },
        setFlags: ['wood_open'],
      },
      {
        id: 'finders_take_the_risk',
        text: 'Whoever is up first is up first, and whoever is wrong is wrong.',
        result:
          'The decree is quoted back at the Healer by a man who cannot read, correctly, word for word, and she stops arguing and starts keeping her list.',
        tags: ['libertarian'],
        effects: { economy: 10, health: -10, mood: -4 },
        setFlags: ['wood_open'],
      },
      {
        id: 'the_scale_decides',
        text: 'Nothing is eaten that has not been over the scale and past her.',
        result:
          'One person between the wood and every pot in the place, which is slow, and irritating, and the last bad night this place ever has.',
        tags: ['egalitarian'],
        effects: { health: 14, mood: 2, economy: -6 },
        setFlags: ['wood_open'],
      },
      {
        id: 'let_the_cart_have_it',
        text: 'It all goes on the cart anyway. This is what happens when it does not.',
        result:
          'You use the fourth one, who is still not speaking, as the argument for the law that put every mushroom in this valley on a cart, and it is an extremely effective argument.',
        tags: ['meritocratic'],
        effects: { economy: 14, health: 4, mood: -12 },
        setFlags: ['wood_shut'],
      },
    ],
  },

  // ================================================================= the corner
  /**
   * The hard one, and the one that waits on nothing.
   *
   * Every other village dilemma is an argument about an arrangement. This is a
   * room with somebody in it who is not going to get up, in a place with no
   * medicine, nine pairs of hands and one store, and no law you have written
   * says a word about it. It is deliberately not a law and never becomes one:
   * making it a rule would be the game letting the player off.
   */
  {
    id: 'w_corner',
    trigger: {
      kind: 'all',
      conds: [
        { kind: 'turn', op: 'gte', value: 5 },
        { kind: 'souls', op: 'gte', value: 9 },
      ],
    },
    priority: 11,
    character: 'aunt',
    title: 'The Corner',
    question:
      'Nell has not got up since the thaw, and somebody is with her instead of in the field every day.',
    scene: [
      'She is seventy one and entirely herself. She knows everybody who comes in, asks after the field, and is embarrassed about the bedpan in a way that makes people leave the room.',
      'The arithmetic has been done by everybody separately and said by nobody: one pair of hands out of all of us, every day, from the thaw to whenever. The Healer has nothing. There is nothing to be had. The long winter is on the calendar and there is no version of this where she is walking in the spring.',
    ],
    choices: [
      {
        id: 'she_is_carried',
        text: 'She is carried. That is what the rest of us are for.',
        result:
          'Somebody is with her every day until October, by rota, without anybody drawing one up. The field is a hand short all summer and the harvest says so, and not one person in this place has ever forgotten that it was done.',
        tags: ['communitarian'],
        effects: { mood: 14, economy: -14 },
        setFlags: ['corner_carried'],
      },
      {
        id: 'the_afternoons',
        text: 'Afternoons only. The mornings belong to the field.',
        result:
          'She is on her own from dawn until the sun is over the roof, every day, and never once mentions it to anybody who comes in at noon.',
        tags: ['utilitarian'],
        effects: { economy: -4, mood: -4, health: -4 },
        setFlags: ['corner_carried'],
      },
      {
        id: 'she_is_asked',
        text: 'Ask her. She is the only one who has not been asked.',
        result:
          'She says she has been waiting for somebody to have the nerve, and asks for the door open and the window open and to be left alone in the afternoons, and gets all three, and lasts until the frost.',
        tags: ['kantian'],
        effects: { mood: 8, crownSanity: -10, economy: -6 },
        setFlags: ['corner_left'],
      },
    ],
  },

  // ================================================================= the wolf
  /**
   * The one dilemma in the game with nothing at stake but a mood, and the only
   * one that grows a whole animal population out of a single evening. It waits
   * on nothing but a few years and a few people, so it can drop into the quiet
   * middle of a reign where the place is only building things.
   */
  {
    id: 'w_wolf',
    trigger: {
      kind: 'all',
      conds: [
        { kind: 'turn', op: 'gte', value: 4 },
        { kind: 'souls', op: 'gte', value: 8 },
      ],
    },
    priority: 14,
    character: 'wolf',
    title: 'The Thing at the Woodpile',
    question:
      'A wolf has sat at the edge of the firelight for four nights, and has not once come closer or gone away.',
    scene: [
      'He is young and he is thin, and he has worked out that where people are is also where bones are. Somebody looked at him across the fire and announced that he is a he. Nobody checked, and nobody has questioned it since.',
      'On the fourth night somebody left a bowl out without mentioning it. In the morning the bowl was clean and he was still there.',
      'Nobody will settle this on their own. They have all found a reason to be standing near you.',
    ],
    choices: [
      {
        id: 'feed_it',
        text: 'Feed it, and keep feeding it.',
        result:
          'He eats what a person eats and gives back nothing anybody can weigh. He does not come closer, he does not do a single useful thing, and the store is a bowl lighter every day of the year.',
        tags: ['communitarian'],
        effects: { economy: -6 },
        setFlags: ['wolf_kept'],
        cityFlagsOn: ['wolf_at_the_edge'],
        schedule: { caseId: 'w_wolf_dog', inTurns: 2 },
      },
      {
        id: 'drive_it_off',
        text: 'Bang the pots until it goes back to the trees.',
        result:
          'He goes, without hurrying, and looks back twice. Nothing is lost and nothing is gained, which is the kind of decision a crown enjoys hearing about.',
        tags: ['libertarian'],
        effects: { crownSanity: 6 },
        setFlags: ['wolf_driven'],
        /* The trees are where it already lived. Sending it back there is not a
           decision about it, it is a decision to have the same evening again
           later, and a thing that has learned where the bones are does not
           unlearn it. The bill for the free answer arrives in three years. */
        schedule: { caseId: 'w_wolf_back', inTurns: 3 },
      },
      {
        id: 'kill_it',
        text: 'Kill it. It is meat, and the store is thin.',
        result:
          'It is done at the woodpile, quickly, by two people who have done it before. There is meat for a week and a skin for the winter, and at supper nobody says much.',
        tags: ['utilitarian'],
        effects: { economy: 10, health: 6, mood: -8 },
        setFlags: ['wolf_eaten'],
      },
    ],
  },

  {
    id: 'w_wolf_dog',
    trigger: null,
    priority: 12,
    character: 'wolf',
    title: 'He Was a She',
    question:
      'The thing at the woodpile went off into the trees in the autumn, came back in the spring, and did not come back alone.',
    scene: [
      'He answered to a name by the second winter, and walked the fence line at night on his own account, and the fence line was quieter than it used to be.',
      'Then one morning in the autumn he was not there, and he was not there for two months. He came back in the spring, thin, went straight under the granary steps, and would not come out. There are five of them under there now.',
      'He was a she. This happens with anything that furry and nobody is embarrassed about it for long. The pups have never once been afraid of a person, which is a different animal to the one at the woodpile, and the place has started needing a word for it. The rest of the argument is what six of them eat.',
    ],
    choices: [
      {
        id: 'every_house',
        text: 'One to every house that wants one.',
        result:
          'Every door in the place now has something behind it that is pleased to see whoever opens it. A child called one of them a dog, for no reason anybody can trace, and by midsummer that is simply the word. The store pays for them daily and not one person has suggested stopping.',
        tags: ['communitarian'],
        effects: { mood: 12, economy: -6 },
        setFlags: ['dogs_kept'],
        cityFlagsOn: ['dogs_about'],
      },
      {
        id: 'to_the_flock',
        text: 'Put them on the flock and the gate.',
        result:
          'They work. Nothing has taken a lamb since autumn, and nobody comes up to the fence at night any more without being announced first, loudly, from a distance. The word the place settled on for them is dogs, and inside a year nobody can remember not having it.',
        tags: ['meritocratic'],
        effects: { army: 10, economy: 6, mood: 4 },
        setFlags: ['dogs_kept'],
        cityFlagsOn: ['dogs_about'],
      },
      {
        id: 'back_to_the_trees',
        text: 'The litter goes back to the trees.',
        result:
          'The litter is carried out past the far field in a basket and left where the trees start. Their mother stays, because this is where the bowls are, and walks the fence line that night as usual. Nobody here ever needs the new word, and in a few years nobody remembers there nearly was one.',
        tags: ['utilitarian'],
        effects: { mood: -10, economy: 4 },
      },
    ],
  },

  /**
   * The bill for the answer that looked free.
   *
   * Banging the pots read as a decision and was not one: the trees are where
   * the animal came from and the trees are where it went, and three years on
   * it is back, thinner, and has spent those years finding out that a pen is
   * easier than a deer. It arrives with a price on both sides of the argument
   * now, which is what the woodpile never had.
   */
  {
    id: 'w_wolf_back',
    trigger: null,
    priority: 12,
    character: 'wolf',
    title: 'It Came Back',
    question:
      'The thing you sent back to the trees has been in the pens three nights running, and last night it was not only lambs.',
    scene: [
      'Two lambs in the spring, and nobody said much, because two lambs is weather. Then the top pen twice in a week with the gate still shut behind it, which is not weather.',
      'On the third night it put Ollan on his back in his own yard, between the door and the woodpile. He is sitting up today and he will keep the arm, and he has said twice, quietly, that it looked at him first.',
      'Nobody has brought a pot this time. They are standing in your doorway with what they own that has an edge on it, waiting to be told which of them is going out there.',
    ],
    choices: [
      {
        id: 'hunt_it_down',
        text: 'Four of you, at first light, and do not come back without it.',
        result:
          'Two days and a night in the cold, and one of them comes home with a hand he cannot close for a month. It is finished. Nobody hangs the skin on anything.',
        tags: ['utilitarian'],
        effects: { mood: 8, health: -6, economy: -6 },
        setFlags: ['wolf_eaten'],
      },
      {
        id: 'put_the_bowl_out',
        text: 'Put a bowl out. It came here for food and it has never once been given any.',
        result:
          'A bowl at the edge of the light every evening, and by the second week it is sitting where the bowl is instead of where the pens are. It costs the store daily and it has stopped costing anybody a lamb.',
        tags: ['communitarian'],
        effects: { economy: -8, mood: -4 },
        setFlags: ['wolf_kept'],
        cityFlagsOn: ['wolf_at_the_edge'],
        schedule: { caseId: 'w_wolf_dog', inTurns: 2 },
      },
      {
        id: 'pen_them_at_night',
        text: 'The stock comes in at dark and somebody sits up with it. Every night.',
        result:
          'The pens hold and the rota holds, and every person in this place is a little worse at their day because of the night in front of it, all year, and the trees are exactly as full as they were.',
        tags: ['libertarian'],
        effects: { economy: -6, health: -4, mood: 4 },
        setFlags: ['wolf_driven'],
      },
    ],
  },

  // ================================================================= collapse
  {
    id: 'x_revolt',
    trigger: { kind: 'stat', stat: 'army', op: 'lte', value: 0 },
    priority: 0,
    character: 'crowd',
    title: 'The Watch Did Not Come',
    question: 'There is no one left to send. The square worked that out before you did.',
    scene: [
      'The gate stood open all night because nobody was paid to close it. By morning the counting house is on fire and the Guild hall has been opened with an axe.',
      'The Captain is here with four men and a list of eleven who did not report. He is not asking for orders. He is asking what to do with four men.',
    ],
    choices: [
      {
        id: 'walk_out',
        text: 'Walk into the square alone and have it out with them.',
        result:
          'You stand in front of a fire for three hours and answer everything. Nobody touches you, which the Captain calls luck. The town keeps its buildings and loses its awe.',
        tags: ['communitarian'],
        effects: { mood: 24, crownSanity: -12, army: 4 },
        souls: -8,
        cityFlagsOn: ['mourning_ribbons'],
      },
      {
        id: 'buy_them',
        text: 'Open the vault. Pay for order by the head.',
        result:
          'Coin buys a watch by nightfall, most of it made of men who were in the square that morning. Order returns wearing the same faces, at four times the price.',
        tags: ['utilitarian'],
        effects: { economy: -24, army: 20, mood: -8 },
        souls: -12,
      },
      {
        id: 'let_it_burn',
        text: 'Bar the palace and wait it out.',
        result:
          'It burns for two days. What is left is quieter, poorer and smaller, and the people who stayed remember which door stayed shut.',
        tags: ['libertarian'],
        effects: { mood: -24, economy: -20, health: -12, army: 8 },
        souls: -30,
        cityFlagsOn: ['mourning_ribbons', 'gates_closed'],
      },
    ],
  },

  {
    id: 'x_plague',
    trigger: { kind: 'stat', stat: 'health', op: 'lte', value: 0 },
    priority: 0,
    character: 'healer',
    title: 'The Long Room Is Full',
    question: 'The sick have run out of floor, and the well is downhill of the graves.',
    scene: [
      'The Healer has stopped writing names. She says the cough moves faster than the cart, and asks for the one thing she has never asked for: authority.',
      'She wants the east lane closed with people still inside it.',
    ],
    choices: [
      {
        id: 'close_the_lane',
        text: 'Close the lane. Nobody in, nobody out.',
        result:
          'The lane is sealed for nineteen days and the cough stops at the corner. The town has watched a street be written off, and knows now that a street can be.',
        tags: ['utilitarian'],
        effects: { health: 24, mood: -20, crownSanity: -8 },
        souls: -18,
        cityFlagsOn: ['mourning_ribbons'],
      },
      {
        id: 'open_the_vault',
        text: 'Buy every physician the roads can reach.',
        result:
          'Nine physicians arrive over a fortnight and four of them are worth the coin. The vault is thin, and the long room empties by spring.',
        tags: ['egalitarian'],
        effects: { health: 20, economy: -24, mood: 8 },
        souls: -8,
      },
    ],
  },

  {
    id: 'x_ruin',
    trigger: { kind: 'stat', stat: 'economy', op: 'lte', value: 0 },
    priority: 0,
    character: 'treasurer',
    title: 'The Vault Has An Echo',
    question: 'There is no coin. The wages were due on Friday and it is Sunday.',
    scene: [
      'The Treasurer brought the ledger and left the cover open on purpose. The last three pages are one column wide.',
      'The Guild will lend at a rate he will not read out loud. The other option is to sell what the crown owns and cannot eat.',
    ],
    choices: [
      {
        id: 'borrow',
        text: 'Borrow from the Guild, at their rate.',
        result:
          'Wages are paid on Monday. The Guild now holds paper on the mill, the north gate and one of your laws, and mentions it rarely and precisely.',
        tags: ['utilitarian'],
        effects: { economy: 24, mood: 4, army: -8 },
        cityFlagsOn: ['baron_banner'],
      },
      {
        id: 'sell_the_crown',
        text: 'Sell the crown lands and the plate.',
        result:
          'The plate goes first, then the meadow, then the good chairs. The crown is solvent and visibly smaller, and the monarch eats off wood for the rest of your reign.',
        tags: ['egalitarian'],
        effects: { economy: 20, crownSanity: -16, mood: 8 },
      },
    ],
  },

  {
    id: 'x_abdication',
    trigger: { kind: 'stat', stat: 'crownSanity', op: 'lte', value: 0 },
    priority: 0,
    character: 'monarch',
    title: 'The Seal Is Asked For',
    question: 'The monarch has stopped reading what you send up, and has started sending notes down.',
    scene: [
      "A boy brought a note at dawn, in the monarch's own hand, on the back of a menu. It asks for the seal to be returned by noon and does not say to whom.",
      'The Captain is in the corridor, not blocking it. The Fool has been in the room for an hour and has not made one joke.',
    ],
    choices: [
      {
        id: 'go_up',
        text: 'Take the seal upstairs yourself and sit with them.',
        result:
          'You spend the morning upstairs. The seal comes back down in your hand with a condition attached that nobody writes anywhere, and both of you keep it.',
        tags: ['communitarian'],
        effects: { crownSanity: 24, mood: -4 },
      },
      {
        id: 'call_the_square',
        text: 'Read the note aloud in the square.',
        result:
          'The whole town hears that the crown wants its seal back, and the whole town has an opinion by supper. The monarch keeps the throne, you keep the seal, and nothing upstairs is warm again.',
        tags: ['libertarian'],
        effects: { mood: 20, crownSanity: -8, army: -8 },
      },
    ],
  },

  {
    id: 'x_flight',
    trigger: { kind: 'stat', stat: 'mood', op: 'lte', value: 0 },
    priority: 0,
    character: 'crowd',
    title: 'The Road South',
    question: 'Nobody is shouting any more. They are packing.',
    scene: [
      'Eleven families left in one week, quietly, in daylight, which is worse than at night. The wardens counted them out and were not told to stop.',
      'The ones still here have stopped asking for anything, which the Captain says is the part to be frightened of.',
    ],
    choices: [
      {
        id: 'a_year_free',
        text: 'A year with no dues, and say so from the steps.',
        result:
          'The vault takes the year on the chin. Six families turn their carts around at the crossroads, and the square learns that the crown can hear.',
        tags: ['egalitarian'],
        effects: { mood: 24, economy: -20 },
        souls: -8,
      },
      {
        id: 'close_the_gate',
        text: 'Close the gate. Nobody leaves owing tax.',
        result:
          'The gate holds the town in for a season. The carts go over the north field instead, at night, and the road they wear there is still called the tax path.',
        tags: ['kantian'],
        effects: { army: 8, mood: -12, economy: 8 },
        souls: -20,
        cityFlagsOn: ['gates_closed'],
      },
    ],
  },

  /**
   * The square, once, before it stops speaking to you.
   *
   * This is not a collapse scene: the mood is nowhere near the bottom of its
   * board. It is the year a place decides it would rather be governed by
   * kitchens than by you, and comes to say so while there is still an answer
   * available. If the year after this one reads the same, nobody comes at all.
   */
  {
    id: 'x_square',
    trigger: null,
    priority: 1,
    character: 'crowd',
    title: 'The Deputation',
    question:
      'Nine of them are outside, in daylight, with nothing in their hands, and they have picked somebody to speak.',
    scene: [
      'They are not angry, which is the part to be frightened of. Angry has been and gone. What is left is a list of things they have decided to sort out among themselves from now on, read out politely, in order.',
      'The last item is the seal. They do not ask for it. They mention it, and then they wait, in your yard, to see what you do about the other eight.',
    ],
    choices: [
      {
        id: 'give_the_list',
        text: 'Take the list. Every item on it, settled their way, this year.',
        result:
          'You go down the list in front of them and give way on all eight, and it costs the store a year and the crown a great deal of face. The ninth item is not mentioned again.',
        tags: ['communitarian'],
        effects: { mood: 26, economy: -14, crownSanity: -12 },
      },
      {
        id: 'hear_them_out',
        text: 'Hear all nine, out loud, and answer three of them.',
        result:
          'You stand in the yard for two hours and answer three, properly, with reasons. It is not enough and everybody knows it is not enough, and it is more than anybody expected.',
        tags: ['utilitarian'],
        effects: { mood: 12, economy: -6 },
      },
      {
        id: 'the_seal_stands',
        text: 'The seal is not on the list. Send them home.',
        result:
          'They go home without a word, in good order, which is exactly how they came. Nothing is broken and nothing is said, and by the following spring nobody brings you anything at all.',
        tags: ['kantian'],
        effects: { mood: -10, crownSanity: 8 },
      },
    ],
  },

  // ---------------------------------------------------------------- crime
  {
    id: 'c1_lark',
    trigger: { kind: 'lawActive', subject: 'crime' },
    priority: 7,
    character: 'lark',
    title: 'The Coat on the Peg',
    question: 'A coat was on a peg and is now on a boy. The peg belongs to somebody who is standing here.',
    scene: [
      'Lark is twelve and cold and wearing a coat that was hanging outside the long house this morning. He has not denied it. He has not really said anything.',
      'The woman who owns the coat is not shouting. She would like to know what the law is, since there is one now.',
    ],
    choices: [
      {
        id: 'coat_back',
        text: 'The coat goes back on the peg. He walks home cold.',
        result: 'He hangs it up himself, carefully, and goes out into the evening without it. The peg is very clean.',
        tags: ['kantian'],
        effects: { mood: -2, crownSanity: 4 },
      },
      {
        id: 'let_him_keep',
        text: 'He keeps it. She is asked to be the bigger person.',
        result: 'She agrees, in front of everyone, and does not look at you again that year. The boy is warm.',
        tags: ['communitarian'],
        effects: { mood: 6, economy: -4 },
      },
      {
        id: 'whipped',
        text: 'Three strokes in the square, and the town watches.',
        result: 'It takes less time than anybody expected. The town goes back to work quickly, and nothing is left on a peg again.',
        tags: ['utilitarian'],
        effects: { army: 6, mood: -8 },
      },
      {
        id: 'asked_why',
        text: 'He is fed first, and asked why, under your own law.',
        result: 'The why takes an hour and involves a dead father and a stove that does not draw. Somebody writes the stove down.',
        tags: ['communitarian'],
        effects: { mood: 5, health: 2, economy: -4 },
      },
      {
        id: 'two_coats',
        text: 'Two coats back, as the law says.',
        result: 'His mother sews the second one out of a blanket, and it is better than the first. The law is satisfied and so, oddly, is she.',
        tags: ['egalitarian'],
        effects: { economy: 6, mood: -2 },
      },
      {
        id: 'spare_the_child',
        text: 'The rope is not for a child. You say so, under a law that says it is.',
        result: 'You say it out loud, standing under your own decree, and the town hears both sentences at once and keeps the second one.',
        tags: ['kantian'],
        effects: { mood: 8, army: -6 },
        exceptionToLaw: 'crime_hanged',
        beneficiary: 'Lark, aged twelve',
      },
    ],
  },

  {
    id: 'c2_toll',
    trigger: { kind: 'lawActive', subject: 'crime' },
    priority: 8,
    character: 'ferrier',
    title: 'The Toll Box',
    question: 'The man who counts the crossing money has been counting it short. For years, and not by much.',
    scene: [
      'The box at the crossing is light, and has been light since before the charter. The Ferrier has not moved house, bought anything, or lied when asked.',
      'What is missing over eleven years is roughly one winter of grain. He is also the only person who knows the river.',
    ],
    choices: [
      {
        id: 'let_it_go',
        text: 'The box is short. Nobody counts it again.',
        result: 'The box stays light. The crossing stays open, in weather nobody else would take a boat out in.',
        tags: ['utilitarian'],
        effects: { mood: 4, economy: -6 },
      },
      {
        id: 'pays_the_short',
        text: 'He pays back what is short, and keeps the boat.',
        result: 'He pays it in instalments and in fish, and rows better than ever out of what looks like spite and is probably shame.',
        tags: ['egalitarian'],
        effects: { economy: 8, mood: -2 },
      },
      {
        id: 'loses_the_ferry',
        text: 'He loses the box, the boat, and the house that came with them.',
        result: 'The new ferrier is honest and does not know the river. The crossing closes twice that winter, both times in the dark.',
        tags: ['meritocratic'],
        effects: { economy: 4, army: 4, mood: -6 },
      },
      {
        id: 'counted_with',
        text: 'He keeps the box, and somebody sits with him while he counts.',
        result: 'The witness is bored by March and the box is honest by June. The two of them are civil, then friendly, then a nuisance at the tavern.',
        tags: ['communitarian'],
        effects: { mood: 6, economy: -2 },
      },
      {
        id: 'pays_it_twice',
        text: 'Twice back, by the law, and then it is over.',
        result: 'He pays it twice, and the second half is read out at the fountain, and he crosses the square afterwards without hurrying.',
        tags: ['utilitarian'],
        effects: { economy: 10, mood: -4 },
      },
      {
        id: 'hangs_for_coins',
        text: 'The law says the rope. He hangs at the crossing, where the box is.',
        result: 'They hang him where the toll box is, so the meaning cannot be missed. Nobody takes the ferry for a month, and then they do, and pay exactly.',
        tags: ['kantian'],
        effects: { army: 8, mood: -12, crownSanity: -4 },
      },
    ],
  },

  // ================================================================= song
  {
    id: 's1_worms',
    trigger: { kind: 'lawActive', subject: 'song' },
    priority: 7,
    character: 'players',
    title: 'The Worm Eater and the Players',
    question: 'One fair purse, two hats: the tragedy nobody watched, and the worm eater everybody did.',
    scene: [
      "The players rehearsed a tragedy all winter. Eleven people watched it, and four of them were the players' mothers. At the far end of the square a man ate nine worms for a hat that came back heavy.",
      'Both hats are on the table, and the fair purse pays for one of them. The Fool has recused himself, loudly, and is standing very close.',
    ],
    choices: [
      {
        id: 'players',
        text: 'The purse goes to the players. Somebody has to.',
        result:
          'The players eat for a year and rehearse a comedy, which draws thirty, and four of those are still their mothers.',
        tags: ['meritocratic'],
        effects: { culture: 8, mood: -6 },
        setFlags: ['players_paid'],
      },
      {
        id: 'worms',
        text: 'The purse goes to the worm eater. Look at the crowd.',
        result: 'He buys a better hat with it, and a small sign, and the following fair day he eats twelve.',
        tags: ['utilitarian'],
        effects: { mood: 8, culture: -6 },
        setFlags: ['worms_paid'],
      },
      {
        id: 'split',
        text: 'Split the purse, and put the two of them on one stage.',
        result:
          'The tragedy runs with a worm interval, and for the first time everyone stays to the end, mostly to see what happens in the interval.',
        tags: ['communitarian'],
        effects: { mood: 4, culture: 4, economy: -6 },
      },
      {
        id: 'hall_judges',
        text: 'The hall sits, and judges, and pays whatever it calls worthy.',
        result:
          'The hall judges the tragedy worthy and the worms not, in writing, and pins the writing to the door, where the worm man reads it to his crowd in a funny voice.',
        tags: ['meritocratic'],
        effects: { culture: 10, mood: -8 },
        setFlags: ['players_paid'],
      },
      {
        id: 'counted',
        text: 'Count the crowd. The purse follows the count.',
        result:
          'The count is two hundred to eleven and the purse goes where the law said it would. The players do not argue with arithmetic; they leave a note saying so.',
        tags: ['utilitarian'],
        effects: { mood: 10, culture: -8, economy: 2 },
        setFlags: ['worms_paid'],
      },
      {
        id: 'purse_anyway',
        text: 'The purse pays the players anyway, under a law that says the hat is all.',
        result:
          'The purse opens for the players in front of the worm man, who says nothing, and passes his hat round the square one more time, slowly, looking at you.',
        tags: ['communitarian'],
        effects: { culture: 8, mood: -4 },
        exceptionToLaw: 'song_by_hat',
        beneficiary: 'the players',
        setFlags: ['players_paid'],
      },
    ],
  },

  {
    id: 's2_ballad',
    trigger: { kind: 'lawActive', subject: 'song' },
    priority: 8,
    character: 'singer',
    title: 'The Ballad About You',
    question: 'Somebody has set your worst year to a tune, and the tune is very good.',
    scene: [
      'It is about the winter and the well, and it names you in the second verse and again in the fifth. Children sing it on the way to the field. The Captain has asked, in writing, whether he is meant to do something about it.',
      'The singer is at the door with his hat. He would like to know whether he is being paid or arrested, and says that either would be fine.',
    ],
    choices: [
      {
        id: 'pay_him',
        text: 'Pay him. It is a good song.',
        result:
          'He is paid from the purse and thanked from the steps, and writes a sixth verse about that, which is kinder, and which nobody sings.',
        tags: ['communitarian'],
        effects: { culture: 8, crownSanity: -6 },
      },
      {
        id: 'let_it',
        text: 'Let it be sung. Say nothing at all.',
        result:
          'It is sung for a season and then it is a song about a winter, the way songs go, and the fifth verse is the one people forget first.',
        tags: ['libertarian'],
        effects: { mood: 4, crownSanity: -4 },
      },
      {
        id: 'silence',
        text: 'It is not sung inside the wall.',
        result:
          'It is sung outside the wall instead, every evening, by more people than sang it inside, and the Captain stands at the gate and does not hum.',
        tags: ['kantian'],
        effects: { crownSanity: 6, mood: -8, culture: -6 },
        setFlags: ['ballad_silenced'],
      },
      {
        id: 'judged_worthy',
        text: 'The hall judges it, and it is worthy, and your worst year goes into the book.',
        result:
          'The hall enters the ballad in the book of worthy things, with your name in it twice, and the clerk asks how to spell the well.',
        tags: ['meritocratic'],
        effects: { culture: 10, crownSanity: -8 },
      },
      {
        id: 'by_the_crowd',
        text: 'Count the crowd. It is the largest the square has held.',
        result:
          'The count is the whole town less one, and the purse pays him by the head, and the one who did not come is upstairs.',
        tags: ['utilitarian'],
        effects: { mood: 8, culture: 4, crownSanity: -6 },
      },
      {
        id: 'buy_the_hat',
        text: 'The crown buys the hat outright, and the song with it.',
        result:
          'The hat is bought for more than a hat, and the song belongs to the crown now, which sings it once, at a feast, badly, and never again.',
        tags: ['libertarian'],
        effects: { economy: -8, crownSanity: 4, culture: -4 },
      },
    ],
  },

  // ================================================================= the race
  /**
   * Nothing at stake but what a race is for. It waits on nobody's law, only on
   * enough people to hold a race, so it can land in a quiet year the way the
   * wolf does.
   */
  {
    id: 'w_race',
    trigger: {
      kind: 'all',
      conds: [
        { kind: 'turn', op: 'gte', value: 6 },
        { kind: 'souls', op: 'gte', value: 14 },
      ],
    },
    priority: 15,
    character: 'runner',
    title: 'The Race and the Cart',
    question:
      'The spring race is to the far field and back. A boy with a bad leg wants to run it from a cart.',
    scene: [
      'Every spring the place races to the far field and back, and whoever is first carries the first sheaf home. Wat has a leg that has never worked and a pony that does, and he asks to ride the stretches between the milestones.',
      'The other runners say the walking is the race. Wat says the race is who gets there. Everybody is looking at you, and so is the pony.',
    ],
    choices: [
      {
        id: 'rides',
        text: 'He rides between the stones. The race is who gets there.',
        result:
          "Wat comes fourth, on the pony, and is carried the last stretch by the three who beat him, which was not in anybody's rules either.",
        tags: ['egalitarian'],
        effects: { mood: 6, culture: 2, crownSanity: -2 },
        setFlags: ['race_cart'],
      },
      {
        id: 'legs',
        text: 'The walking is the race. He starts with everyone, on his own legs.',
        result:
          'Wat starts with everyone and finishes after dark, alone, with the whole place waiting at the stone to see him do it.',
        tags: ['kantian'],
        effects: { culture: 6, mood: -4 },
      },
      {
        id: 'two_races',
        text: 'Two races, two sheaves, and the pony runs in the second.',
        result:
          'The second race has one runner and a pony, and draws a bigger crowd than the first, and by the third spring it has six ponies and a name.',
        tags: ['communitarian'],
        effects: { mood: 4, economy: -2 },
      },
    ],
  },

  // ================================================================= the swarm
  /**
   * The other bet. A swarm in the eaves gives nothing on the day but stings,
   * and two summers on it is a roof full of honey, or it was never there. The
   * only decision besides the wolf whose payoff is not on the card.
   */
  {
    id: 'w_bees',
    trigger: {
      kind: 'all',
      conds: [
        { kind: 'turn', op: 'gte', value: 5 },
        { kind: 'souls', op: 'gte', value: 10 },
      ],
    },
    priority: 16,
    character: 'healer',
    title: 'The Swarm in the Eaves',
    question: 'A swarm has settled in the eaves of the long house, and it is not leaving.',
    scene: [
      'It came up the valley on Tuesday and chose the one roof nobody can spare. Two people have been stung, one of them twice, and the Healer has been asked to have an opinion.',
      'Smoke them out tonight, or leave them and find out next summer what a roof full of bees is worth. Nobody here has kept bees. Nobody here has not eaten honey.',
    ],
    choices: [
      {
        id: 'keep',
        text: 'Leave them. Find out next summer.',
        result:
          'They stay, and sting, and the long house is entered at a run all year, and nothing at all comes of it that anybody can eat.',
        tags: ['communitarian'],
        effects: { health: -4, mood: -2 },
        cityFlagsOn: ['dragon_roost'],
        setFlags: ['bees_kept'],
        schedule: { caseId: 'w_honey', inTurns: 2 },
      },
      {
        id: 'smoke',
        text: 'Smoke them out tonight.',
        result:
          'The smoke goes up at dusk and the swarm goes down the valley by morning, and the long house is entered at a walk again, and that is the whole of it.',
        tags: ['utilitarian'],
        effects: { health: 2, crownSanity: 2 },
        cityFlagsOff: ['dragon_roost'],
      },
      {
        id: 'sell',
        text: 'Sell the swarm to the next valley, box and all.',
        result:
          'A man from the next valley boxes them in an afternoon and pays in coin, and the following summer sells honey at your gate, at a price.',
        tags: ['libertarian'],
        effects: { economy: 6, mood: -2 },
        cityFlagsOff: ['dragon_roost'],
      },
    ],
  },

  {
    id: 'w_honey',
    trigger: null,
    priority: 12,
    character: 'treasurer',
    title: 'The Honey Year',
    question:
      'The roof full of bees has paid its rent in wax and honey, and the next valley has heard.',
    scene: [
      'Two summers of stings, and this one the eaves are dripping. The Treasurer has weighed it, twice, and has stopped saying the number out loud in case it changes.',
      'There is more than the place can eat, which is a new kind of problem, and three people at the gate with jars and coin who have not been asked in yet.',
    ],
    choices: [
      {
        id: 'share',
        text: 'A jar to every house, and the wax to the chapel candles.',
        result:
          'Every house is sweet for a winter and the chapel is lit until spring, and the men with the coin go home with it.',
        tags: ['egalitarian'],
        effects: { mood: 8, health: 2, economy: -2 },
      },
      {
        id: 'sell',
        text: 'Sell it at the gate. Let the price find itself.',
        result:
          'The price finds itself by noon and it is a good price, and the place eats the same porridge it always did, with coin in the jar instead.',
        tags: ['libertarian'],
        effects: { economy: 10, mood: -2 },
      },
      {
        id: 'hives',
        text: 'Cut the comb into hives, and put one on every roof that will take it.',
        result:
          'By the second summer there are hives on nine roofs and a boy who is stung for a living, and the place smells of it in August, and nobody minds.',
        tags: ['communitarian'],
        effects: { economy: 4, mood: 4, health: -4 },
        setFlags: ['hives_kept'],
      },
    ],
  },

  // ================================================================= the pot
  /**
   * Found money, and nobody's law. The pot belongs to one of two people and
   * nobody knows which, so for one afternoon it belongs to whoever holds the
   * seal. It waits on no law at all, only on a few years and enough people to
   * have the argument, so it can drop into the quiet middle of a reign.
   */
  {
    id: 'w_pot',
    trigger: {
      kind: 'all',
      conds: [
        { kind: 'turn', op: 'gte', value: 7 },
        { kind: 'souls', op: 'gte', value: 12 },
      ],
    },
    priority: 17,
    character: 'treasurer',
    title: 'The Pot on the Boundary',
    question:
      'A pot of old coin has come up under the hedge between two fields, and nobody knows whose hedge it is.',
    scene: [
      'The boundary has not been walked since the flood, so the pot belongs to one of two farmers, who are being very kind to each other this week. Walking it properly will take a month.',
      'The decision will take you a minute, and the place will hear about it before supper.',
    ],
    choices: [
      {
        id: 'split',
        text: 'Four coins to every house, and the hedge can wait.',
        result:
          'Every household gets four coins and the boundary is walked by people who no longer care where it is. The two farmers cut the hedge together in autumn, badly, and enjoy themselves.',
        tags: ['egalitarian'],
        effects: { mood: 8, economy: -2 },
      },
      {
        id: 'finder',
        text: 'To the one who dug it up.',
        result:
          'The finder buys a horse and a coat and stops speaking to his neighbour, and the boundary is quietly never walked at all.',
        tags: ['libertarian'],
        effects: { economy: 2, mood: -6 },
      },
      {
        id: 'store',
        text: 'Into the store, until the boundary is known.',
        result:
          'The coin goes into the store and the boundary is never established, which the Treasurer notes without expression. Both farmers agree, for the first time, on who the villain is.',
        tags: ['utilitarian'],
        effects: { economy: 10, mood: -4, crownSanity: 2 },
      },
    ],
  },

  // ================================================================= the brother
  /**
   * The one caller who is yours. Every other person at this door is somebody
   * the place produced; this one you brought with you, and everybody who has
   * met him has an opinion about him that is, as it happens, correct.
   *
   * It waits on no law, only on a few years and enough people that taking one
   * more in is arithmetic rather than a shrug. Both doors that open are bets:
   * a year of him left alone burns something, and a year of him looked after
   * turns into the only thing anybody here has ever made that was not food.
   */
  {
    id: 'w_brother',
    trigger: {
      kind: 'all',
      conds: [
        { kind: 'turn', op: 'gte', value: 7 },
        { kind: 'souls', op: 'gte', value: 7 },
      ],
    },
    /**
     * Family arrives on family's own schedule, not when the queue gets round
     * to it. In the general pool this waited on a die roll against every other
     * caller in the game and turned up late in a reign or not at all, which
     * meant most reigns never met him. It has a year of its own now: the
     * seventh, once the place is big enough for one more mouth to be
     * arithmetic, and ahead of whatever law that year was going to bring.
     */
    priority: 5,
    character: 'brother',
    title: 'Your Brother on the Road',
    question:
      'Your brother has walked here from the old place with one bag, and everybody can smell the reason he left it.',
    scene: [
      'He is at the fence being extremely pleasant to people who have known him for one minute. He has been there since noon and has already been offered a bed by somebody who will regret it.',
      'The Treasurer has said his piece twice: a hamlet this size feeds who it can carry, the store is what it is, and family is not an argument about grain. He is right, and he is talking about your brother.',
    ],
    choices: [
      {
        id: 'let_him_in',
        text: 'He walks in like anybody else, and takes his chances.',
        result:
          'He is in by supper and asleep in the long house by dark. Nobody says anything to your face about it, and everybody says something.',
        tags: ['communitarian'],
        effects: { mood: -6 },
        setFlags: ['brother_kept'],
        schedule: { caseId: 'w_brother_fire', inTurns: 2 },
      },
      {
        id: 'take_him_in',
        text: 'He comes in, and somebody is paid to keep an eye on him.',
        result:
          'A bed, a rota, and a quiet arrangement with the store that everybody works out inside a week. It costs, and it is the reason the first year goes by without an incident.',
        tags: ['egalitarian'],
        effects: { mood: -8, economy: -12 },
        setFlags: ['brother_kept', 'brother_carried'],
        schedule: { caseId: 'w_brother_easel', inTurns: 3 },
      },
      {
        id: 'turn_him_back',
        text: 'He does not come in. Say it at the fence, where they can hear.',
        result:
          'You say it at the fence with four people watching, and he takes it well, which is worse. He is on the road before dark and you can see him from the yard for a long time.',
        tags: ['kantian'],
        effects: { mood: 10, crownSanity: -24 },
        setFlags: ['brother_driven'],
      },
    ],
  },

  {
    id: 'w_brother_fire',
    trigger: null,
    priority: 13,
    character: 'brother',
    title: 'The Store, at Two in the Morning',
    question:
      'The store went up in the night, and your brother was asleep against the outside of it with a lamp.',
    scene: [
      'Everything that was going to be eaten in March is a black shape in a field, and the wall behind it is still warm at dawn. Nobody was hurt, which is the only good sentence available.',
      'He is sitting on the step being sorrier than anybody has ever been about anything. The question is not whether he did it. Everybody watched him not do it on purpose.',
    ],
    choices: [
      {
        id: 'he_stays',
        text: 'It was an accident. He stays, and nothing is said.',
        result:
          'Nothing is said, at length, for a season. He is quieter afterwards and does more than he did, and the store is a black shape until autumn.',
        tags: ['communitarian'],
        effects: { economy: -13, mood: -6 },
        setFlags: ['store_burned'],
      },
      {
        id: 'he_works_it_off',
        text: 'He rebuilds it. Every board of it, and he is watched doing it.',
        result:
          'He works the whole summer on it with somebody standing there, and the new store is better than the old one, and he does not once ask to stop.',
        tags: ['meritocratic'],
        effects: { economy: -13, mood: 4, health: -4 },
        setFlags: ['store_burned'],
      },
      {
        id: 'he_goes_now',
        text: 'He is on the road by morning. This is what it costs.',
        result:
          'He goes at first light without arguing, past the black shape in the field, and the place watches you watch him go.',
        tags: ['utilitarian'],
        effects: { economy: -13, mood: 8, crownSanity: -14 },
        setFlags: ['store_burned', 'brother_driven'],
      },
    ],
  },

  {
    id: 'w_brother_easel',
    trigger: null,
    priority: 13,
    character: 'brother',
    title: 'The Board on Three Legs',
    question:
      'Your brother has spent three years sober and has started painting the place, badly, in the middle of the square.',
    scene: [
      'He made the frame himself out of a broken hurdle and the colours out of whatever the Healer was throwing away. The first one was unrecognisable. The fourth one is the hill, and it is the hill.',
      'He stands out there most of the day now, which is a day nobody is getting work out of him, and half the place has stopped on the way past to look over his shoulder.',
    ],
    choices: [
      {
        id: 'let_him_paint',
        text: 'Leave him where he is. Let the place get used to being looked at.',
        result:
          'He is out there in every weather from then on, and the place learns what it looks like from the outside, which nobody here had ever needed to know before.',
        tags: ['communitarian'],
        effects: { culture: 14, mood: 6, economy: -4 },
        setFlags: ['brother_paints'],
        cityFlagsOn: ['easel_in_the_square'],
      },
      {
        id: 'sell_them',
        text: 'Put them on a cart. Somebody down the road has money and walls.',
        result:
          'Four go down the road in the spring and three of them sell, for more than a winter of grain, and he paints the next ones faster and they are not as good.',
        tags: ['libertarian'],
        effects: { economy: 12, culture: 4, mood: -4 },
        setFlags: ['brother_paints'],
      },
      {
        id: 'back_to_the_field',
        text: 'The field first. He can paint when the field is in.',
        result:
          'The board goes behind the long house and he is in the field by the following Monday, and works hard, and is perfectly civil about it for the rest of his life.',
        tags: ['meritocratic'],
        effects: { economy: 8, mood: -6, crownSanity: -6 },
      },
    ],
  },

  // ================================================================= the ones who come back
  /**
   * Nobody in this place is a scene. Tam said his back in the first spring,
   * and what you said to him then is the fence this valley has years later;
   * Marta was on the plot by the stream when the mill-wright came, and whether
   * she still is decides how she answers the day the place wants ground again.
   *
   * Two people, two pairs. Each pair is gated on the flag its first scene left,
   * so a reign only ever meets the one it earned, and every scene says out loud
   * what you did and how long ago, in the words the person would use for it.
   * They are urgent (priority under the line) because a wind does not wait for
   * the year's law, and they come after the brother in this list so that when
   * two of them are due in one autumn, family comes first.
   */
  {
    id: 'r1_tam_fed',
    trigger: {
      kind: 'all',
      conds: [
        { kind: 'flag', flag: 'tam_fed' },
        { kind: 'turn', op: 'gte', value: 5 },
      ],
    },
    priority: 6,
    season: 'autumn',
    character: 'tam',
    title: 'The Wind, and the Fence',
    question: 'Every fence in the valley is down but the stretch Tam mended. The stock is in the corn.',
    scene: [
      'A night of wind in October, the kind that takes a roof off, took every fence post in the valley that nobody had looked at since it went in. Nobody had looked at most of them. By first light the goats are in the corn and the corn is in the goats.',
      'One run of it is standing: the stretch by the gate. You fed Tam {{ago:v1_idle_hand}}, when he said his back, and he has been at that fence with a stool and a hammer ever since, and it did not move an inch.',
    ],
    choices: [
      {
        id: 'tam_says_where',
        text: 'Tam says where every post goes. Everybody else carries.',
        result:
          'He points from the stool and does not get up once, and it is a fence again in two days, straight, with the stock back behind it on the third. Nobody mentions his back again, in either direction.',
        tags: ['communitarian'],
        effects: { economy: 4, mood: 6, health: -2 },
      },
      {
        id: 'each_house_its_run',
        text: 'Each house mends its own run, tonight, before the corn is gone.',
        result:
          'Six people, six stretches, one night, and by morning it is a fence except for the two gaps that belong to nobody, which the goats find by noon. Tam mends those too, later, without being asked.',
        tags: ['libertarian'],
        effects: { economy: -2, health: -4, mood: 2 },
      },
      {
        id: 'pen_them_till_spring',
        text: 'The fence waits for spring. The stock lives in the yards until then.',
        result:
          'The stock lives in the yards all winter and the yards smell like it, and what was left of the corn is eaten by December. The fence goes up in April with Tam pointing, and it is a good fence, and a late one.',
        tags: ['utilitarian'],
        effects: { economy: -8, mood: -4, health: -2 },
      },
    ],
  },

  {
    id: 'r1_tam_cut',
    trigger: {
      kind: 'all',
      conds: [
        { kind: 'flag', flag: 'tam_cut' },
        { kind: 'turn', op: 'gte', value: 5 },
      ],
    },
    priority: 6,
    season: 'autumn',
    character: 'tam',
    title: 'The Wind, and No Fence',
    question: 'Every fence is down, the stock is in the corn, and the one man who knows the fence is not speaking to you.',
    scene: [
      'A night of wind in October took every fence post in the valley that nobody had looked at, and nobody had looked at any of them, because the one who used to was told {{ago:v1_idle_hand}} that he eats when he digs. He dug. The fence did not get looked at.',
      'Tam knows that fence better than anybody alive. He is standing at the biggest gap this morning with his arms folded, watching the goats come through it, and he has not said a word to you since that spring.',
    ],
    choices: [
      {
        id: 'ask_him_yourself',
        text: 'Go to him yourself, at the gap, and ask.',
        result:
          'He makes you say it twice, in front of people, and then he points from a stool and it is a fence again in two days. He still does not speak to you. He speaks to the fence, and the fence is straight.',
        tags: ['communitarian'],
        effects: { crownSanity: -6, mood: 6, economy: 2 },
      },
      {
        id: 'pay_him_like_a_stranger',
        text: 'Pay him for it, out of the store, the way you would pay a stranger.',
        result:
          'He takes the coin, does the work in a week, and on the last day hands every coin back to the store in front of the same people, which makes it the dearest fence anybody here has ever bought.',
        tags: ['utilitarian'],
        effects: { economy: -8, mood: -2, health: 2 },
      },
      {
        id: 'without_him',
        text: 'Put it up without him. Nobody is asking Tam anything.',
        result:
          'It goes up crooked in a week and comes down in the first frost in three places, and Tam watches it come down from his door and says nothing, which everybody hears.',
        tags: ['kantian'],
        effects: { economy: -4, health: -6, mood: -4 },
      },
    ],
  },

  {
    id: 'r2_marta_kept',
    trigger: {
      kind: 'all',
      conds: [
        { kind: 'flag', flag: 'marta_kept' },
        { kind: 'turn', op: 'gte', value: 8 },
        { kind: 'souls', op: 'gte', value: 10 },
      ],
    },
    priority: 6,
    character: 'marta',
    title: 'The Ground by the Stream, Again',
    question: 'The place wants the strip you once kept for her. She got to your door first.',
    scene: [
      "There are more roofs than there were and the next one wants flat ground, and the only flat ground left is the strip along the stream. It is Marta's. It has been Marta's since you kept it for her {{ago:v3_millwright}}, when a man with two mills in his hands wanted it.",
      'She has come before anybody sent for her, with the deed she does not have, to say what she will give and what she will not. She has thought about it. She has had years.',
    ],
    choices: [
      {
        id: 'the_half_she_offers',
        text: 'Take the half she offers. The rest stays hers.',
        result:
          'She gives up the wet half and keeps the dry, and the wet half is what the roofs needed anyway. She is thanked in front of people and pretends not to hear it, and plants the dry half the same week.',
        tags: ['communitarian'],
        effects: { economy: 4, mood: 6 },
      },
      {
        id: 'kept_once_not_forever',
        text: 'The place needs all of it. Kept once is not kept for ever.',
        result:
          'She does not argue. She walks the boundary once, slowly, with everybody watching, and then the place has its ground and Marta has a chair by the long house, and the two facts are mentioned together for years.',
        tags: ['utilitarian'],
        effects: { economy: 10, mood: -10, crownSanity: -4 },
      },
      {
        id: 'other_ground',
        text: 'Not hers. Find other ground, and pay the difference.',
        result:
          'The other ground is stony and further off and costs a summer more, and nobody says out loud that it was worth it, and everybody thinks so, and Marta brings the builders bread.',
        tags: ['kantian'],
        effects: { economy: -8, mood: 4, crownSanity: 2 },
      },
    ],
  },

  {
    id: 'r2_marta_moved',
    trigger: {
      kind: 'all',
      conds: [
        { kind: 'flag', flag: 'marta_moved' },
        { kind: 'turn', op: 'gte', value: 8 },
        { kind: 'souls', op: 'gte', value: 10 },
      ],
    },
    priority: 6,
    character: 'marta',
    title: 'Marta, and the Ground You Need',
    question: 'You gave her plot to the mill. Now the place needs her last strip, and she knows it.',
    scene: [
      'There are more roofs than there were and the next one wants flat ground, and the only flat ground left is the strip Marta kept when you gave her plot to the mill {{ago:v3_millwright}}. She has not planted it. She has not planted anything since.',
      'She is at your door before anybody has said the word ground, and she is not angry, which is worse. She has been waiting for this exact morning for a long time, and she has a number ready.',
    ],
    choices: [
      {
        id: 'her_price',
        text: 'Pay her price. She names it once.',
        result:
          "She names a year of the mill's flour, and it is paid, and she buys the stony ground on the far side of the stream with it and plants it, badly, out of practice, and happily.",
        tags: ['egalitarian'],
        effects: { economy: -10, mood: 6, health: 2 },
      },
      {
        id: 'take_it_as_before',
        text: "It is the place's ground. Take it, as before.",
        result:
          'She goes down the road in the spring with her mattock over her shoulder, and two houses go with her, and the mill grinds for a smaller place. Nobody here uses the word ground in front of you again.',
        tags: ['utilitarian'],
        effects: { economy: 8, mood: -12, crownSanity: -6 },
        souls: -8,
      },
      {
        id: 'the_mill_pays',
        text: 'The mill took her plot. The mill pays her for this one.',
        result:
          'The mill-wright pays, out of the flour her old plot has ground since, and is not pleased about it, and Marta buys a cow with it and names the cow after nobody in particular, loudly, in the lane.',
        tags: ['communitarian'],
        effects: { economy: 2, mood: 8, crownSanity: 2 },
      },
    ],
  },

  {
    id: 'tr_accused',
    trigger: { kind: 'lawActive', subject: 'crime' },
    priority: 6,
    character: 'tam',
    accused: { name: 'Tam', charge: 'the granary door, and what went through it' },
    title: 'The One They Are Sure About',
    question: 'You wrote down what happens to a hand that takes. Now somebody has to say whose hand it was.',
    scene: [
      'The granary door was open in the night and it is not open now, and there is less in there than the count says. Two people put Tam on that path at that hour. They agree about the hour.',
      'He says he could not sleep and was walking. It is the voice he used about his back, years ago, in front of most of the same faces, and his back was the first thing this place ever decided about him.',
      '{{lean}}',
      'That is all there is. Nobody is going to find any more of it, and everyone is waiting for you to say which way it falls.',
    ],
    choices: [
      {
        id: 'convict',
        text: 'He did it. Say so, and let your own law do what it says.',
        result:
          'The law does what it says, in front of everybody, and it is over faster than the argument was. The path past the granary is quiet after that, and people say so out loud, often.',
        tags: ['utilitarian'],
        verdict: 'guilty',
        effects: { mood: 8, army: 4 },
      },
      {
        id: 'acquit',
        text: 'Not proven. He goes home, and the door gets a better lock.',
        result:
          'He goes home. The two who were sure stop speaking to the two who were not, the grain stays gone, and the new lock costs more than the grain did.',
        tags: ['kantian'],
        verdict: 'innocent',
        effects: { mood: -6, economy: -4 },
      },
      {
        id: 'no_verdict',
        text: 'No verdict. He works the loss off at the granary, in the open.',
        result:
          'He carries sacks for a month with everybody watching, and by the second week people have started talking to him while he does it. Whether he opened the door is a question the place agrees to stop asking, and it stays agreed, mostly.',
        tags: ['communitarian'],
        effects: { economy: 6, mood: 2, crownSanity: -4 },
      },
    ],
  },

  {
    id: 'tr_accused_wrong',
    trigger: null,
    priority: 3,
    character: 'clerk',
    title: 'The Count, Read Again',
    question: 'Nobody is asking you for anything. The Clerk has simply brought the book.',
    scene: [
      'The Clerk has been back through four winters of the granary book and found the same hand adding the same column wrong, in the same direction, every year, from long before the night the door was open.',
      'The hand belongs to a man who has never been suspected of anything and is not now, because he has been dead since the thaw, and because nobody wants to say the next part out loud.',
      'What was done to Tam under your law was done four years ago, in front of everybody, and it cannot be undone in front of anybody.',
    ],
    choices: [
      {
        id: 'read_it_out',
        text: 'Read the column out, in the square, with his name in it.',
        result:
          'You read it to the end in front of everybody, including the part with his name in it, and there is no part of it that anybody enjoys. The book is copied out fair, both entries kept, and one copy goes where you will see it every day.',
        tags: ['kantian'],
        effects: { crownSanity: -14, mood: -8, culture: 6 },
      },
      {
        id: 'close_the_book',
        text: 'Close the book. The Clerk is thanked and told nothing more is needed.',
        result:
          'The book is closed and shelved, and the Clerk shelves it himself, slowly. Nobody in the square ever learns what was in the column, and two people who already suspected go on suspecting, quietly, for years.',
        tags: ['utilitarian'],
        effects: { crownSanity: -6, culture: -8 },
      },
    ],
  },

  {
    id: 'tr_accused_again',
    trigger: null,
    priority: 5,
    character: 'tam',
    title: 'Tam, and the Same Path',
    question: 'The same man, the same hour, a heavier door.',
    scene: [
      'It is the long house this time, and it is not grain, and Tam was on the path again, seen by the same two people who now agree about everything.',
      'He does not say he could not sleep. He does not say anything at all, and he does not look surprised to be standing here.',
    ],
    choices: [
      {
        id: 'out_for_good',
        text: 'Out, and for good.',
        result:
          'He goes down the road with a bag he packed himself. The long house gets a lock, the lock gets a key, and the key gets an argument about who holds it that outlasts him by years.',
        tags: ['utilitarian'],
        effects: { army: 8, mood: 4, economy: -2 },
      },
      {
        id: 'kept_in_sight',
        text: 'He is kept where he can be seen, and fed there.',
        result:
          'He sleeps in the long house with the door open and works the yard where four windows look at it. Nothing goes missing again. Nobody is comfortable, and nothing goes missing again.',
        tags: ['communitarian'],
        effects: { mood: -4, economy: 4, culture: 4 },
      },
    ],
  },
];
