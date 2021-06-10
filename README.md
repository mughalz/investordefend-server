# Invest or Defend (Server)

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

An educational game designed to teach the principles and value of quantitative
IT security risk calculation.

This repo. contains the server application; the Web client is available [here][client-repo].

## Table of Contents

* [Tech Stack](#tech-stack)
* [Features](#features)
* [Installation](#installation)
* [Usage](#usage)
* [Tests](#tests)
* [Documentation](#documentation)
* [Acknowledgments](#acknowledgements)
* [License](#license)
* [Contact Information](#contact-information)

## Technology Stack

The game server is written in [TypeScript][typescript].

The MongoDB database uses the [MongoDB Query Language][mql].

| Technology | Description                      | Link       |
|------------|----------------------------------|-----------------|
| Node.js    | JavaScript server runtime     | [Link][nodejs]  |
| Express    | JavaScript server framework   | [Link][express] |
| MongoDB    | NoSQL document-oriented database | [Link][mongodb] |

## Features

This repo. provides:

* a RESTful server application for running the _Invest or Defend_ game;
* JSON files for importing security area and control collections derived from:
  * the original _Invest or Defend_ game; and
  * the ISO/IEC 27000-series set of information security standards.
* a full suite of automated linting functions to ensure codebase
  standardisation; and
* a comprehensive suite of automated tests.

## Installation

1. Install [MongoDB][mongodb]:
    * we recommend using [MongoDB Compass][mongodb-compass] as a GUI (the
      remaining steps assume you are using this tool); and
    * if you are working in a development environment, set up a local MongoDB server
      called `invest-or-defend` and ensure that `mongod` is running.
1. connect to your MongoDB server (either local or remote) in Compass;
1. add a database called `invest-or-defend`;
1. ensure you have added the server connection details to your config (see the
   [contributing instructions][contributing-config]);
1. install Node.js:
    * the project currently targets Node v15;
    * we recommend using [nvm][nvm] to manage multiple Node installations in
      a development environment.
1. clone the repo. to your dev. environment:
    * `git clone git@delta.lancs.ac.uk:secure-digitalisation/invest-or-defend/server.git`
1. enter the new folder (`cd Server`); and
1. install NPM packages (`npm install`):
    * once all the packages are installed, the initial database collections
      (`settings`, `securityareas` and `controls`) will be imported from the
      `contrib/` directory;
    * additional steps will have to be taken if using a remotely-hosted MongoDB
      database.

## Usage

### Development

Run `npm run start:dev` to start in development mode using [nodemon][nodemon].

### Production

* Run `npm run build` to build the app. for production.
* Run `npm run start` to start the app. in production mode.

_NB: Neither of these commands have been tested yet._

## Tests

When the server is running:

* go to `https://⟨ server ⟩/coverage/lcov-report` to view codebase test coverage.

## Documentation

When the server is running:

* go to `https://⟨ server ⟩/docs` to view codebase documentation;
* go to `https://⟨ server ⟩/docs/api` to view API documentation.

## Acknowledgements

This game adapts a pre-existing training exercise activity created as part of
the [Secure Digitalisation][secdig] project at Lancaster University.

This game was initially developed by [Ben Goldsworthy][bg] as part of
[KTP № 11598][ktp], with funding provided by [Innovate UK][innovate-uk] &
[Mitigate Cyber][mitigate].

Continued development on this game has been supported by the
[Greater Manchester Cyber Foundry][gmcf].

This game was inspired by Hubbard & Seiersen's book _How to Measure Anything in
Cybersecurity Risk_.

## License

This project is currently released under the [CRAPL][crapl]. It should **NOT**
be used in a production environment in its current state.

## Contact Information

| Name          | Link(s)               |
|---------------|-----------------------|
|Zaffar Mughal  | [Email][zmughal]      |
|Jon Lomas      | [Email][jlomas]       |
|Dr Dan Prince  | [Email][dprince]      |

[client-repo]: https://delta.lancs.ac.uk/secure-digitalisation/invest-or-defend/client
[typescript]: https://www.typescriptlang.org/
[mql]: https://docs.mongodb.com/manual/reference/sql-comparison/
[nodejs]: https://nodejs.org/
[contributing-config]: https://delta.lancs.ac.uk/secure-digitalisation/invest-or-defend/server/blob/main/CONTRIBUTING.md#configuration
[express]: https://expressjs.com/
[mongodb]: https://www.mongodb.com/
[csbs2020]: https://www.gov.uk/government/statistics/cyber-security-breaches-survey-2020
[mongodb-compass]: https://www.mongodb.com/products/compass
[nodemon]: https://nodemon.io/
[nvm]: https://github.com/nvm-sh/nvm
[secdig]: https://www.lancaster.ac.uk/cybersecurity/secure-digitalisation/#d.en.470966
[ktp]: https://info.ktponline.org.uk/action/details/partnership.aspx?id=11598
[innovate-uk]: https://www.gov.uk/government/organisations/innovate-uk
[mitigate]: http://mitigatecyber.com/
[gmcf]: https://gmcyberfoundry.ac.uk/
[crapl]: https://matt.might.net/articles/crapl/
[bg]: https://bengoldsworthy.net
[zmughal]: mailto:z.mughal1@lancaster.ac.uk
[jlomas]: mailto:j.lomas1@lancaster.ac.uk
[dprince]: mailto:d.prince@lancaster.ac.uk
