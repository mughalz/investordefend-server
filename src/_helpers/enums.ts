/**
 * This module collects various enumerations used throughout the project to
 * aid code readbility.
 *
 * It also contains OpenAPI definitions of each enum.
 *
 * @category Helpers
 *
 * @module Enums
 */

/**
 * Represents possible size values that can be applied to organisations.
 *
 * These values are derived from the [Companies Act 2006][ca2006]. Whilst the
 * full definitions include considerations around annual turnover and balance
 * sheet totals, the delineations based on the number of employees are:
 *
 * - Micro: ≤10;
 * - Small: ≤50;
 * - Medium: ≤250; and
 * - Large: >250.
 *
 * [ca2006]: https://www.legislation.gov.uk/ukpga/2006/46/contents
 *
 * @swagger
 * components:
 *   schemas:
 *     Size:
 *       type: string
 *       enum:
 *         - Micro
 *         - Small
 *         - Medium
 *         - Large
 */
export enum SIZE {
  MICRO,
  SMALL,
  MEDIUM,
  LARGE,
}

/**
 * Represents possible size values that can be applied to organisations.
 *
 * See {@link Enums.SIZE} for a detailed
 * explanation.
 *
 * @todo Refactor into settings.
 */
export const sizes = ['Micro', 'Small', 'Medium', 'Large'];

/**
 * Represents possible industry values that can be applied to organisations.
 *
 * These values are derived from the 2020 verion of the [Standard Occupational
 * Classification][soc2020] (SOC) standard.
 *
 * [soc2020]: https://www.ons.gov.uk/methodology/classificationsandstandards/standardoccupationalclassificationsoc/soc2020
 *
 * @todo Refactor into settings.
 *
 * @swagger
 * components:
 *   schemas:
 *     Industry:
 *       type: string
 *       enum:
 *         - Agriculture, Forestry and Fishing
 *         - Mining and quarrying
 *         - Manufacturing
 *         - Electricity, Gas, Steam and air conditioning
 *         - Water supply, sewerage, waste management and remediation activities
 *         - Construction
 *         - Wholesale and retail trade; repair of motor vehicles and motorcycles
 *         - Transport and storage
 *         - Accommodation and food service activities
 *         - Information and communication
 *         - Financial and insurance activities
 *         - Real estate activities
 *         - Professional, scientific and technical activities
 *         - Administrative and support service activities
 *         - Public administration and defence; compulsory social security
 *         - Education
 *         - Human health and social work activities
 *         - Arts, entertainment and recreation
 *         - Other service activities
 *         - Activities of households as employers, undifferentiated goods and service producing activities of households for own use
 *         - Activities of extraterritorial organisations and bodies
 *       description: The organisation's industry.
 *       example: Mining and quarrying
 */
export const industries = {
  A: 'Agriculture, Forestry and Fishing',
  B: 'Mining and quarrying',
  C: 'Manufacturing',
  D: 'Electricity, Gas, Steam and air conditioning',
  E: 'Water supply, sewerage, waste management and remediation activities',
  F: 'Construction',
  G: 'Wholesale and retail trade; repair of motor vehicles and motorcycles',
  H: 'Transport and storage',
  I: 'Accommodation and food service activities',
  J: 'Information and communication',
  K: 'Financial and insurance activities',
  L: 'Real estate activities',
  M: 'Professional, scientific and technical activities',
  N: 'Administrative and support service activities',
  O: 'Public administration and defence; compulsory social security',
  P: 'Education',
  Q: 'Human health and social work activities',
  R: 'Arts, entertainment and recreation',
  S: 'Other service activities',
  T:
    'Activities of households as employers, undifferentiated goods and service producing activities of households for own use',
  U: 'Activities of extraterritorial organisations and bodies',
};

/**
 * Represents possible asset location values that can be assigned to assets.
 *
 * @swagger
 * components:
 *   schemas:
 *     AssetLocation:
 *       type: string
 *       enum:
 *         - Organisation
 *         - Internet
 */
export enum AssetLocation {
  Organisation = 'Organisation',
  Internet = 'Internet',
}

/**
 * Represents possible state values that can be assigned to games.
 *
 * The game loop runs as follows:
 *
 * - Purchasing:
 *   - users are given money to spend on controls; and
 *   - purchasing decisions are revocable.
 * - Simulating:
 *   - players' control purchases are locked in;
 *   - any remaining money becomes investment into their organisation;
 *   - Monte Carlo simulation(s) are run to generate events for the turn; and
 *   - those events are applied to the organisation(s) in the game to assess
 *     costs.
 * - Results:
 *   - players review the results of the last turn; but
 *   - this is not used server-side, but is included here so that this enum
 *     mirrors the client-side enum.
 * - Ended:
 *   - players review the overall results of their game and their final score; and
 *   - no further actions may be taken.
 *
 * @swagger
 * components:
 *   schemas:
 *     GameState:
 *       type: string
 *       enum:
 *         - Purchasing
 *         - Simulating
 *         - Results
 *         - Ended
 */
export enum GameState {
  Purchasing,
  Simulating,
  DONOTUSE_Results, // Not used server-side.
  Ended,
}

/**
 * Represents possible game type values that can be assigned to games.
 *
 * The game types are as follows:
 *
 * - SinglePlayer:
 *   - one organisation, one player.
 * - Cooperative:
 *   - one organisation, multiple players;
 *   - players vote on action to take.
 * - Competitive:
 *   - multiple organisations, one player per organisation.
 *
 * @swagger
 * components:
 *   schemas:
 *     GameType:
 *       type: string
 *       enum: [single-player, co-operative multiplayer, competitive multiplayer]
 */
export enum GameType {
  SinglePlayer,
  Cooperative,
  Competitive,
}

/**
 * Returns a random value from an enum.
 *
 * @link https://stackoverflow.com/a/55699349
 */
export function randomEnum<T>(anEnum: T): T[keyof T] {
  const enumValues = (Object.keys(anEnum)
    .map((n) => Number.parseInt(n))
    .filter((n) => !Number.isNaN(n)) as unknown) as T[keyof T][];
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  const randomEnumValue = enumValues[randomIndex];
  return randomEnumValue;
}
