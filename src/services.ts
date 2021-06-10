/**
 * This module re-exports and re-initialises object service classes for
 * neater importing.
 *
 * @category Services
 * @category Re-export
 *
 * @module Services
 * @hidden
 *
 * @todo Can services be initialised in their own files?
 */

import { UsersService } from './users/users.service';
import GamesService from './games/games.service';
import SecurityAreasService from './games/securityAreas.service';
import ControlsService from './games/controls.service';
import EventsService from './games/events.service';
import OrganisationsService from './organisations/organisations.service';

const usersService = new UsersService();
const gamesService = new GamesService();
const securityAreasService = new SecurityAreasService();
const controlsService = new ControlsService();
const eventsService = new EventsService();
const organisationsService = new OrganisationsService();

export { usersService, gamesService, securityAreasService, controlsService, eventsService, organisationsService };
