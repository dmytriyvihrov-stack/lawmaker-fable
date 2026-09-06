import type { Season } from '../../../engine/types';

/**
 * What the year does to the colour of the place.
 *
 * The town never changes shape with the season. The light on it does, and so
 * does everything growing in it, and so does what is underfoot, and that is
 * the whole difference between a year passing and a number going up.
 *
 * Nothing in here is a filter over the picture. Every field is a colour some
 * particular thing is painted with, so a season can move the snowline onto a
 * roof and leave the roof itself alone.
 */

/** What falls out of the sky, if anything does. */
export type Fall = 'none' | 'petals' | 'rain' | 'leaves' | 'snow';

/** What is growing in the field, which is the plainest clock the place has. */
export type Crop = 'shoots' | 'full' | 'stubble' | 'bare';

/** What the near meadow is doing under the popup. */
export type Meadow = 'flowers' | 'green' | 'dry' | 'snow';

export interface TownPaint {
  /** The air, from the top of the picture down to the hills. */
  skyTop: string;
  skyMid: string;
  skyLow: string;
  /** The band of vapour that sits on the range and makes it far away. */
  haze: string;
  hazeOpacity: number;
  /** The ground, three stops from the hills to the near meadow. */
  groundTop: string;
  groundMid: string;
  groundLow: string;
  /** The hills a morning's walk out. */
  hills: string;
  /** The range on the right, lit face and shaded face. */
  rockLit: string;
  rockDim: string;
  /** How far down the range the snow goes. 0 is none, 1 is all of it. */
  snowLine: number;
  /** The three ranks of wood, from the horizon in. */
  crownFar: string;
  crownMid: string;
  crownNear: string;
  crownHigh: string;
  crownLow: string;
  trunk: string;
  bushDark: string;
  bushLight: string;
  /** The wood is bare: trunks and twigs, and whatever snow is caught in them. */
  bare: boolean;
  /** The shaded ground under the front rank, which is what makes a wood deep. */
  woodFloor: string;
  /** The soft shadow every standing thing sits in. */
  shade: string;
  shadeOpacity: number;
  /** The rows in the field, and the crop standing in them. */
  fieldRow: string;
  fieldSoil: string;
  crop: Crop;
  /** Stacked harvest at the edge of the ground that grew it. */
  sheaves: boolean;
  meadow: Meadow;
  /** The river, deep water and shallow. */
  waterDeep: string;
  waterLight: string;
  /**
   * The river is a lid. Nothing moves on it, nothing glints, nobody stands
   * at it with a rod, and the boat is up on the bank until the thaw.
   */
  ice: boolean;
  /** The road, which goes pale in a frost and dark in the rain. */
  road: string;
  /** Snow on every pitched roof in the place. */
  roofSnow: boolean;
  /** The stone in the crag, which is the one thing that does not grow. */
  rock: string;
  rockShade: string;
  /** The sun, where it stands and how hard it burns. Winter gets none. */
  sun: { x: number; y: number; r: number; tint: string; warm: string; glow: number } | null;
  /** The cold months get a moon instead, and something to see by. */
  moon: { x: number; y: number; r: number } | null;
  stars: number;
  clouds: number;
  cloudTint: string;
  cloudOpacity: number;
  birds: number;
  weather: Fall;
  /**
   * And rain on top of it.
   *
   * A season has one thing falling out of it, which left the rain written and
   * never used: no month of the year asked for it, so a whole sheet of weather
   * sat in the code doing nothing. The wet months are the wet months, and they
   * are also the months the leaves come off, so the one season that needs both
   * gets both, and the rain comes down behind the leaves rather than instead
   * of them.
   */
  rains: boolean;
  /** How many chimneys are going. Nobody lights a fire in July. */
  smoke: number;
  /** A wash laid over the whole picture, which is the light of the day. */
  wash: string;
  washOpacity: number;
}

/**
 * The four years, and how far apart they are allowed to stand.
 *
 * The first pass at these was four sets of the same olive, a degree apart, and
 * the player could not tell a spring from an autumn without reading the dial.
 * They are pulled well apart now: spring is cold blue light on new green,
 * summer is a haze with the colour burned out of the top of it, autumn is rust
 * and amber under a lilac sky with the sun down at the trees, and winter is a
 * blue night with the ground brighter than the air over it. Nothing here is a
 * filter, so the distance is made of the same fields every season paints.
 */
export const PAINT: Record<Season, TownPaint> = {
  spring: {
    skyTop: '#6d95b6',
    skyMid: '#a4c7cf',
    skyLow: '#d5e3d3',
    haze: '#cfe0d8',
    hazeOpacity: 0.55,
    groundTop: '#5e7c4a',
    groundMid: '#769458',
    groundLow: '#8cab68',
    hills: '#658b52',
    rockLit: '#8399ab',
    rockDim: '#728aa1',
    snowLine: 0.42,
    crownFar: '#8aa691',
    crownMid: '#67894f',
    crownNear: '#4f7a3f',
    crownHigh: '#7aa455',
    crownLow: '#547d41',
    trunk: '#6b5744',
    bushDark: '#568043',
    bushLight: '#6c9550',
    bare: false,
    woodFloor: '#33532c',
    shade: '#3d4a34',
    shadeOpacity: 0.26,
    fieldRow: '#6d9646',
    fieldSoil: '#957f52',
    crop: 'shoots',
    sheaves: false,
    meadow: 'flowers',
    waterDeep: '#4b7b90',
    waterLight: '#659db1',
    ice: false,
    road: '#9a8461',
    roofSnow: false,
    rock: '#a2988a',
    rockShade: '#89806f',
    sun: { x: 146, y: 112, r: 30, tint: '#f4eddc', warm: '#e6e4b4', glow: 0.08 },
    moon: null,
    stars: 0,
    clouds: 4,
    cloudTint: '#f1f6f2',
    cloudOpacity: 0.62,
    birds: 6,
    weather: 'petals',
    rains: false,
    smoke: 1,
    wash: '#cfe6d8',
    washOpacity: 0.05,
  },

  summer: {
    skyTop: '#6f9fba',
    skyMid: '#b8cfc7',
    skyLow: '#e0e0bf',
    haze: '#ddd8b8',
    hazeOpacity: 0.85,
    groundTop: '#5f7a44',
    groundMid: '#77904e',
    groundLow: '#91a55c',
    hills: '#6c8449',
    rockLit: '#84959d',
    rockDim: '#758893',
    snowLine: 0.08,
    crownFar: '#73917d',
    crownMid: '#547650',
    crownNear: '#3f6539',
    crownHigh: '#60894c',
    crownLow: '#456c3c',
    trunk: '#6b5744',
    bushDark: '#4f7040',
    bushLight: '#5f7f46',
    bare: false,
    woodFloor: '#2c4326',
    shade: '#3a4830',
    shadeOpacity: 0.34,
    fieldRow: '#b3ab4c',
    fieldSoil: '#94903e',
    crop: 'full',
    sheaves: false,
    meadow: 'flowers',
    waterDeep: '#48788c',
    waterLight: '#5d95aa',
    ice: false,
    road: '#a89065',
    roofSnow: false,
    rock: '#a89c88',
    rockShade: '#8e8369',
    sun: { x: 152, y: 84, r: 36, tint: '#fdf3d8', warm: '#f2d493', glow: 0.16 },
    moon: null,
    stars: 0,
    clouds: 1,
    cloudTint: '#f4f7ec',
    cloudOpacity: 0.5,
    birds: 2,
    weather: 'none',
    rains: false,
    smoke: 0,
    wash: '#f5e2a4',
    washOpacity: 0.09,
  },

  autumn: {
    skyTop: '#8a93a6',
    skyMid: '#c7bda6',
    skyLow: '#e3d3a8',
    haze: '#d9cda6',
    hazeOpacity: 0.78,
    groundTop: '#8a7b40',
    groundMid: '#9c8b48',
    groundLow: '#ae9c56',
    hills: '#8a7c3f',
    rockLit: '#8f939a',
    rockDim: '#7e848d',
    snowLine: 0.36,
    crownFar: '#a89b74',
    crownMid: '#a07d38',
    crownNear: '#a85f28',
    crownHigh: '#d19a39',
    crownLow: '#8d5a24',
    trunk: '#6b5744',
    bushDark: '#8a6c30',
    bushLight: '#a78b38',
    bare: false,
    woodFloor: '#57472a',
    shade: '#4d4429',
    shadeOpacity: 0.32,
    fieldRow: '#c6a656',
    fieldSoil: '#8f7442',
    crop: 'stubble',
    sheaves: true,
    meadow: 'dry',
    waterDeep: '#476b7c',
    waterLight: '#5a8494',
    ice: false,
    road: '#93794f',
    roofSnow: false,
    rock: '#a09585',
    rockShade: '#867c6b',
    sun: { x: 214, y: 150, r: 27, tint: '#f6d194', warm: '#e2a563', glow: 0.13 },
    moon: null,
    stars: 0,
    clouds: 6,
    cloudTint: '#e4d8ba',
    cloudOpacity: 0.68,
    birds: 10,
    weather: 'leaves',
    rains: true,
    smoke: 2,
    wash: '#e8bc70',
    washOpacity: 0.11,
  },

  winter: {
    skyTop: '#3c4b5c',
    skyMid: '#6d808f',
    skyLow: '#a3b2b5',
    haze: '#bcc7c6',
    hazeOpacity: 0.8,
    groundTop: '#c2cccc',
    groundMid: '#d3dad7',
    groundLow: '#e4e9e2',
    hills: '#b2bdbc',
    rockLit: '#8794a3',
    rockDim: '#74828f',
    snowLine: 1,
    crownFar: '#9fabab',
    crownMid: '#818d89',
    crownNear: '#5d6a5f',
    crownHigh: '#77827a',
    crownLow: '#525e52',
    trunk: '#584839',
    bushDark: '#6b7469',
    bushLight: '#828b7d',
    bare: true,
    woodFloor: '#717c7a',
    shade: '#6b7a82',
    shadeOpacity: 0.2,
    fieldRow: '#d5dbd7',
    fieldSoil: '#b7bfbb',
    crop: 'bare',
    sheaves: false,
    meadow: 'snow',
    waterDeep: '#9fb4bb',
    waterLight: '#d6e1e3',
    ice: true,
    road: '#c9cdc7',
    roofSnow: true,
    rock: '#9c9a94',
    rockShade: '#83817b',
    sun: null,
    moon: { x: 1160, y: 102, r: 28 },
    stars: 34,
    clouds: 7,
    cloudTint: '#cfd7d7',
    cloudOpacity: 0.46,
    birds: 0,
    weather: 'snow',
    rains: false,
    smoke: 4,
    wash: '#8fb0c8',
    washOpacity: 0.18,
  },
};
