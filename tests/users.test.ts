import chai from 'chai';
import chaiHttp from 'chai-http';
import { Types } from 'mongoose';

import config from '../src/config';
import { connection, User } from '../src/_helpers/db';
import { UserClass } from '../src/models';
import { server } from '../src/server';
import { usersService } from '../src/services';

const should = chai.should();
chai.use(chaiHttp);

const defaultUser = {
  username: 'test@test.test',
  password: '1234',
};

describe('Users', () => {
  const basePath: string = `/users`;
  const registerPath: string = `${basePath}/register`;
  const loginPath: string = `${basePath}/login`;
  const refreshTokenPath: string = `${basePath}/refresh-token`;

  before((done) => {
    if (config.env !== 'test') throw new Error("NODE_ENV !== 'test'! Aborting!");

    if (connection.readyState == 1) done();
    //console.debug('Database connected');
    else throw 'No database connection! Aborting!';
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

  describe(`/POST ${registerPath}`, () => {
    it('should fail without an email address', () => {
      return chai
        .request(server)
        .post(registerPath)
        .send({ newDetails: { password: '1234' } })
        .then((res) => {
          res.should.have.status(400);
          res.body.message.should.equal('Missing required field: "username"');
        });
    });

    it('should fail without password', () => {
      return chai
        .request(server)
        .post(registerPath)
        .send({ newDetails: { username: 'test@test.test' } })
        .then((res) => {
          res.should.have.status(400);
          res.body.message.should.equal('Missing required field: "password"');
        });
    });

    it('should fail on duplicate email address', () => {
      return chai
        .request(server)
        .post(registerPath)
        .send({ newDetails: defaultUser })
        .then((res) => {
          res.should.have.status(201);
          chai
            .request(server)
            .post(registerPath)
            .send({ newDetails: { username: defaultUser.username, password: defaultUser.password } })
            .then((res) => {
              res.should.have.status(409);
              res.body.message.should.equal('Item already exists');
            });
        });
    });

    it('should register a new user', () => {
      return chai
        .request(server)
        .post(registerPath)
        .send({ newDetails: defaultUser })
        .then((res) => {
          res.should.have.status(201);
        });
    });
  });

  describe(`/POST ${loginPath}`, () => {
    it('should fail without a username', () => {
      return chai
        .request(server)
        .post(loginPath)
        .send({ password: defaultUser.password })
        .then((res) => {
          res.should.have.status(400);
          res.body.message.should.equal('Validation error: "username" is required');
        });
    });

    it('should fail without a password', () => {
      return chai
        .request(server)
        .post(loginPath)
        .send({ username: defaultUser.username })
        .then((res) => {
          res.should.have.status(400);
          res.body.message.should.equal('Validation error: "password" is required');
        });
    });

    it('should fail with invalid username', () => {
      return chai
        .request(server)
        .post(registerPath)
        .send({ newDetails: defaultUser })
        .then((res) => {
          res.should.have.status(201);

          chai
            .request(server)
            .post(loginPath)
            .send({ username: 'test2@test.test', password: defaultUser.password })
            .then((res) => {
              res.should.have.status(400);
              res.body.message.should.equal('Username or password is incorrect');
            });
        });
    });

    it('should fail with invalid password', () => {
      return chai
        .request(server)
        .post(registerPath)
        .send({ newDetails: defaultUser })
        .then((res) => {
          res.should.have.status(201);

          chai
            .request(server)
            .post(loginPath)
            .send({ username: defaultUser.username, password: 'bad' })
            .then((res) => {
              res.should.have.status(400);
              res.body.message.should.equal('Username or password is incorrect');
            });
        });
    });

    it('should pass with valid credentials', () => {
      return chai
        .request(server)
        .post(registerPath)
        .send({ newDetails: defaultUser })
        .then((res) => {
          res.should.have.status(201);

          chai
            .request(server)
            .post(loginPath)
            .send({ username: defaultUser.username, password: defaultUser.password })
            .then((res) => {
              res.should.have.status(200);
              res.body.jwtToken.should.exist;
              res.should.have.cookie('refreshToken');
            });
        });
    });
  });

  describe(`/POST ${refreshTokenPath}`, () => {
    it('should fail without a `refreshToken` cookie', () => {
      return chai
        .request(server)
        .post(refreshTokenPath)
        .send()
        .then((res) => {
          res.should.have.status(401);
          res.body.message.should.equal('No `refreshToken` cookie found.');
        });
    });

    it('should return a new `refreshToken` cookie', () => {
      return chai
        .request(server)
        .post(registerPath)
        .send({ newDetails: defaultUser })
        .then((res) => {
          res.should.have.status(201);

          chai.request
            .agent(server)
            .post(loginPath)
            .send({ username: defaultUser.username, password: defaultUser.password })
            .then((res) => {
              res.should.have.status(200);
              console.debug(res);
              res.should.have.cookie('refreshToken');

              chai.request
                .agent(server)
                .post(refreshTokenPath)
                .send()
                .then((res) => {
                  res.should.have.status(201);
                  res.should.have.cookie('refreshToken');
                  // TODO: compare cookie with previous to ensure it has changed
                });
            });
        });
    });
  });
});
