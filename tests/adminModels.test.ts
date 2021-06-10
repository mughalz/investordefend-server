import chai from 'chai';
import chaiHttp from 'chai-http';
import chaiSubset from 'chai-subset';
import { Types } from 'mongoose';

import config from '../src/config';
import { connection, User, Organisation } from '../src/_helpers/db';
import { OrganisationClass, UserClass } from '../src/models';
import { server } from '../src/server';
import { usersService } from '../src/services';

const should = chai.should();
chai.use(chaiHttp);
chai.use(chaiSubset);

const defaultUser = {
  username: 'test@test.test',
  password: '1234',
};

const defaultModel = {
  control: {
    name: 'Test Control',
    cost: 1000.0,
  },
  securityArea: {
    number: 'TEST',
    name: 'Test SecurityArea',
    source: 'Test Source',
  },
};

const registerPath: string = '/users/register';
const loginPath: string = '/users/login';

const models = ['control', 'securityArea'];

models.forEach((model) => {
  const basePath: string = `/${model}s`;
  const createPath: string = `${basePath}/create`;
  const getAllPath: string = `${basePath}/`;

  describe(`'${model}' admin. route tests`, () => {
    before((done) => {
      if (config.env !== 'test') throw new Error("NODE_ENV !== 'test'! Aborting!");

      if (connection.readyState == 1) console.log('Database connected');
      else throw 'No database connection! Aborting!';

      done();
    });

    beforeEach(async () => {
      const collections = await connection.db.listCollections().toArray();

      await collections
        .map((collection) => collection.name)
        .forEach(async (collectionName) => {
          connection.db.dropCollection(collectionName);
        });
    });

    afterEach(async () => {
      const collections = await connection.db.listCollections().toArray();

      await collections
        .map((collection) => collection.name)
        .forEach(async (collectionName) => {
          connection.db.dropCollection(collectionName);
        });
    });

    after((done) => {
      done();
      /*connection.db
        .dropDatabase()
        .then(() => {
          connection
            .close()
            .then(() => done())
            .catch((err) => console.error(err));
        })
        .catch((err) => console.error(err));*/
    });
  });
});
