/**
 * This module re-exports and re-initialises object controller classes for
 * neater importing.
 *
 * @category Controllers
 * @category Re-export
 *
 * @module Controllers
 * @hidden
 *
 * @todo Can controllers be initialised in their own files?
 */

import UsersController from './users/users.controller';
import GamesController from './games/games.controller';
import SecurityAreasController from './games/securityAreas.controller';
import ControlsController from './games/controls.controller';
import EventsController from './games/events.controller';
import OrganisationsController from './organisations/organisations.controller';

const usersController = new UsersController();
const gamesController = new GamesController();
const securityAreasController = new SecurityAreasController();
const controlsController = new ControlsController();
const eventsController = new EventsController();
const organisationsController = new OrganisationsController();

export const usersRouter = usersController.router;
export const gamesRouter = gamesController.router;
export const securityAreasRouter = securityAreasController.router;
export const controlsRouter = controlsController.router;
export const eventsRouter = eventsController.router;
export const organisationsRouter = organisationsController.router;
